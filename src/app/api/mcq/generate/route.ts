import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { env } from "@/env.mjs";

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { topic, difficulty, numberOfQuestions, additionalContext } =
      await req.json();

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `Generate ${numberOfQuestions} multiple choice questions about "${topic}" at ${difficulty} difficulty level.
    ${additionalContext ? `Additional context: ${additionalContext}` : ""}
    
    Return ONLY valid JSON with no additional text. The JSON must have this exact structure:
    {
      "suggestedTitle": "Quiz title",
      "suggestedDescription": "Brief description",
      "questions": [
        {
          "question": "The question text",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": 0,
          "explanation": "Brief explanation of why this is correct"
        }
      ]
    }
    
    IMPORTANT Requirements:
    - Return ONLY the JSON object, no markdown formatting or additional text
    - Each question must have exactly 4 options
    - correctAnswer is the index (0-3) of the correct option
    - Keep explanations concise and single-line
    - Do not include line breaks in explanations
    - Questions should be appropriate for ${difficulty} difficulty
    - Ensure all text is properly escaped for JSON`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Parse the JSON response
    let parsedData;
    try {
      // Clean up the response text
      let jsonString = text
        // Remove markdown code blocks
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/gi, "")
        // Remove any leading/trailing whitespace
        .trim();
      
      // Try to extract JSON if there's extra text
      const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonString = jsonMatch[0];
      }
      
      // Clean up problematic formatting in the JSON
      jsonString = jsonString
        // Replace actual newlines within strings with escaped newlines
        .replace(/:\s*"([^"]*)\n([^"]*)"/, ': "$1\\n$2"')
        // Remove any control characters
        .replace(/[\x00-\x1F\x7F]/g, (match) => {
          if (match === '\n' || match === '\r' || match === '\t') {
            return ' '; // Replace with space
          }
          return '';
        });
      
      // Attempt to parse
      parsedData = JSON.parse(jsonString);
      
    } catch (parseError) {
      console.error("Error parsing Gemini response:", parseError);
      console.error("Raw response:", text);
      
      // Fallback: Try to extract and build a valid response
      try {
        // Create a minimal valid response with proper typing
        const fallbackQuestions: Question[] = [];
        parsedData = {
          suggestedTitle: `${topic} Quiz`,
          suggestedDescription: `A ${difficulty} difficulty quiz about ${topic}`,
          questions: fallbackQuestions
        };
        
        // Try to extract questions using regex
        const questionMatches = text.matchAll(/"question":\s*"([^"]+)"/g);
        const optionsMatches = text.matchAll(/"options":\s*\[([^\]]+)\]/g);
        const answerMatches = text.matchAll(/"correctAnswer":\s*(\d+)/g);
        const explanationMatches = text.matchAll(/"explanation":\s*"([^"]+)"/g);
        
        const questions = Array.from(questionMatches);
        const options = Array.from(optionsMatches);
        const answers = Array.from(answerMatches);
        const explanations = Array.from(explanationMatches);
        
        for (let i = 0; i < Math.min(questions.length, numberOfQuestions); i++) {
          let optionArray = ["Option A", "Option B", "Option C", "Option D"];
          
          if (options[i]) {
            try {
              optionArray = JSON.parse(`[${options[i][1]}]`);
              if (optionArray.length !== 4) {
                optionArray = ["Option A", "Option B", "Option C", "Option D"];
              }
            } catch {
              // Keep default options
            }
          }
          
          parsedData.questions.push({
            question: questions[i][1] || `Question ${i + 1}`,
            options: optionArray,
            correctAnswer: answers[i] ? Math.min(Math.max(0, parseInt(answers[i][1])), 3) : 0,
            explanation: explanations[i] ? explanations[i][1].substring(0, 200) : "No explanation provided"
          });
        }
        
        // If no questions were extracted, return error
        if (parsedData.questions.length === 0) {
          throw new Error("Could not extract questions from response");
        }
        
      } catch (fallbackError) {
        console.error("Fallback parsing also failed:", fallbackError);
        return NextResponse.json(
          { 
            error: "Failed to parse AI response. Please try again.",
            details: "The AI response was not in the expected format."
          },
          { status: 500 },
        );
      }
    }

    // Validate the response structure
    if (!parsedData.questions || !Array.isArray(parsedData.questions)) {
      console.error("Invalid response structure:", parsedData);
      return NextResponse.json(
        { 
          error: "Invalid response format from AI",
          details: "Questions array is missing or invalid"
        },
        { status: 500 },
      );
    }

    // Clean and validate questions
    const validatedQuestions = parsedData.questions
      .slice(0, numberOfQuestions) // Ensure we don't exceed requested number
      .map((q: Question, index: number) => ({
        question: (q.question || `Question ${index + 1}`).trim(),
        options:
          Array.isArray(q.options) && q.options.length === 4
            ? q.options.map((opt: string) => (opt || "").toString().trim())
            : ["Option A", "Option B", "Option C", "Option D"],
        correctAnswer:
          typeof q.correctAnswer === "number" &&
          q.correctAnswer >= 0 &&
          q.correctAnswer <= 3
            ? q.correctAnswer
            : 0,
        explanation: (q.explanation || "No explanation provided")
          .toString()
          .trim()
          .substring(0, 500) // Limit explanation length
          .replace(/\n/g, " "), // Remove newlines
      }));

    // Ensure we have the requested number of questions
    if (validatedQuestions.length === 0) {
      return NextResponse.json(
        { 
          error: "No valid questions generated",
          details: "The AI did not generate any valid questions"
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      suggestedTitle: (parsedData.suggestedTitle || `${topic} Quiz`).trim(),
      suggestedDescription: (
        parsedData.suggestedDescription ||
        `A ${difficulty} difficulty quiz about ${topic}`
      ).trim(),
      questions: validatedQuestions,
    });
  } catch (error) {
    console.error("Error generating MCQs:", error);
    return NextResponse.json(
      { 
        error: "Failed to generate MCQs",
        details: error instanceof Error ? error.message : "Unknown error occurred"
      },
      { status: 500 },
    );
  }
}