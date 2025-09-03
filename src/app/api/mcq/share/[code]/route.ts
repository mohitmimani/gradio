import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/schema";
import { mcqQuizzes, mcqQuestions } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    
    // Fetch quiz by share code
    const [quiz] = await db
      .select()
      .from(mcqQuizzes)
      .where(eq(mcqQuizzes.shareCode, code));

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Check if quiz is published
    if (!quiz.isPublished) {
      return NextResponse.json(
        { error: "This quiz is not available" },
        { status: 403 }
      );
    }

    // Fetch questions
    const questions = await db
      .select()
      .from(mcqQuestions)
      .where(eq(mcqQuestions.quizId, quiz.id));

    // Parse options and remove correct answers for public view
    const formattedQuestions = questions.map((q) => ({
      id: q.id,
      question: q.question,
      options: JSON.parse(q.options),
      points: q.points,
      orderIndex: q.orderIndex,
      // Don't send correct answer or explanation to prevent cheating
    }));

    return NextResponse.json({
      quiz: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        subject: quiz.subject,
        difficulty: quiz.difficulty,
        questionCount: questions.length,
      },
      questions: formattedQuestions.sort((a, b) => a.orderIndex - b.orderIndex),
    });
  } catch (error) {
    console.error("Error fetching quiz by share code:", error);
    return NextResponse.json(
      { error: "Failed to fetch quiz" },
      { status: 500 }
    );
  }
}