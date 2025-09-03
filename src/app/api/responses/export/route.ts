import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, studentResponses, mcqQuizzes, mcqQuestions } from "@/lib/schema";
import { eq, desc, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { quizId } = await req.json();

    // Build the query based on whether a specific quiz is selected
    let query = db
      .select({
        id: studentResponses.id,
        studentName: studentResponses.studentName,
        studentEmail: studentResponses.studentEmail,
        quizTitle: mcqQuizzes.title,
        score: studentResponses.score,
        totalScore: studentResponses.totalScore,
        submittedAt: studentResponses.submittedAt,
        timeSpent: studentResponses.timeSpent,
        responses: studentResponses.responses,
      })
      .from(studentResponses)
      .innerJoin(mcqQuizzes, eq(studentResponses.quizId, mcqQuizzes.id))
      .where(eq(mcqQuizzes.createdBy, session.user.id));

    if (quizId && quizId !== "all") {
      // Find quiz by title
      const [quiz] = await db
        .select({ id: mcqQuizzes.id })
        .from(mcqQuizzes)
        .where(and(eq(mcqQuizzes.title, quizId), eq(mcqQuizzes.createdBy, session.user.id)));
      
      if (quiz) {
        query = query.where(eq(studentResponses.quizId, quiz.id));
      }
    }

    const responses = await query.orderBy(desc(studentResponses.submittedAt));

    // Convert to CSV
    const csvHeaders = [
      "Student Name",
      "Student Email", 
      "Quiz Title",
      "Score",
      "Total Score",
      "Percentage",
      "Time Spent (seconds)",
      "Submitted At",
      "Detailed Responses"
    ];

    const csvRows = responses.map(response => {
      const percentage = Math.round((response.score / response.totalScore) * 100);
      let detailedResponses = "";
      
      try {
        const parsedResponses = JSON.parse(response.responses);
        if (parsedResponses.answers) {
          detailedResponses = JSON.stringify(parsedResponses.answers);
        } else {
          detailedResponses = response.responses;
        }
      } catch {
        detailedResponses = response.responses;
      }

      return [
        response.studentName || "",
        response.studentEmail || "",
        response.quizTitle || "",
        response.score || 0,
        response.totalScore || 0,
        percentage,
        response.timeSpent || 0,
        response.submittedAt ? new Date(response.submittedAt).toISOString() : "",
        detailedResponses.replace(/"/g, '""') // Escape quotes for CSV
      ];
    });

    // Create CSV content
    const csvContent = [
      csvHeaders.join(","),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    // Return CSV as response
    return new Response(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="quiz_responses_${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error exporting responses:", error);
    return NextResponse.json(
      { error: "Failed to export responses" },
      { status: 500 }
    );
  }
}