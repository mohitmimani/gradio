import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/schema";
import { studentResponses, mcqQuestions, mcqQuizzes } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const { 
      quizId, 
      studentName, 
      studentEmail, 
      responses, 
      timeSpent,
      cheatingMetrics 
    } = await req.json();

    if (!quizId || !studentName || !responses) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Fetch quiz and questions to calculate score
    const [quiz] = await db
      .select()
      .from(mcqQuizzes)
      .where(eq(mcqQuizzes.id, quizId));

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    const questions = await db
      .select()
      .from(mcqQuestions)
      .where(eq(mcqQuestions.quizId, quizId));

    // Calculate score
    let score = 0;
    let totalScore = 0;
    const feedback = [];

    for (const question of questions) {
      const userAnswer = responses[question.id];
      const isCorrect = userAnswer === question.correctAnswer;
      
      if (isCorrect) {
        score += question.points;
      }
      totalScore += question.points;

      feedback.push({
        questionId: question.id,
        correct: isCorrect,
        correctAnswer: question.correctAnswer,
        userAnswer: userAnswer !== undefined ? userAnswer : -1,
        explanation: question.explanation,
      });
    }

    // Prepare response data with cheating metrics
    const responseData = {
      quizId,
      studentId: null, // Set to null for anonymous users
      studentName,
      studentEmail: studentEmail || null,
      responses: JSON.stringify(responses),
      score,
      totalScore,
      startedAt: new Date(Date.now() - timeSpent * 1000),
      submittedAt: new Date(),
      timeSpent,
    };

    // If cheating metrics are provided, include them
    if (cheatingMetrics) {
      Object.assign(responseData, {
        responses: JSON.stringify({
          answers: responses,
          cheatingData: cheatingMetrics
        })
      });
    }

    // Save the response
    const [savedResponse] = await db
      .insert(studentResponses)
      .values(responseData)
      .returning();

    const percentage = Math.round((score / totalScore) * 100);
    const correct = feedback.filter(f => f.correct).length;
    const incorrect = feedback.filter(f => !f.correct).length;

    return NextResponse.json({
      responseId: savedResponse.id,
      score,
      totalScore,
      percentage,
      correct,
      incorrect,
      feedback,
    });
  } catch (error) {
    console.error("Error submitting quiz:", error);
    return NextResponse.json(
      { error: "Failed to submit quiz" },
      { status: 500 }
    );
  }
}