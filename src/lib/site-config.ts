import { env } from "@/env.mjs";

export const siteConfig = {
  title: "Gradio AI Assignment Reviewer",
  description:
    "Gradio is an AI-powered assignment reviewer platform for teachers and students. Instantly generate assignments, share via secure links or QR codes, and get automated, detailed AI feedback including scores, strengths, and suggestions.",
  keywords: [
    "Gradio",
    "AI Assignment Reviewer",
    "Education",
    "Teacher Dashboard",
    "Student Feedback",
    "Next.js",
    "TypeScript",
    "Tailwind CSS",
    "Next-auth",
    "Stripe",
    "shadcn/ui",
  ],
  url: env.APP_URL,
  googleSiteVerificationId: env.GOOGLE_SITE_VERIFICATION_ID || "",
};
