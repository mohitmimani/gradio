"use client";
import { signIn } from "next-auth/react";
import { useId } from "react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SigninModal() {
  const id = useId();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await signIn("nodemailer", {
        email,
        redirect: false,
        callbackUrl: undefined,
      });
      if (res?.ok) {
        setEmailSent(true);
      } else {
        console.log("Error sending magic link:", res?.error);
        setError("Failed to send magic link. Please try again.");
      }
    } catch (err) {
      console.log("Error sending magic link:", err);

      setError("Failed to send magic link. Please try again.");
    }
    setLoading(false);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary">Sign in</Button>
      </DialogTrigger>
      <DialogContent>
        <div className="flex flex-col items-center gap-2">
          <div
            className="flex size-11 shrink-0 items-center justify-center rounded-full border"
            aria-hidden="true"
          >
            <img src="/gradio.png" alt="logo" className="h-8 w-8" />
          </div>
          <DialogHeader>
            <DialogTitle className="sm:text-center">
              {emailSent ? "Check your email!" : "Welcome back"}
            </DialogTitle>
            <DialogDescription className="sm:text-center">
              {emailSent
                ? "We've sent you a magic link. Please check your inbox (and spam folder) to sign in."
                : "Sign in with a magic link or Google."}
            </DialogDescription>
          </DialogHeader>
        </div>

        {emailSent ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="rounded-full bg-green-100 p-4 dark:bg-green-900/20">
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="12" fill="#22c55e" opacity="0.2" />
                <path
                  d="M7 13l3 3 7-7"
                  stroke="#22c55e"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold">Magic link sent!</p>
              <p className="text-muted-foreground mt-2 text-sm">
                Please check your email to continue.
              </p>
            </div>
          </div>
        ) : (
          <>
            <form className="space-y-5" onSubmit={handleMagicLink}>
              <div className="space-y-4">
                <div className="*:not-first:mt-2">
                  <Label htmlFor={`${id}-email`}>Email</Label>
                  <Input
                    id={`${id}-email`}
                    placeholder="your@email.com"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    className="placeholder:text-muted-foreground/30"
                  />
                </div>
              </div>
              <Button className="w-full" disabled={loading}>
                {loading ? "Sending magic link..." : "Sign in with Magic Link"}
              </Button>
              {error && (
                <div className="text-center text-sm text-red-500">{error}</div>
              )}
            </form>

            <div className="before:bg-border after:bg-border flex items-center gap-3 before:h-px before:flex-1 after:h-px after:flex-1">
              <span className="text-muted-foreground text-xs">Or</span>
            </div>

            <Button
              variant="outline"
              className="w-full"
              type="button"
              onClick={() => signIn("google", { redirect: true })}
            >
              Login with Google
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
