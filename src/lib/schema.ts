import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import {
  boolean,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle({ client: sql });

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  stripeCustomerId: text("stripeCustomerId").unique(),
  isActive: boolean("isActive").default(false).notNull(),
  googleId: text("googleId"),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    {
      compoundKey: primaryKey({
        columns: [account.provider, account.providerAccountId],
      }),
    },
  ],
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (verificationToken) => [
    {
      compositePk: primaryKey({
        columns: [verificationToken.identifier, verificationToken.token],
      }),
    },
  ],
);

export const authenticators = pgTable(
  "authenticator",
  {
    credentialID: text("credentialID").notNull().unique(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    providerAccountId: text("providerAccountId").notNull(),
    credentialPublicKey: text("credentialPublicKey").notNull(),
    counter: integer("counter").notNull(),
    credentialDeviceType: text("credentialDeviceType").notNull(),
    credentialBackedUp: boolean("credentialBackedUp").notNull(),
    transports: text("transports"),
  },
  (authenticator) => [
    {
      compositePK: primaryKey({
        columns: [authenticator.userId, authenticator.credentialID],
      }),
    },
  ],
);

// Teams table
export const teams = pgTable("team", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  logo: text("logo"),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
  createdBy: text("createdBy")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

// UserTeams join table (now also handles invitees)
export const userTeams = pgTable(
  "user_team",
  {
    userId: text("userId").references(() => users.id, { onDelete: "cascade" }), // nullable for invitees
    teamId: text("teamId")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["educator", "student", "billing"] })
      .notNull()
      .default("student"),
    isSuperAdmin: boolean("isSuperAdmin").default(false).notNull(),
    status: text("status", { enum: ["invited", "joined"] })
      .notNull()
      .default("invited"),
    invitedAt: timestamp("invitedAt", { mode: "date" }).defaultNow(),
    joinedAt: timestamp("joinedAt", { mode: "date" }),
    inviteeEmail: text("inviteeEmail"), // for invited users not yet registered
  },
  (t) => [{ compoundKey: primaryKey({ columns: [t.teamId, t.inviteeEmail] }) }],
);

// MCQ Quizzes table
export const mcqQuizzes = pgTable("mcq_quiz", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  description: text("description"),
  subject: text("subject"),
  difficulty: text("difficulty", { enum: ["easy", "medium", "hard"] }),
  createdBy: text("createdBy")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  teamId: text("teamId").references(() => teams.id, { onDelete: "cascade" }),
  shareCode: text("shareCode").unique(),
  isPublished: boolean("isPublished").default(false).notNull(),
  aiGenerated: boolean("aiGenerated").default(false).notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow(),
});

// MCQ Questions table
export const mcqQuestions = pgTable("mcq_question", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  quizId: text("quizId")
    .notNull()
    .references(() => mcqQuizzes.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  options: text("options").notNull(), // JSON array of options
  correctAnswer: integer("correctAnswer").notNull(), // index of correct option
  explanation: text("explanation"),
  points: integer("points").default(1).notNull(),
  orderIndex: integer("orderIndex").notNull(),
});

// Student Responses table
export const studentResponses = pgTable("student_response", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  quizId: text("quizId")
    .notNull()
    .references(() => mcqQuizzes.id, { onDelete: "cascade" }),
  studentId: text("studentId")
    .references(() => users.id, { onDelete: "cascade" }),
  studentName: text("studentName"),
  studentEmail: text("studentEmail"),
  responses: text("responses").notNull(), // JSON object mapping questionId to selected option
  score: integer("score"),
  totalScore: integer("totalScore"),
  startedAt: timestamp("startedAt", { mode: "date" }).defaultNow(),
  submittedAt: timestamp("submittedAt", { mode: "date" }),
  timeSpent: integer("timeSpent"), // in seconds
});

// Quiz Shares table (for tracking who has access)
export const quizShares = pgTable("quiz_share", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  quizId: text("quizId")
    .notNull()
    .references(() => mcqQuizzes.id, { onDelete: "cascade" }),
  sharedWith: text("sharedWith"), // email or group
  shareType: text("shareType", { enum: ["email", "link", "team"] }).notNull(),
  expiresAt: timestamp("expiresAt", { mode: "date" }),
  maxAttempts: integer("maxAttempts").default(1),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
});

// Assignments table
export const assignments = pgTable("assignment", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  description: text("description"),
  instructions: text("instructions"),
  dueDate: timestamp("dueDate", { mode: "date" }),
  allowedFileTypes: text("allowedFileTypes").default("pdf,doc,docx,txt,jpg,jpeg,png"), // comma-separated
  maxFileSize: integer("maxFileSize").default(10485760), // 10MB in bytes
  createdBy: text("createdBy")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  teamId: text("teamId").references(() => teams.id, { onDelete: "cascade" }),
  isPublished: boolean("isPublished").default(false).notNull(),
  shareCode: text("shareCode").unique(),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow(),
});

// Assignment Submissions table
export const assignmentSubmissions = pgTable("assignment_submission", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  assignmentId: text("assignmentId")
    .notNull()
    .references(() => assignments.id, { onDelete: "cascade" }),
  studentId: text("studentId")
    .references(() => users.id, { onDelete: "cascade" }),
  studentName: text("studentName"),
  studentEmail: text("studentEmail"),
  fileName: text("fileName").notNull(),
  originalFileName: text("originalFileName").notNull(),
  filePath: text("filePath").notNull(),
  fileSize: integer("fileSize").notNull(),
  mimeType: text("mimeType").notNull(),
  status: text("status", { enum: ["submitted", "analyzing", "analyzed", "error"] })
    .notNull()
    .default("submitted"),
  submittedAt: timestamp("submittedAt", { mode: "date" }).defaultNow(),
  analyzedAt: timestamp("analyzedAt", { mode: "date" }),
});

// AI Analysis Results table
export const aiAnalysisResults = pgTable("ai_analysis_result", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  submissionId: text("submissionId")
    .notNull()
    .references(() => assignmentSubmissions.id, { onDelete: "cascade" }),
  analysisType: text("analysisType").notNull().default("content_detection"),
  isAiGenerated: boolean("isAiGenerated"),
  confidenceScore: integer("confidenceScore"), // 0-100
  detectedPatterns: text("detectedPatterns"), // JSON array of detected patterns
  aiDetectionReason: text("aiDetectionReason"), // AI explanation
  handwritingConfidence: integer("handwritingConfidence"), // 0-100 for handwriting detection
  textExtracted: text("textExtracted"), // extracted text from file
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
});
