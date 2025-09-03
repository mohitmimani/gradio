import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, mcqQuizzes, mcqQuestions } from "@/lib/schema";

// Template data - in a real app this would come from a database
const templateData: Record<string, any> = {
  "template-1": {
    title: "JavaScript Fundamentals",
    description: "Test basic JavaScript concepts including variables, functions, and control structures",
    subject: "Programming",
    difficulty: "easy",
    questions: [
      {
        question: "What is the correct way to declare a variable in JavaScript?",
        options: ["var myVar;", "variable myVar;", "v myVar;", "declare myVar;"],
        correctAnswer: 0,
        explanation: "The 'var' keyword is used to declare variables in JavaScript.",
        points: 1
      },
      {
        question: "Which of the following is NOT a primitive data type in JavaScript?",
        options: ["string", "number", "boolean", "array"],
        correctAnswer: 3,
        explanation: "Array is an object type, not a primitive data type in JavaScript.",
        points: 1
      },
      {
        question: "What does the '===' operator do in JavaScript?",
        options: ["Assignment", "Equality without type coercion", "Not equal", "Type conversion"],
        correctAnswer: 1,
        explanation: "The '===' operator checks for strict equality without type coercion.",
        points: 1
      },
      {
        question: "How do you create a function in JavaScript?",
        options: ["function myFunc() {}", "create myFunc() {}", "def myFunc() {}", "func myFunc() {}"],
        correctAnswer: 0,
        explanation: "Functions in JavaScript are declared using the 'function' keyword.",
        points: 1
      },
      {
        question: "What will 'typeof null' return in JavaScript?",
        options: ["null", "undefined", "object", "boolean"],
        correctAnswer: 2,
        explanation: "This is a known quirk in JavaScript - typeof null returns 'object'.",
        points: 1
      },
      {
        question: "Which method is used to add an element to the end of an array?",
        options: ["append()", "add()", "push()", "insert()"],
        correctAnswer: 2,
        explanation: "The push() method adds one or more elements to the end of an array.",
        points: 1
      },
      {
        question: "What is the result of '2' + 2 in JavaScript?",
        options: ["4", "22", "Error", "NaN"],
        correctAnswer: 1,
        explanation: "JavaScript coerces the number 2 to a string, resulting in string concatenation.",
        points: 1
      },
      {
        question: "How do you write a comment in JavaScript?",
        options: ["# This is a comment", "// This is a comment", "<!-- This is a comment -->", "' This is a comment"],
        correctAnswer: 1,
        explanation: "Single-line comments in JavaScript start with //",
        points: 1
      },
      {
        question: "What is the correct way to write a JavaScript array?",
        options: ["var colors = 'red', 'green', 'blue'", "var colors = (1:'red', 2:'green', 3:'blue')", "var colors = ['red', 'green', 'blue']", "var colors = 1 = ('red'), 2 = ('green'), 3 = ('blue')"],
        correctAnswer: 2,
        explanation: "Arrays in JavaScript are created using square brackets []",
        points: 1
      },
      {
        question: "Which event occurs when the user clicks on an HTML element?",
        options: ["onchange", "onclick", "onmouseclick", "onmouseover"],
        correctAnswer: 1,
        explanation: "The onclick event occurs when a user clicks on an element.",
        points: 1
      }
    ]
  },
  "template-2": {
    title: "Mathematics - Algebra Basics",
    description: "Essential algebra concepts for middle school students",
    subject: "Mathematics", 
    difficulty: "medium",
    questions: [
      {
        question: "Solve for x: 2x + 5 = 13",
        options: ["x = 4", "x = 6", "x = 8", "x = 9"],
        correctAnswer: 0,
        explanation: "2x + 5 = 13, so 2x = 8, therefore x = 4",
        points: 1
      },
      {
        question: "What is the slope of the line y = 3x + 2?",
        options: ["2", "3", "5", "3x"],
        correctAnswer: 1,
        explanation: "In the form y = mx + b, m is the slope. Here m = 3.",
        points: 1
      },
      {
        question: "Simplify: 4x + 2x - 3x",
        options: ["3x", "5x", "9x", "x"],
        correctAnswer: 0,
        explanation: "4x + 2x - 3x = (4 + 2 - 3)x = 3x",
        points: 1
      }
      // ... more questions would be added here
    ]
  }
  // ... more templates would be added here
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id: templateId } = await params;
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get template data
    const template = templateData[templateId];
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Generate share code
    const shareCode = Math.random().toString(36).substring(2, 10).toUpperCase();

    // Calculate total score
    const totalScore = template.questions.reduce((sum: number, q: any) => sum + q.points, 0);

    // Create quiz from template
    const [quiz] = await db
      .insert(mcqQuizzes)
      .values({
        title: template.title,
        description: template.description,
        subject: template.subject,
        difficulty: template.difficulty,
        createdBy: session.user.id,
        shareCode,
        totalScore,
        aiGenerated: false,
        isPublished: false,
      })
      .returning();

    // Create questions
    const questionsData = template.questions.map((q: any, index: number) => ({
      quizId: quiz.id,
      question: q.question,
      options: JSON.stringify(q.options),
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      points: q.points,
      orderIndex: index,
    }));

    await db
      .insert(mcqQuestions)
      .values(questionsData);

    return NextResponse.json({ 
      quizId: quiz.id,
      message: "Quiz created from template successfully" 
    });
  } catch (error) {
    console.error("Error using template:", error);
    return NextResponse.json(
      { error: "Failed to create quiz from template" },
      { status: 500 }
    );
  }
}