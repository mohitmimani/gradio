import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, studentResponses, mcqQuizzes, mcqQuestions } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the specific response with quiz details
    const [response] = await db
      .select({
        id: studentResponses.id,
        studentName: studentResponses.studentName,
        studentEmail: studentResponses.studentEmail,
        quizId: studentResponses.quizId,
        quizTitle: mcqQuizzes.title,
        score: studentResponses.score,
        totalScore: studentResponses.totalScore,
        submittedAt: studentResponses.submittedAt,
        timeSpent: studentResponses.timeSpent,
        responses: studentResponses.responses,
        startedAt: studentResponses.startedAt,
      })
      .from(studentResponses)
      .innerJoin(mcqQuizzes, eq(studentResponses.quizId, mcqQuizzes.id))
      .where(and(
        eq(studentResponses.id, id),
        eq(mcqQuizzes.createdBy, session.user.id)
      ));

    if (!response) {
      return NextResponse.json({ error: "Response not found" }, { status: 404 });
    }

    // Get all questions for this quiz
    const questions = await db
      .select()
      .from(mcqQuestions)
      .where(eq(mcqQuestions.quizId, response.quizId))
      .orderBy(mcqQuestions.orderIndex);

    // Parse the responses
    let parsedResponses;
    let cheatingData = null;
    
    try {
      parsedResponses = JSON.parse(response.responses);
      
      // Check if this includes cheating data
      if (parsedResponses.answers && parsedResponses.cheatingData) {
        cheatingData = parsedResponses.cheatingData;
        parsedResponses = parsedResponses.answers;
      }
    } catch {
      parsedResponses = {};
    }

    // Format questions with user answers
    const formattedQuestions = questions.map((q) => {
      const userAnswer = parsedResponses[q.id];
      const options = JSON.parse(q.options);
      
      return {
        ...q,
        options,
        userAnswer: userAnswer !== undefined ? userAnswer : -1,
        isCorrect: userAnswer === q.correctAnswer,
        userAnswerText: userAnswer !== undefined && userAnswer >= 0 ? options[userAnswer] : "Not answered",
        correctAnswerText: options[q.correctAnswer],
      };
    });

    return NextResponse.json({
      response: {
        ...response,
        cheatingData,
      },
      questions: formattedQuestions,
    });
  } catch (error) {
    console.error("Error fetching response details:", error);
    return NextResponse.json(
      { error: "Failed to fetch response details" },
      { status: 500 }
    );
  }
}