import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, mcqQuizzes, mcqQuestions } from "@/lib/schema";
import { eq, desc, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all quizzes created by the user with question count
    const quizzesWithCount = await db
      .select({
        id: mcqQuizzes.id,
        title: mcqQuizzes.title,
        description: mcqQuizzes.description,
        subject: mcqQuizzes.subject,
        difficulty: mcqQuizzes.difficulty,
        shareCode: mcqQuizzes.shareCode,
        isPublished: mcqQuizzes.isPublished,
        aiGenerated: mcqQuizzes.aiGenerated,
        createdAt: mcqQuizzes.createdAt,
        questionCount: sql<number>`count(${mcqQuestions.id})`,
      })
      .from(mcqQuizzes)
      .leftJoin(mcqQuestions, eq(mcqQuestions.quizId, mcqQuizzes.id))
      .where(eq(mcqQuizzes.createdBy, session.user.id))
      .groupBy(mcqQuizzes.id)
      .orderBy(desc(mcqQuizzes.createdAt));

    return NextResponse.json({ quizzes: quizzesWithCount });
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    return NextResponse.json(
      { error: "Failed to fetch quizzes" },
      { status: 500 }
    );
  }
}