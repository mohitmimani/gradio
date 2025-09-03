import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/schema";
import { mcqQuizzes, mcqQuestions } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;
    
    // Fetch quiz details
    const [quiz] = await db
      .select()
      .from(mcqQuizzes)
      .where(eq(mcqQuizzes.id, id));

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Check if user has access (owner or quiz is published)
    if (!quiz.isPublished && quiz.createdBy !== session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Fetch questions
    const questions = await db
      .select()
      .from(mcqQuestions)
      .where(eq(mcqQuestions.quizId, id));

    // Parse options from JSON string
    const formattedQuestions = questions.map((q) => ({
      ...q,
      options: JSON.parse(q.options),
    }));

    return NextResponse.json({
      quiz,
      questions: formattedQuestions,
    });
  } catch (error) {
    console.error("Error fetching quiz:", error);
    return NextResponse.json(
      { error: "Failed to fetch quiz" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user owns the quiz
    const [quiz] = await db
      .select()
      .from(mcqQuizzes)
      .where(eq(mcqQuizzes.id, id));

    if (!quiz || quiz.createdBy !== session.user.id) {
      return NextResponse.json(
        { error: "Quiz not found or unauthorized" },
        { status: 404 }
      );
    }

    // Delete quiz (questions will be cascade deleted)
    await db.delete(mcqQuizzes).where(eq(mcqQuizzes.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting quiz:", error);
    return NextResponse.json(
      { error: "Failed to delete quiz" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { isPublished } = body;

    // Check if user owns the quiz
    const [quiz] = await db
      .select()
      .from(mcqQuizzes)
      .where(eq(mcqQuizzes.id, id));

    if (!quiz || quiz.createdBy !== session.user.id) {
      return NextResponse.json(
        { error: "Quiz not found or unauthorized" },
        { status: 404 }
      );
    }

    // Update publish status
    const [updatedQuiz] = await db
      .update(mcqQuizzes)
      .set({ 
        isPublished,
        updatedAt: new Date()
      })
      .where(eq(mcqQuizzes.id, id))
      .returning();

    return NextResponse.json(updatedQuiz);
  } catch (error) {
    console.error("Error updating quiz:", error);
    return NextResponse.json(
      { error: "Failed to update quiz" },
      { status: 500 }
    );
  }
}