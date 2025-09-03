import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, studentResponses, mcqQuizzes, mcqQuestions } from "@/lib/schema";
import { eq, desc, and } from "drizzle-orm";

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

    // Verify user owns this quiz
    const [quiz] = await db
      .select()
      .from(mcqQuizzes)
      .where(and(eq(mcqQuizzes.id, id), eq(mcqQuizzes.createdBy, session.user.id)));

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Get all responses for this quiz
    const responses = await db
      .select()
      .from(studentResponses)
      .where(eq(studentResponses.quizId, id))
      .orderBy(desc(studentResponses.submittedAt));

    if (responses.length === 0) {
      return NextResponse.json({
        analytics: {
          totalResponses: 0,
          averageScore: 0,
          averageTime: 0,
          completionRate: 0,
          scoreDistribution: [],
          questionPerformance: [],
          timeDistribution: [],
          cheatingMetrics: {
            totalSuspiciousActivities: 0,
            averageRiskScore: 0,
            highRiskSubmissions: 0,
          },
          topPerformers: [],
        }
      });
    }

    // Get questions for this quiz
    const questions = await db
      .select()
      .from(mcqQuestions)
      .where(eq(mcqQuestions.quizId, id))
      .orderBy(mcqQuestions.orderIndex);

    // Calculate basic metrics
    const totalResponses = responses.length;
    const totalScore = responses.reduce((acc, r) => acc + (r.score || 0), 0);
    const totalTime = responses.reduce((acc, r) => acc + (r.timeSpent || 0), 0);
    const averageScore = totalResponses > 0 ? (totalScore / totalResponses / quiz.totalScore * 100) : 0;
    const averageTime = totalResponses > 0 ? totalTime / totalResponses : 0;

    // Score distribution
    const scoreRanges = [
      { range: "0-20%", min: 0, max: 20 },
      { range: "21-40%", min: 21, max: 40 },
      { range: "41-60%", min: 41, max: 60 },
      { range: "61-80%", min: 61, max: 80 },
      { range: "81-100%", min: 81, max: 100 },
    ];

    const scoreDistribution = scoreRanges.map(range => {
      const count = responses.filter(r => {
        const percentage = (r.score || 0) / (r.totalScore || 1) * 100;
        return percentage >= range.min && percentage <= range.max;
      }).length;
      
      return { range: range.range, count };
    });

    // Time distribution
    const timeRanges = [
      { range: "0-5min", min: 0, max: 300 },
      { range: "5-10min", min: 300, max: 600 },
      { range: "10-15min", min: 600, max: 900 },
      { range: "15-30min", min: 900, max: 1800 },
      { range: "30min+", min: 1800, max: Infinity },
    ];

    const timeDistribution = timeRanges.map(range => {
      const count = responses.filter(r => {
        const time = r.timeSpent || 0;
        return time >= range.min && time < range.max;
      }).length;
      
      return { range: range.range, count };
    });

    // Question performance
    const questionPerformance = questions.map(question => {
      let correctAnswers = 0;
      let totalAnswers = 0;

      responses.forEach(response => {
        try {
          let parsedResponses = JSON.parse(response.responses || "{}");
          
          // Handle nested structure with cheating data
          if (parsedResponses.answers) {
            parsedResponses = parsedResponses.answers;
          }
          
          if (parsedResponses[question.id] !== undefined) {
            totalAnswers++;
            if (parsedResponses[question.id] === question.correctAnswer) {
              correctAnswers++;
            }
          }
        } catch (error) {
          console.error("Error parsing response:", error);
        }
      });

      return {
        questionId: question.id,
        question: question.question,
        correctAnswers,
        totalAnswers,
        difficulty: totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0,
      };
    });

    // Top performers (top 5)
    const topPerformers = responses
      .map(r => ({
        studentName: r.studentName || "Anonymous",
        score: r.score || 0,
        totalScore: r.totalScore || 1,
        percentage: ((r.score || 0) / (r.totalScore || 1)) * 100,
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5);

    // Cheating metrics
    let totalSuspiciousActivities = 0;
    let totalRiskScore = 0;
    let highRiskSubmissions = 0;

    responses.forEach(response => {
      try {
        const parsedResponses = JSON.parse(response.responses || "{}");
        
        if (parsedResponses.cheatingData) {
          const cheatingData = parsedResponses.cheatingData;
          
          // Calculate risk score
          let riskScore = 0;
          riskScore += Math.min(cheatingData.tabSwitches * 10, 50);
          riskScore += Math.min(Math.floor(cheatingData.timeAwayFromTab / 60) * 5, 30);
          riskScore += Math.min((cheatingData.copyAttempts + cheatingData.pasteAttempts) * 15, 45);
          riskScore += Math.min(cheatingData.rightClickAttempts * 5, 20);
          riskScore += Math.min((cheatingData.keyboardShortcuts?.length || 0) * 10, 40);
          riskScore += Math.min(cheatingData.fullscreenExits * 20, 60);
          
          const finalRiskScore = Math.min(riskScore, 100);
          totalRiskScore += finalRiskScore;
          
          if (finalRiskScore >= 70) {
            highRiskSubmissions++;
          }
          
          totalSuspiciousActivities += cheatingData.suspiciousActivity?.length || 0;
        }
      } catch (error) {
        // Ignore parsing errors for responses without cheating data
      }
    });

    const averageRiskScore = totalResponses > 0 ? totalRiskScore / totalResponses : 0;

    const analytics = {
      totalResponses,
      averageScore,
      averageTime,
      completionRate: 100, // All submitted responses are complete
      scoreDistribution,
      questionPerformance,
      timeDistribution,
      cheatingMetrics: {
        totalSuspiciousActivities,
        averageRiskScore,
        highRiskSubmissions,
      },
      topPerformers,
    };

    return NextResponse.json({ analytics });
  } catch (error) {
    console.error("Error fetching quiz analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}