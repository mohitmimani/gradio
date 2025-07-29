"use client";

// Add import for custom select
import { Listbox } from "@headlessui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Plus,
  Trash2,
} from "lucide-react";
import { Check, ChevronDown } from "lucide-react";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

// --- New schemas for onboarding ---
const teamInfoSchema = z.object({
  teamName: z.string().min(2, "Team name must be at least 2 characters"),
  logo: z.string().optional(), // base64
});

const inviteeSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["educator", "student", "billing"]),
});

const inviteesSchema = z.object({
  invitees: z
    .array(inviteeSchema)
    .min(1, "Please invite at least one member (can be yourself)"),
});

// --- Combine all schemas ---
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const formSchema = teamInfoSchema.merge(inviteesSchema);

type FormData = z.infer<typeof formSchema>;
type Invitee = z.infer<typeof inviteeSchema>;

interface MultiStepFormProps {
  className?: string;
  onSubmit?: (data: FormData) => void;
  loading?: boolean;
  error?: string | null;
}

export default function MultiStepForm({
  className,
  onSubmit,
  loading,
  error,
}: MultiStepFormProps) {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<Partial<FormData>>({
    invitees: [{ email: "", role: "educator" }],
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [, setFocusedInvitee] = useState<number | null>(null);

  // Steps
  const steps = [
    {
      id: "team",
      title: "Team Details",
      description: "Set your team name and logo",
      schema: teamInfoSchema,
      fields: [
        {
          name: "teamName",
          label: "Team Name",
          type: "text",
          placeholder: "Acme Inc.",
        },
        {
          name: "logo",
          label: "Team Logo",
          type: "file",
        },
      ],
    },
    {
      id: "invitees",
      title: "Invite Members",
      description: "Invite educators, students, and billing manager",
      schema: inviteesSchema,
      fields: [], // handled custom below
    },
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentStepSchema = steps[step].schema as z.ZodType<any, any, any>;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm<FormData | Partial<FormData>>({
    resolver: zodResolver(currentStepSchema),
    defaultValues: formData,
  });

  // Handle logo upload and convert to base64
  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
      setValue("logo", reader.result as string, { shouldValidate: true });
    };
    reader.readAsDataURL(file);
  };

  // Invitees state
  const invitees: Invitee[] = (formData.invitees as Invitee[]) || [
    { email: "", role: "educator" },
  ];

  // Helper: validate email format
  function isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
  // Helper: check for duplicate emails
  function isDuplicateEmail(email: string, idx: number) {
    return (
      email &&
      invitees.some((inv, i) => i !== idx && inv.email.trim() === email.trim())
    );
  }

  const handleInviteeChange = (
    idx: number,
    field: keyof Invitee,
    value: string,
  ) => {
    const updated = invitees.map((inv, i) =>
      i === idx
        ? {
            ...inv,
            [field]:
              field === "role"
                ? (value as "educator" | "student" | "billing")
                : value,
          }
        : inv,
    );
    setFormData((prev) => ({ ...prev, invitees: updated as Invitee[] }));
    setValue(
      "invitees",
      updated as { email: string; role: "educator" | "student" | "billing" }[],
      { shouldValidate: true },
    );
  };

  const addInvitee = () => {
    const updated = [...invitees, { email: "", role: "student" }];
    setFormData((prev) => ({ ...prev, invitees: updated as Invitee[] }));
    setValue(
      "invitees",
      updated as { email: string; role: "educator" | "student" | "billing" }[],
      { shouldValidate: true },
    );
    setTimeout(() => setFocusedInvitee(updated.length - 1), 0);
  };

  const removeInvitee = (idx: number) => {
    if (invitees.length <= 1) return;
    const updated = invitees.filter((_, i) => i !== idx);
    setFormData((prev) => ({ ...prev, invitees: updated }));
    setValue("invitees", updated, { shouldValidate: true });
    setFocusedInvitee(null);
  };

  // Progress
  const progress = ((step + 1) / steps.length) * 100;

  // Next step
  const handleNextStep = (data: FormData | Partial<FormData>) => {
    const updatedData = { ...formData, ...data };
    setFormData(updatedData);
    if (step < steps.length - 1) {
      setStep(step + 1);
      reset(updatedData);
    } else {
      if (onSubmit) onSubmit(updatedData as FormData);
    }
  };

  // Previous step
  const handlePrevStep = () => {
    if (step > 0) setStep(step - 1);
  };

  // Animation variants
  const variants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  };

  return (
    <div
      className={cn(
        "bg-card/40 mx-auto w-full max-w-md rounded-lg p-6 shadow-lg",
        className,
      )}
    >
      {/* Progress bar */}
      <div className="mb-8">
        <div className="mb-2 flex justify-between">
          <span className="text-sm font-medium">
            Step {step + 1} of {steps.length}
          </span>
          <span className="text-sm font-medium">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step indicators */}
      <div className="mb-8 flex justify-between">
        {steps.map((s, i) => (
          <div key={s.id} className="flex flex-col items-center">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold",
                i < step
                  ? "bg-primary text-primary-foreground"
                  : i === step
                    ? "bg-primary text-primary-foreground ring-primary/30 ring-2"
                    : "bg-secondary text-secondary-foreground",
              )}
            >
              {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
            </div>
            <span className="mt-1 hidden text-xs sm:block">{s.title}</span>
          </div>
        ))}
      </div>

      {/* Form */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={variants}
          transition={{ duration: 0.3 }}
        >
          <div className="mb-6">
            <h2 className="text-xl font-bold">{steps[step].title}</h2>
            <p className="text-muted-foreground text-sm">
              {steps[step].description}
            </p>
          </div>

          <form onSubmit={handleSubmit(handleNextStep)} className="space-y-4">
            {/* Step 1: Team Info */}
            {step === 0 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="teamName">Team Name</Label>
                  <Input
                    id="teamName"
                    type="text"
                    placeholder="Acme Inc."
                    {...register("teamName")}
                    className={cn(errors.teamName && "border-destructive")}
                  />
                  {errors.teamName && (
                    <p className="text-destructive text-sm">
                      {errors.teamName.message as string}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logo">Team Logo</Label>
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                  />
                  {logoPreview && (
                    <img
                      src={logoPreview}
                      alt="Logo Preview"
                      className="mt-2 h-16 w-16 rounded border object-cover"
                    />
                  )}
                  {errors.logo && (
                    <p className="text-destructive text-sm">
                      {errors.logo.message as string}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Step 2: Invitees */}
            {step === 1 && (
              <div>
                <Label>Invite Members</Label>
                <div className="space-y-2">
                  {invitees.map((inv, idx) => {
                    const emailError = !inv.email
                      ? "Email is required"
                      : !isValidEmail(inv.email)
                        ? "Invalid email"
                        : isDuplicateEmail(inv.email, idx)
                          ? "Duplicate email"
                          : null;
                    return (
                      <div
                        key={idx}
                        className={cn(
                          "flex flex-col gap-1 border-b pb-2",
                          "border-border dark:border-border-dark",
                          // Removed red border/bg for error
                          // emailError &&
                          //   "border-l-destructive/70 bg-destructive/5 dark:bg-destructive/10 border-l-4",
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Input
                            type="email"
                            placeholder="Email"
                            value={inv.email}
                            onChange={(e) =>
                              handleInviteeChange(idx, "email", e.target.value)
                            }
                            className={cn(
                              "flex-1",
                              emailError &&
                                "border-destructive ring-destructive/30 ring-1 dark:border-red-500",
                              "bg-white dark:bg-zinc-900 dark:text-zinc-100",
                            )}
                            required
                            onFocus={() => setFocusedInvitee(idx)}
                            onBlur={() => setFocusedInvitee(null)}
                          />
                          {/* Custom role select */}
                          <div className="relative w-40">
                            <Listbox
                              value={inv.role}
                              onChange={(val) =>
                                handleInviteeChange(
                                  idx,
                                  "role",
                                  val as "educator" | "student" | "billing",
                                )
                              }
                            >
                              <Listbox.Button
                                className={cn(
                                  "focus:ring-primary flex w-full items-center justify-between rounded border bg-white px-2 py-1 text-sm focus:ring-2 focus:outline-none",
                                  "transition-colors",
                                  "border-border dark:border-border-dark",
                                  "bg-white dark:bg-zinc-900 dark:text-zinc-100",
                                )}
                              >
                                <span>
                                  {inv.role === "educator"
                                    ? "Educator"
                                    : inv.role === "student"
                                      ? "Student"
                                      : "Billing Manager"}
                                </span>
                                <ChevronDown className="ml-2 h-4 w-4" />
                              </Listbox.Button>
                              <Listbox.Options className="border-border dark:border-border-dark absolute z-10 mt-1 w-56 rounded border bg-white shadow-lg focus:outline-none dark:bg-zinc-900">
                                <Listbox.Option
                                  value="educator"
                                  className={({ active }) =>
                                    cn(
                                      "cursor-pointer px-3 py-2 text-sm",
                                      active && "bg-accent dark:bg-zinc-800",
                                    )
                                  }
                                >
                                  {({ selected }) => (
                                    <div className="flex items-center gap-2">
                                      {selected && (
                                        <Check className="text-primary h-4 w-4" />
                                      )}
                                      <span>Educator</span>
                                      <span className="text-muted-foreground ml-auto text-xs dark:text-zinc-400">
                                        Can manage content
                                      </span>
                                    </div>
                                  )}
                                </Listbox.Option>
                                <Listbox.Option
                                  value="billing"
                                  className={({ active }) =>
                                    cn(
                                      "cursor-pointer px-3 py-2 text-sm",
                                      active && "bg-accent dark:bg-zinc-800",
                                    )
                                  }
                                >
                                  {({ selected }) => (
                                    <div className="flex items-center gap-2">
                                      {selected && (
                                        <Check className="text-primary h-4 w-4" />
                                      )}
                                      <span>Billing Manager</span>
                                      <span className="text-muted-foreground ml-auto text-xs dark:text-zinc-400">
                                        Can manage billing
                                      </span>
                                    </div>
                                  )}
                                </Listbox.Option>
                              </Listbox.Options>
                            </Listbox>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeInvitee(idx)}
                            className={cn(
                              "text-destructive ml-1",
                              "dark:text-red-400",
                              invitees.length <= 1 &&
                                "cursor-not-allowed opacity-50",
                            )}
                            aria-label="Remove"
                            disabled={invitees.length <= 1}
                            tabIndex={invitees.length <= 1 ? -1 : 0}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        {emailError && (
                          <div className="mt-1 flex items-center gap-1">
                            <svg
                              className="text-destructive h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2}
                              viewBox="0 0 24 24"
                            >
                              <circle cx="12" cy="12" r="10" />
                              <line x1="12" y1="8" x2="12" y2="13" />
                              <circle cx="12" cy="16" r="1" />
                            </svg>
                            <p className="text-destructive text-xs font-medium dark:text-red-400">
                              {emailError}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addInvitee}
                    className="border-border dark:border-border-dark mt-2 bg-white dark:bg-zinc-900 dark:text-zinc-100"
                  >
                    <Plus className="mr-1 h-4 w-4" /> Add another
                  </Button>
                  {errors.invitees && (
                    <p className="text-destructive text-sm dark:text-red-400">
                      {errors.invitees.message as string}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="rounded border border-red-200 bg-red-50 p-2 text-red-600">
                {error}
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevStep}
                disabled={step === 0}
                className={cn(step === 0 && "invisible")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button type="submit" disabled={loading}>
                {step === steps.length - 1 ? (
                  loading ? (
                    "Submitting..."
                  ) : (
                    "Submit"
                  )
                ) : (
                  <>
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
