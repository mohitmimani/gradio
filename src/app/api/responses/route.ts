import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, studentResponses, mcqQuizzes, users } from "@/lib/schema";
import { eq, desc, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all responses for quizzes created by the current user
    const responses = await db
      .select({
        id: studentResponses.id,
        studentId: studentResponses.studentId,
        studentName: studentResponses.studentName,
        studentEmail: studentResponses.studentEmail,
        quizTitle: mcqQuizzes.title,
        quizId: studentResponses.quizId,
        score: studentResponses.score,
        totalScore: studentResponses.totalScore,
        submittedAt: studentResponses.submittedAt,
        timeSpent: studentResponses.timeSpent,
        responses: studentResponses.responses,
      })
      .from(studentResponses)
      .innerJoin(mcqQuizzes, eq(studentResponses.quizId, mcqQuizzes.id))
      .where(eq(mcqQuizzes.createdBy, session.user.id))
      .orderBy(desc(studentResponses.submittedAt));

    return NextResponse.json({ responses });
  } catch (error) {
    console.error("Error fetching responses:", error);
    return NextResponse.json(
      { error: "Failed to fetch responses" },
      { status: 500 }
    );
  }
}