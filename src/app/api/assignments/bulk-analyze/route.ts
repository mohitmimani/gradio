import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, assignmentSubmissions } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { assignmentId } = await req.json();

    if (!assignmentId) {
      return NextResponse.json({ error: "Assignment ID is required" }, { status: 400 });
    }

    // Get all unanalyzed submissions for the assignment
    const unanalyzedSubmissions = await db
      .select({
        id: assignmentSubmissions.id,
      })
      .from(assignmentSubmissions)
      .where(and(
        eq(assignmentSubmissions.assignmentId, assignmentId),
        eq(assignmentSubmissions.status, "submitted")
      ));

    if (unanalyzedSubmissions.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No submissions to analyze",
        count: 0,
      });
    }

    // Trigger analysis for each submission
    const analysisPromises = unanalyzedSubmissions.map(async (submission) => {
      try {
        // Call the analyze endpoint for each submission
        const response = await fetch(`${req.nextUrl.origin}/api/assignments/analyze`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": req.headers.get("Authorization") || "",
            "Cookie": req.headers.get("Cookie") || "",
          },
          body: JSON.stringify({ submissionId: submission.id }),
        });

        return {
          submissionId: submission.id,
          success: response.ok,
          error: response.ok ? null : await response.text(),
        };
      } catch (error) {
        return {
          submissionId: submission.id,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    });

    const results = await Promise.all(analysisPromises);

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Bulk analysis initiated for ${unanalyzedSubmissions.length} submissions`,
      totalSubmissions: unanalyzedSubmissions.length,
      successCount,
      failureCount,
      results,
    });

  } catch (error) {
    console.error("Error in bulk analyze endpoint:", error);
    return NextResponse.json(
      { error: "Failed to process bulk analysis request" },
      { status: 500 }
    );
  }
}