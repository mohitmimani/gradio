import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, mcqQuizzes, mcqQuestions } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, description, subject, difficulty, questions, aiGenerated } = await req.json();

    if (!title || !questions || questions.length === 0) {
      return NextResponse.json(
        { error: "Title and questions are required" },
        { status: 400 }
      );
    }

    // Generate a unique share code
    const shareCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Create the quiz
    const [quiz] = await db.insert(mcqQuizzes).values({
      title,
      description,
      subject,
      difficulty,
      createdBy: session.user.id,
      shareCode,
      aiGenerated: aiGenerated || false,
      isPublished: false,
    }).returning();

    // Create the questions
    const questionData = questions.map((q: any, index: number) => ({
      quizId: quiz.id,
      question: q.question,
      options: JSON.stringify(q.options),
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      points: q.points || 1,
      orderIndex: index,
    }));

    await db.insert(mcqQuestions).values(questionData);

    return NextResponse.json({
      success: true,
      quizId: quiz.id,
      shareCode: quiz.shareCode,
    });

  } catch (error) {
    console.error("Error saving quiz:", error);
    return NextResponse.json(
      { error: "Failed to save quiz" },
      { status: 500 }
    );
  }
}