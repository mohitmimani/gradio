import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from "@/lib/auth";
import { db, assignmentSubmissions, aiAnalysisResults } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { env } from "@/env.mjs";

interface AnalysisResult {
  isAiGenerated: boolean;
  confidenceScore: number;
  detectedPatterns: string[];
  aiDetectionReason: string;
  handwritingConfidence: number;
  textExtracted: string;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { submissionId } = await req.json();

    if (!submissionId) {
      return NextResponse.json({ error: "Submission ID is required" }, { status: 400 });
    }

    // Get submission details
    const submission = await db
      .select()
      .from(assignmentSubmissions)
      .where(eq(assignmentSubmissions.id, submissionId))
      .limit(1);

    if (submission.length === 0) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    const submissionData = submission[0];

    // Update submission status to analyzing
    await db
      .update(assignmentSubmissions)
      .set({ status: "analyzing" })
      .where(eq(assignmentSubmissions.id, submissionId));

    try {
      // Initialize Gemini AI
      const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      let analysisResult: AnalysisResult;

      // Check if file is an image (for handwriting detection)
      const isImage = submissionData.mimeType.startsWith("image/");

      // For Vercel deployment, we need to get file data from database or storage
      // In production, you'd fetch from cloud storage using submissionData.filePath
      const fileData = "dummy_base64_data"; // Replace with actual file data retrieval

      if (isImage) {
        // For images, analyze for handwriting vs digital text
        analysisResult = await analyzeImageFile(model, fileData);
      } else {
        // For text files, analyze content for AI patterns
        analysisResult = await analyzeTextFile(model, fileData);
      }

      // Save analysis results to database
      const analysisRecord = await db.insert(aiAnalysisResults).values({
        submissionId: submissionId,
        analysisType: "content_detection",
        isAiGenerated: analysisResult.isAiGenerated,
        confidenceScore: analysisResult.confidenceScore,
        detectedPatterns: JSON.stringify(analysisResult.detectedPatterns),
        aiDetectionReason: analysisResult.aiDetectionReason,
        handwritingConfidence: analysisResult.handwritingConfidence,
        textExtracted: analysisResult.textExtracted,
      }).returning();

      // Update submission status
      await db
        .update(assignmentSubmissions)
        .set({
          status: "analyzed",
          analyzedAt: new Date()
        })
        .where(eq(assignmentSubmissions.id, submissionId));

      return NextResponse.json({
        success: true,
        analysis: analysisRecord[0],
        message: "Analysis completed successfully",
      });

    } catch (analysisError) {
      console.error("Analysis error:", analysisError);

      // Update submission status to error
      await db
        .update(assignmentSubmissions)
        .set({ status: "error" })
        .where(eq(assignmentSubmissions.id, submissionId));

      return NextResponse.json(
        { error: "Failed to analyze file", details: analysisError instanceof Error ? analysisError.message : "Unknown error" },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Error in analyze endpoint:", error);
    return NextResponse.json(
      { error: "Failed to process analysis request" },
      { status: 500 }
    );
  }
}

async function analyzeImageFile(model: any, fileData: string): Promise<AnalysisResult> {
  // For Vercel deployment, fileData is already base64 encoded
  const base64Image = fileData;

  const prompt = `Analyze this image to determine if it contains:
1. Handwritten text/content
2. AI-generated or digitally created content
3. Typed/printed text

Please provide a detailed analysis with the following information:
- Is this content AI-generated or handwritten?
- Confidence score (0-100) for AI detection
- Confidence score (0-100) for handwriting detection
- What patterns suggest AI generation vs human handwriting?
- Extract any visible text from the image
- Specific reasons for your determination

Look for these AI-generated content indicators:
- Perfect uniformity in digital art/graphics
- Typical AI art artifacts or inconsistencies
- Digital signatures or watermarks
- Computer-generated patterns

Look for these handwriting indicators:
- Natural pen pressure variations
- Slight irregularities in letter formation
- Consistent personal handwriting style
- Paper texture and pen marks
- Natural human inconsistencies

Return your analysis in this JSON format:
{
  "isAiGenerated": boolean,
  "confidenceScore": number (0-100),
  "handwritingConfidence": number (0-100),
  "detectedPatterns": ["pattern1", "pattern2"],
  "aiDetectionReason": "detailed explanation",
  "textExtracted": "any visible text"
}`;

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        data: base64Image,
        mimeType: "image/jpeg" // Adjust based on actual image type
      }
    }
  ]);

  const response = result.response.text();

  try {
    // Clean and parse JSON response
    let jsonString = response
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/gi, "")
      .trim();

    const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonString = jsonMatch[0];
    }

    const parsed = JSON.parse(jsonString);

    return {
      isAiGenerated: parsed.isAiGenerated || false,
      confidenceScore: Math.min(100, Math.max(0, parsed.confidenceScore || 0)),
      detectedPatterns: Array.isArray(parsed.detectedPatterns) ? parsed.detectedPatterns : [],
      aiDetectionReason: parsed.aiDetectionReason || "No specific reason provided",
      handwritingConfidence: Math.min(100, Math.max(0, parsed.handwritingConfidence || 0)),
      textExtracted: parsed.textExtracted || "",
    };
  } catch (parseError) {
    console.error("Failed to parse Gemini image analysis response:", parseError);

    // Fallback analysis based on response content
    const isAiGenerated = response.toLowerCase().includes("ai-generated") ||
                         response.toLowerCase().includes("artificial intelligence") ||
                         response.toLowerCase().includes("computer generated");

    return {
      isAiGenerated,
      confidenceScore: isAiGenerated ? 70 : 30,
      detectedPatterns: ["manual_analysis_fallback"],
      aiDetectionReason: response.substring(0, 500),
      handwritingConfidence: isAiGenerated ? 20 : 80,
      textExtracted: "",
    };
  }
}

