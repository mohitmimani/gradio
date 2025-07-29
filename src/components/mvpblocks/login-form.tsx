"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";

import { AppLogo } from "../app-logo";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handles magic link sign in/up
  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await signIn("nodemailer", {
        email,
        redirect: false,
        callbackUrl: "/",
      });
      if (res?.ok) {
        setEmailSent(true);
      } else {
        setError("Failed to send magic link. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  // Handles Google sign in/up
  const handleGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      await signIn("google", { callbackUrl: "/" });
    } catch {
      setError("Google sign in failed.");
      setLoading(false);
    }
  };

  // Reset form to allow sending another email
  const handleSendAnother = () => {
    setEmailSent(false);
    setEmail("");
    setError(null);
  };

  return (
    <main className="bg-background flex min-h-screen w-full items-center justify-center">
      <div className="w-full max-w-md space-y-8">
        {/* Header Section */}
        <div className="space-y-6 text-center">
          <div className="flex justify-center">
            <div className="bg-background border-border rounded-2xl border p-3 shadow-lg">
              <AppLogo />
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-foreground text-3xl font-bold sm:text-4xl">
              Welcome back
            </h1>
            <p className="text-muted-foreground text-lg">
              Sign in to your account or create a new one
            </p>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-card/80 border-border space-y-8 rounded-2xl border p-8 shadow-xl backdrop-blur-sm">
          {/* Success State - Magic Link Sent */}
          {emailSent ? (
            <div className="space-y-6 text-center">
              {/* Success Icon */}
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <svg
                  className="h-8 w-8 text-green-600 dark:text-green-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M12 12v7"
                  />
                </svg>
              </div>

              <div className="space-y-3">
                <h3 className="text-foreground text-xl font-semibold">
                  Check your email!
                </h3>
                <p className="text-muted-foreground">
                  We&apos;ve sent a magic link to{" "}
                  <span className="text-foreground font-medium">{email}</span>
                </p>
                <p className="text-muted-foreground text-sm">
                  Click the link in your email to sign in. The link will expire
                  in 10 minutes.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleSendAnother}
                  className="border-border bg-background text-foreground hover:bg-muted focus:ring-primary inline-flex w-full items-center justify-center rounded-xl border px-4 py-3 text-sm font-medium transition-all duration-200 focus:ring-2 focus:ring-offset-2 focus:outline-none"
                >
                  <svg
                    className="mr-2 h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  Send another email
                </button>

                <p className="text-muted-foreground text-xs">
                  Didn&apos;t receive the email? Check your spam folder or try
                  again.
                </p>
              </div>
            </div>
          ) : (
            /* Login Form */
            <div className="space-y-6">
              {/* Google Sign In */}
              <button
                onClick={handleGoogle}
                disabled={loading}
                className="group border-border bg-background text-foreground hover:bg-muted focus:ring-primary relative inline-flex w-full items-center justify-center rounded-xl border px-4 py-3 text-sm font-medium transition-all duration-200 hover:shadow-md focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Sign in with Google"
              >
                {loading ? (
                  <div className="border-muted border-t-primary h-5 w-5 animate-spin rounded-full border-2" />
                ) : (
                  <>
                    <svg
                      className="mr-3 h-5 w-5"
                      viewBox="0 0 48 48"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <g clipPath="url(#clip0_17_40)">
                        <path
                          d="M47.532 24.5528C47.532 22.9214 47.3997 21.2811 47.1175 19.6761H24.48V28.9181H37.4434C36.9055 31.8988 35.177 34.5356 32.6461 36.2111V42.2078H40.3801C44.9217 38.0278 47.532 31.8547 47.532 24.5528Z"
                          fill="#4285F4"
                        />
                        <path
                          d="M24.48 48.0016C30.9529 48.0016 36.4116 45.8764 40.3888 42.2078L32.6549 36.2111C30.5031 37.675 27.7252 38.5039 24.4888 38.5039C18.2275 38.5039 12.9187 34.2798 11.0139 28.6006H3.03296V34.7825C7.10718 42.8868 15.4056 48.0016 24.48 48.0016Z"
                          fill="#34A853"
                        />
                        <path
                          d="M11.0051 28.6006C9.99973 25.6199 9.99973 22.3922 11.0051 19.4115V13.2296H3.03298C-0.371021 20.0112 -0.371021 28.0009 3.03298 34.7825L11.0051 28.6006Z"
                          fill="#FBBC04"
                        />
                        <path
                          d="M24.48 9.49932C27.9016 9.44641 31.2086 10.7339 33.6866 13.0973L40.5387 6.24523C36.2 2.17101 30.4414 -0.068932 24.48 0.00161733C15.4055 0.00161733 7.10718 5.11644 3.03296 13.2296L11.005 19.4115C12.901 13.7235 18.2187 9.49932 24.48 9.49932Z"
                          fill="#EA4335"
                        />
                      </g>
                      <defs>
                        <clipPath id="clip0_17_40">
                          <rect width="48" height="48" fill="white" />
                        </clipPath>
                      </defs>
                    </svg>
                    Continue with Google
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="border-border w-full border-t" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-card text-muted-foreground px-4 font-medium">
                    Or continue with email
                  </span>
                </div>
              </div>

              {/* Email Form */}
              <form onSubmit={handleMagicLink} className="space-y-6">
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-foreground block text-sm font-medium"
                  >
                    Email address
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      className="border-border bg-background text-foreground placeholder-muted-foreground focus:border-primary focus:ring-primary w-full rounded-xl border px-4 py-3 transition-all duration-200 focus:ring-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Enter your email address"
                    />
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      <svg
                        className="text-muted-foreground h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary border-primary relative inline-flex w-full items-center justify-center rounded-xl border px-4 py-3 text-sm font-medium transition-all duration-200 hover:shadow-lg focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Sending magic link...
                    </>
                  ) : (
                    <>
                      <svg
                        className="mr-2 h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      Send magic link
                    </>
                  )}
                </button>

                {/* Error Message */}
                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:bg-red-900/20">
                    <div className="flex items-center">
                      <svg
                        className="mr-3 h-5 w-5 text-red-400 dark:text-red-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <p className="text-sm text-red-700 dark:text-red-200">
                        {error}
                      </p>
                    </div>
                  </div>
                )}
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-muted-foreground text-sm">
            By continuing, you agree to our{" "}
            <a
              href="/terms"
              className="text-primary font-medium hover:underline"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="/privacy"
              className="text-primary font-medium hover:underline"
            >
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
