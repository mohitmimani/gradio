"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { CalendarDays, Upload, FileText, Settings } from "lucide-react";

const createAssignmentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  instructions: z.string().optional(),
  dueDate: z.string().optional(),
  allowedFileTypes: z.string().optional(),
  maxFileSize: z.number().optional(),
  isPublished: z.boolean().default(false),
});

type FormData = z.infer<typeof createAssignmentSchema>;

export default function CreateAssignmentPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(createAssignmentSchema),
    defaultValues: {
      allowedFileTypes: "pdf,doc,docx,txt,jpg,jpeg,png",
      maxFileSize: 10,
      isPublished: false,
    },
  });

  const isPublished = watch("isPublished");

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    try {
      const payload = {
        ...data,
        maxFileSize: (data.maxFileSize || 10) * 1024 * 1024, // Convert MB to bytes
      };

      const response = await fetch("/api/assignments/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create assignment");
      }

      toast({
        title: "Assignment Created",
        description: "Your assignment has been created successfully.",
      });

      router.push("/dashboard/assignments/library");
    } catch (error) {
      console.error("Error creating assignment:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create assignment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
          <FileText className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Assignment</h1>
          <p className="text-muted-foreground">
            Create a new file upload assignment for students
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Basic Information
            </CardTitle>
            <CardDescription>
              Set up the basic details for your assignment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Assignment Title</Label>
              <Input
                id="title"
                {...register("title")}
                placeholder="Enter assignment title..."
                className="mt-1"
              />
              {errors.title && (
                <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Brief description of the assignment..."
                className="mt-1"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="instructions">Instructions</Label>
              <Textarea
                id="instructions"
                {...register("instructions")}
                placeholder="Detailed instructions for students..."
                className="mt-1"
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="dueDate">Due Date (Optional)</Label>
              <Input
                id="dueDate"
                type="datetime-local"
                {...register("dueDate")}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              File Upload Settings
            </CardTitle>
            <CardDescription>
              Configure what types of files students can upload
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="allowedFileTypes">Allowed File Types</Label>
              <Input
                id="allowedFileTypes"
                {...register("allowedFileTypes")}
                placeholder="pdf,doc,docx,txt,jpg,jpeg,png"
                className="mt-1"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Comma-separated list of allowed file extensions
              </p>
            </div>

            <div>
              <Label htmlFor="maxFileSize">Maximum File Size (MB)</Label>
              <Input
                id="maxFileSize"
                type="number"
                {...register("maxFileSize", { valueAsNumber: true })}
                placeholder="10"
                className="mt-1"
                min="1"
                max="100"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Maximum size for uploaded files (1-100 MB)
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Publication Settings
            </CardTitle>
            <CardDescription>
              Control the visibility of your assignment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Publish Assignment</Label>
                <p className="text-sm text-muted-foreground">
                  Make this assignment available to students
                </p>
              </div>
              <Switch
                checked={isPublished}
                onCheckedChange={(checked) => setValue("isPublished", checked)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Assignment"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}