import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, assignments, assignmentSubmissions, aiAnalysisResults } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const updateAssignmentSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  instructions: z.string().optional(),
  dueDate: z.string().optional(),
  allowedFileTypes: z.string().optional(),
  maxFileSize: z.number().optional(),
  isPublished: z.boolean().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const assignmentId = resolvedParams.id;
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }


    const assignment = await db
      .select()
      .from(assignments)
      .where(eq(assignments.id, assignmentId))
      .limit(1);

    if (assignment.length === 0) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    // Check if user has access to this assignment
    if (assignment[0].createdBy !== session.user.id) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Get submissions with analysis results
    const submissions = await db
      .select({
        id: assignmentSubmissions.id,
        studentName: assignmentSubmissions.studentName,
        studentEmail: assignmentSubmissions.studentEmail,
        fileName: assignmentSubmissions.originalFileName,
        fileSize: assignmentSubmissions.fileSize,
        status: assignmentSubmissions.status,
        submittedAt: assignmentSubmissions.submittedAt,
        analyzedAt: assignmentSubmissions.analyzedAt,
        isAiGenerated: aiAnalysisResults.isAiGenerated,
        confidenceScore: aiAnalysisResults.confidenceScore,
        aiDetectionReason: aiAnalysisResults.aiDetectionReason,
        handwritingConfidence: aiAnalysisResults.handwritingConfidence,
      })
      .from(assignmentSubmissions)
      .leftJoin(aiAnalysisResults, eq(assignmentSubmissions.id, aiAnalysisResults.submissionId))
      .where(eq(assignmentSubmissions.assignmentId, assignmentId))
      .orderBy(assignmentSubmissions.submittedAt);

    return NextResponse.json({
      success: true,
      assignment: assignment[0],
      submissions: submissions,
    });
  } catch (error) {
    console.error("Error fetching assignment:", error);
    return NextResponse.json(
      { error: "Failed to fetch assignment" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const assignmentId = resolvedParams.id;
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = updateAssignmentSchema.parse(body);

    // Check if user owns this assignment
    const existingAssignment = await db
      .select()
      .from(assignments)
      .where(and(
        eq(assignments.id, assignmentId),
        eq(assignments.createdBy, session.user.id)
      ))
      .limit(1);

    if (existingAssignment.length === 0) {
      return NextResponse.json(
        { error: "Assignment not found or access denied" },
        { status: 404 }
      );
    }

    const updateData: any = { ...validatedData };
    if (validatedData.dueDate) {
      updateData.dueDate = new Date(validatedData.dueDate);
    }
    updateData.updatedAt = new Date();

    const updatedAssignment = await db
      .update(assignments)
      .set(updateData)
      .where(eq(assignments.id, assignmentId))
      .returning();

    return NextResponse.json({
      success: true,
      assignment: updatedAssignment[0],
    });
  } catch (error) {
    console.error("Error updating assignment:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update assignment" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const assignmentId = resolvedParams.id;
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user owns this assignment
    const existingAssignment = await db
      .select()
      .from(assignments)
      .where(and(
        eq(assignments.id, assignmentId),
        eq(assignments.createdBy, session.user.id)
      ))
      .limit(1);

    if (existingAssignment.length === 0) {
      return NextResponse.json(
        { error: "Assignment not found or access denied" },
        { status: 404 }
      );
    }

    await db.delete(assignments).where(eq(assignments.id, assignmentId));

    return NextResponse.json({
      success: true,
      message: "Assignment deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting assignment:", error);
    return NextResponse.json(
      { error: "Failed to delete assignment" },
      { status: 500 }
    );
  }
}