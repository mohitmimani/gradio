import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, assignments, assignmentSubmissions, aiAnalysisResults } from "@/lib/schema";
import { eq, sql, desc, count } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get total assignments by user
    const totalAssignments = await db
      .select({ count: count() })
      .from(assignments)
      .where(eq(assignments.createdBy, session.user.id));

    // Get total submissions for user's assignments
    const submissionStats = await db
      .select({
        totalSubmissions: count(assignmentSubmissions.id),
        analyzedCount: sql<number>`count(case when ${assignmentSubmissions.status} = 'analyzed' then 1 end)`,
      })
      .from(assignmentSubmissions)
      .innerJoin(assignments, eq(assignments.id, assignmentSubmissions.assignmentId))
      .where(eq(assignments.createdBy, session.user.id));

    // Get AI detection stats
    const aiStats = await db
      .select({
        aiGeneratedCount: sql<number>`count(case when ${aiAnalysisResults.isAiGenerated} = true then 1 end)`,
        humanWrittenCount: sql<number>`count(case when ${aiAnalysisResults.isAiGenerated} = false then 1 end)`,
        avgConfidence: sql<number>`avg(${aiAnalysisResults.confidenceScore})`,
      })
      .from(aiAnalysisResults)
      .innerJoin(assignmentSubmissions, eq(assignmentSubmissions.id, aiAnalysisResults.submissionId))
      .innerJoin(assignments, eq(assignments.id, assignmentSubmissions.assignmentId))
      .where(eq(assignments.createdBy, session.user.id));

    // Get recent activity (last 7 days)
    const recentActivity = await db
      .select({
        date: sql<string>`date(${assignmentSubmissions.submittedAt})`,
        submissions: count(assignmentSubmissions.id),
        aiDetected: sql<number>`count(case when ${aiAnalysisResults.isAiGenerated} = true then 1 end)`,
      })
      .from(assignmentSubmissions)
      .innerJoin(assignments, eq(assignments.id, assignmentSubmissions.assignmentId))
      .leftJoin(aiAnalysisResults, eq(assignmentSubmissions.id, aiAnalysisResults.submissionId))
      .where(eq(assignments.createdBy, session.user.id))
      .groupBy(sql`date(${assignmentSubmissions.submittedAt})`)
      .orderBy(desc(sql`date(${assignmentSubmissions.submittedAt})`))
      .limit(7);

    // Get top assignments by submission count
    const topAssignments = await db
      .select({
        id: assignments.id,
        title: assignments.title,
        submissionCount: count(assignmentSubmissions.id),
        aiDetected: sql<number>`count(case when ${aiAnalysisResults.isAiGenerated} = true then 1 end)`,
      })
      .from(assignments)
      .leftJoin(assignmentSubmissions, eq(assignments.id, assignmentSubmissions.assignmentId))
      .leftJoin(aiAnalysisResults, eq(assignmentSubmissions.id, aiAnalysisResults.submissionId))
      .where(eq(assignments.createdBy, session.user.id))
      .groupBy(assignments.id, assignments.title)
      .orderBy(desc(count(assignmentSubmissions.id)))
      .limit(10);

    const analytics = {
      totalAssignments: totalAssignments[0]?.count || 0,
      totalSubmissions: submissionStats[0]?.totalSubmissions || 0,
      analyzedSubmissions: submissionStats[0]?.analyzedCount || 0,
      aiGeneratedCount: aiStats[0]?.aiGeneratedCount || 0,
      humanWrittenCount: aiStats[0]?.humanWrittenCount || 0,
      averageConfidenceScore: Math.round(aiStats[0]?.avgConfidence || 0),
      recentActivity: recentActivity.map(day => ({
        date: day.date,
        submissions: day.submissions,
        aiDetected: day.aiDetected,
      })),
      topAssignments: topAssignments.map(assignment => ({
        id: assignment.id,
        title: assignment.title,
        submissionCount: assignment.submissionCount,
        aiDetectionRate: assignment.submissionCount > 0
          ? (assignment.aiDetected / assignment.submissionCount) * 100
          : 0,
      })),
      detectionTrends: [], // Would need more complex queries for weekly trends
    };

    return NextResponse.json({
      success: true,
      analytics,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}