async function analyzeTextFile(model: any, fileData: string): Promise<AnalysisResult> {
  // For Vercel deployment, decode base64 to get text content
  const fileContent = Buffer.from(fileData, 'base64').toString('utf8');

  const prompt = `Analyze the following text to determine if it was likely generated by AI or written by a human.

Text to analyze:
"${fileContent.substring(0, 5000)}" ${fileContent.length > 5000 ? '...[truncated]' : ''}

Please provide a detailed analysis considering:

AI-generated text indicators:
- Overly formal or perfect grammar consistently
- Repetitive sentence structures
- Generic or templated phrasing
- Lack of personal voice or unique expression
- Unnatural flow or rhythm
- Common AI phrases like "It's important to note", "In conclusion", etc.
- Overly comprehensive coverage of topics
- Lack of specific personal examples or experiences

Human-written text indicators:
- Natural inconsistencies in style
- Personal voice and unique expressions
- Specific examples and experiences
- Natural flow and rhythm
- Occasional grammatical imperfections
- Informal language where appropriate
- Emotional undertones
- Personal opinions and perspectives

Return your analysis in this JSON format:
{
  "isAiGenerated": boolean,
  "confidenceScore": number (0-100),
  "handwritingConfidence": 0,
  "detectedPatterns": ["pattern1", "pattern2"],
  "aiDetectionReason": "detailed explanation of why you think it's AI or human-written",
  "textExtracted": "full text content"
}`;

  const result = await model.generateContent(prompt);
  const response = result.response.text();

  try {
    // Clean and parse JSON response
    let jsonString = response
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/gi, "")
      .trim();

    const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonString = jsonMatch[0];
    }

    const parsed = JSON.parse(jsonString);

    return {
      isAiGenerated: parsed.isAiGenerated || false,
      confidenceScore: Math.min(100, Math.max(0, parsed.confidenceScore || 0)),
      detectedPatterns: Array.isArray(parsed.detectedPatterns) ? parsed.detectedPatterns : [],
      aiDetectionReason: parsed.aiDetectionReason || "No specific reason provided",
      handwritingConfidence: 0, // Text files don't have handwriting
      textExtracted: fileContent,
    };
  } catch (parseError) {
    console.error("Failed to parse Gemini text analysis response:", parseError);

    // Fallback analysis
    const isAiGenerated = response.toLowerCase().includes("ai-generated") ||
                         response.toLowerCase().includes("artificial intelligence");

    return {
      isAiGenerated,
      confidenceScore: isAiGenerated ? 70 : 30,
      detectedPatterns: ["manual_analysis_fallback"],
      aiDetectionReason: response.substring(0, 500),
      handwritingConfidence: 0,
      textExtracted: fileContent,
    };
  }
}