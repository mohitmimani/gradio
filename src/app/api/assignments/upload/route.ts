import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, assignments, assignmentSubmissions } from "@/lib/schema";
import { eq } from "drizzle-orm";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB absolute maximum

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    // Note: We allow public submissions for assignments accessed via share links
    console.log("Upload request - Session:", session?.user?.id || "No session");

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const assignmentId = formData.get("assignmentId") as string;
    const studentName = formData.get("studentName") as string;
    const studentEmail = formData.get("studentEmail") as string;

    console.log("Upload request - Assignment ID:", assignmentId);
    console.log("Upload request - File:", file?.name, file?.size);

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!assignmentId) {
      return NextResponse.json({ error: "Assignment ID is required" }, { status: 400 });
    }

    // Get assignment details
    const assignment = await db
      .select()
      .from(assignments)
      .where(eq(assignments.id, assignmentId))
      .limit(1);

    if (assignment.length === 0) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    const assignmentData = assignment[0];

    // Validate file size
    if (file.size > Math.min(MAX_FILE_SIZE, assignmentData.maxFileSize)) {
      const maxSizeMB = Math.min(MAX_FILE_SIZE, assignmentData.maxFileSize) / 1024 / 1024;
      return NextResponse.json(
        { error: `File size exceeds maximum limit of ${maxSizeMB}MB` },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = assignmentData.allowedFileTypes.split(",").map(type => type.trim().toLowerCase());
    const fileExtension = file.name.split(".").pop()?.toLowerCase() || "";

    if (!allowedTypes.includes(fileExtension)) {
      return NextResponse.json(
        { error: `File type .${fileExtension} is not allowed. Allowed types: ${allowedTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // For Vercel deployment, we'll store file metadata only
    // In production, you'd typically use cloud storage (AWS S3, Cloudinary, etc.)

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `${timestamp}_${sanitizedFileName}`;

    // Convert file to base64 for temporary storage (in production, use cloud storage)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileData = buffer.toString('base64');

    // Store file data temporarily (in production, upload to cloud storage and store URL)
    const relativeFilePath = `temp/${fileName}`;

    // Save submission to database
    console.log("Attempting database insertion...");
    const submission = await db.insert(assignmentSubmissions).values({
      assignmentId: assignmentId,
      studentId: session?.user?.id || null, // Allow null for public submissions
      studentName: studentName || session?.user?.name || "Anonymous Student",
      studentEmail: studentEmail || session?.user?.email || "anonymous@example.com",
      fileName: fileName,
      originalFileName: file.name,
      filePath: relativeFilePath,
      fileSize: file.size,
      mimeType: file.type,
      status: "submitted",
    }).returning();

    console.log("Database insertion successful:", submission[0]?.id);

    return NextResponse.json({
      success: true,
      submission: submission[0],
      message: "File uploaded successfully",
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}