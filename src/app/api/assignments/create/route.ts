import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, assignments } from "@/lib/schema";
import { z } from "zod";

const createAssignmentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  instructions: z.string().optional(),
  dueDate: z.string().optional(),
  allowedFileTypes: z.string().optional(),
  maxFileSize: z.number().optional(),
  teamId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = createAssignmentSchema.parse(body);

    const shareCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const newAssignment = await db.insert(assignments).values({
      title: validatedData.title,
      description: validatedData.description,
      instructions: validatedData.instructions,
      dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
      allowedFileTypes: validatedData.allowedFileTypes || "pdf,doc,docx,txt,jpg,jpeg,png",
      maxFileSize: validatedData.maxFileSize || 10485760, // 10MB default
      createdBy: session.user.id,
      teamId: validatedData.teamId || null,
      shareCode: shareCode,
      isPublished: false,
    }).returning();

    return NextResponse.json({
      success: true,
      assignment: newAssignment[0],
    });
  } catch (error) {
    console.error("Error creating assignment:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create assignment" },
      { status: 500 }
    );
  }
}