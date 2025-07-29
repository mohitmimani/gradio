"use client";
import { useState } from "react";
import MultiStepForm from "@/components/ui/multi-step-form";

export default function RoleSelectionModal({ open }: { open: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Multi-step form fields
  const handleOnboardingSubmit = async (data: unknown) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/team/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Failed to create team");
      } else {
        setSuccess(true);
        setTimeout(() => window.location.reload(), 1200);
      }
    } catch {
      setError("Failed to create team");
    }
    setLoading(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="bg-card border-border relative w-full max-w-md rounded-xl border shadow-xl">
        <div className="my-4 text-center">
          <h2 className="text-2xl font-semibold">Team Onboarding</h2>
        </div>
        {success ? (
          <div className="py-8 text-center font-semibold text-green-600">
            Team created successfully!
          </div>
        ) : (
          <MultiStepForm
            onSubmit={handleOnboardingSubmit}
            loading={loading}
            error={error}
          />
        )}
      </div>
    </div>
  );
}
