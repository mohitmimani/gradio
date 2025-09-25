import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, assignments, assignmentSubmissions } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userAssignments = await db
      .select({
        id: assignments.id,
        title: assignments.title,
        description: assignments.description,
        dueDate: assignments.dueDate,
        isPublished: assignments.isPublished,
        shareCode: assignments.shareCode,
        createdAt: assignments.createdAt,
        updatedAt: assignments.updatedAt,
        submissionCount: sql<number>`count(${assignmentSubmissions.id})`.as('submissionCount'),
      })
      .from(assignments)
      .leftJoin(assignmentSubmissions, eq(assignments.id, assignmentSubmissions.assignmentId))
      .where(eq(assignments.createdBy, session.user.id))
      .groupBy(assignments.id)
      .orderBy(assignments.createdAt);

    return NextResponse.json({
      success: true,
      assignments: userAssignments,
    });
  } catch (error) {
    console.error("Error fetching assignments:", error);
    return NextResponse.json(
      { error: "Failed to fetch assignments" },
      { status: 500 }
    );
  }
}