import { NextRequest, NextResponse } from "next/server";
import { db, assignments, assignmentSubmissions } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ shareCode: string }> | { shareCode: string } }
) {
  const resolvedParams = await Promise.resolve(params);
  const shareCode = resolvedParams.shareCode;
  try {
    // Find assignment by share code
    const assignment = await db
      .select()
      .from(assignments)
      .where(eq(assignments.shareCode, shareCode))
      .limit(1);

    if (assignment.length === 0) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    const assignmentData = assignment[0];

    // Get user's previous submissions if authenticated
    const session = await auth();
    let userSubmissions = [];

    if (session?.user) {
      userSubmissions = await db
        .select({
          id: assignmentSubmissions.id,
          fileName: assignmentSubmissions.fileName,
          originalFileName: assignmentSubmissions.originalFileName,
          fileSize: assignmentSubmissions.fileSize,
          status: assignmentSubmissions.status,
          submittedAt: assignmentSubmissions.submittedAt,
          analyzedAt: assignmentSubmissions.analyzedAt,
        })
        .from(assignmentSubmissions)
        .where(eq(assignmentSubmissions.assignmentId, assignmentData.id))
        .orderBy(assignmentSubmissions.submittedAt);
    }

    return NextResponse.json({
      success: true,
      assignment: {
        id: assignmentData.id,
        title: assignmentData.title,
        description: assignmentData.description,
        instructions: assignmentData.instructions,
        dueDate: assignmentData.dueDate,
        allowedFileTypes: assignmentData.allowedFileTypes,
        maxFileSize: assignmentData.maxFileSize,
        isPublished: assignmentData.isPublished,
        createdAt: assignmentData.createdAt,
      },
      submissions: userSubmissions,
    });
  } catch (error) {
    console.error("Error fetching assignment by share code:", error);
    return NextResponse.json(
      { error: "Failed to fetch assignment" },
      { status: 500 }
    );
  }
}