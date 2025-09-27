"use client";

import { useState, useEffect } from "react";
import React from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import FileUpload from "@/components/assignments/file-upload";
import {
  FileText,
  Calendar,
  Upload,
  CheckCircle,
  AlertTriangle,
  Clock,
  User,
} from "lucide-react";

interface Assignment {
  id: string;
  title: string;
  description: string;
  instructions: string;
  dueDate: string | null;
  allowedFileTypes: string;
  maxFileSize: number;
  createdBy: string;
  isPublished: boolean;
  createdAt: string;
}

interface Submission {
  id: string;
  fileName: string;
  originalFileName: string;
  fileSize: number;
  status: "submitted" | "analyzing" | "analyzed" | "error";
  submittedAt: string;
  analyzedAt: string | null;
}

export default function AssignmentSubmissionPage() {
  const params = useParams();
  const shareCode = Array.isArray(params.shareCode) ? params.shareCode[0] : params.shareCode;
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (shareCode) {
      fetchAssignmentByShareCode();
    }
  }, [shareCode]);

  const fetchAssignmentByShareCode = async () => {
    try {
      setIsLoading(true);
      console.log("Fetching assignment with share code:", shareCode);

      const response = await fetch(`/api/assignments/share/${shareCode}`);
      const result = await response.json();

      console.log("Assignment fetch response:", result);

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch assignment");
      }

      setAssignment(result.assignment);
      setSubmissions(result.submissions || []);
      console.log("Assignment loaded:", result.assignment);
    } catch (error) {
      console.error("Error fetching assignment:", error);
      setError(error instanceof Error ? error.message : "Failed to load assignment");
      toast({
        title: "Error",
        description: "Failed to load assignment details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadSuccess = (submission: any) => {
    setSubmissions(prev => [...prev, submission]);

    // Show detailed success confirmation
    toast({
      title: "🎉 File Submitted Successfully!",
      description: `${submission.originalFileName} has been uploaded and is now being analyzed for AI-generated content. You'll see the results shortly.`,
      duration: 6000,
    });

    // Start analysis automatically
    analyzeSubmission(submission.id);
  };

  const handleSimpleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !assignment) return;

    // Validate file size
    if (file.size > assignment.maxFileSize) {
      const maxSizeMB = assignment.maxFileSize / 1024 / 1024;
      toast({
        title: "File Too Large",
        description: `File size exceeds maximum limit of ${maxSizeMB}MB`,
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    const fileExtension = file.name.split(".").pop()?.toLowerCase() || "";
    if (!allowedFileTypes.includes(fileExtension)) {
      toast({
        title: "Invalid File Type",
        description: `File type .${fileExtension} is not allowed. Allowed types: ${allowedFileTypes.join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("assignmentId", assignment.id);
      formData.append("studentName", "");
      formData.append("studentEmail", "");

      const response = await fetch("/api/assignments/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Upload failed");
      }

      toast({
        title: "Upload Successful",
        description: `${file.name} has been uploaded successfully`,
      });

      handleUploadSuccess(result.submission);

    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Upload failed",
        variant: "destructive",
      });
    }

    // Reset the input
    event.target.value = "";
  };

  const analyzeSubmission = async (submissionId: string) => {
    try {
      const response = await fetch("/api/assignments/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ submissionId }),
      });

      if (!response.ok) {
        throw new Error("Failed to start analysis");
      }

      toast({
        title: "Analysis Started",
        description: "Your submission is being analyzed for AI-generated content",
      });

      // Update submission status
      setSubmissions(prev =>
        prev.map(sub =>
          sub.id === submissionId
            ? { ...sub, status: "analyzing" as const }
            : sub
        )
      );

      // Poll for analysis completion (optional - could also use websockets)
      setTimeout(() => {
        fetchAssignmentByShareCode();
      }, 5000);

    } catch (error) {
      console.error("Error starting analysis:", error);
      toast({
        title: "Analysis Failed",
        description: "Failed to start AI analysis",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No due date";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "submitted":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "analyzing":
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      case "analyzed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "submitted":
        return "Submitted";
      case "analyzing":
        return "Analyzing...";
      case "analyzed":
        return "Analysis Complete";
      case "error":
        return "Analysis Error";
      default:
        return "Unknown";
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="space-y-6">
          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-8 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardContent className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="mb-2">Assignment Not Found</CardTitle>
            <CardDescription>
              {error || "The assignment you're looking for doesn't exist or has been removed."}
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!assignment.isPublished) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardContent className="text-center py-12">
            <Clock className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <CardTitle className="mb-2">Assignment Not Available</CardTitle>
            <CardDescription>
              This assignment is not yet published. Please check back later.
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    );
  }

  const allowedFileTypes = assignment.allowedFileTypes.split(",").map(type => type.trim());
  const isOverdue = assignment.dueDate && new Date(assignment.dueDate) < new Date();

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      {/* Assignment Header */}
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <FileText className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{assignment.title}</h1>
          {assignment.description && (
            <p className="text-muted-foreground mt-1">{assignment.description}</p>
          )}
          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Due: {formatDate(assignment.dueDate)}</span>
              {isOverdue && (
                <Badge variant="destructive" className="ml-2">
                  Overdue
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Assignment Instructions */}
      {assignment.instructions && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap">{assignment.instructions}</div>
          </CardContent>
        </Card>
      )}

      {/* File Upload Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Submission Requirements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium mb-1">Allowed File Types</p>
              <p className="text-sm text-muted-foreground">
                {allowedFileTypes.join(", ").toUpperCase()}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Maximum File Size</p>
              <p className="text-sm text-muted-foreground">
                {formatFileSize(assignment.maxFileSize)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Upload Area */}
      {!isOverdue && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Submit Your Work</CardTitle>
            <CardDescription>
              Upload your files here. They will be automatically analyzed for AI-generated content.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUpload
              assignmentId={assignment.id}
              allowedFileTypes={allowedFileTypes}
              maxFileSize={assignment.maxFileSize}
              onUploadSuccess={handleUploadSuccess}
            />
          </CardContent>
        </Card>
      )}

      {/* Success Message for Recent Submissions */}
      {submissions.length > 0 && submissions.some(s =>
        new Date(s.submittedAt).getTime() > Date.now() - 30000 // Show for 30 seconds
      ) && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-900">Submission Confirmed!</h3>
                <p className="text-sm text-green-700">
                  Your file has been successfully submitted and is being processed.
                  Check back in a few minutes to see the AI analysis results.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Show overdue message */}
      {isOverdue && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-red-600">Assignment Overdue</CardTitle>
            <CardDescription>
              This assignment was due on {formatDate(assignment.dueDate)}. Submissions are no longer accepted.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Previous Submissions */}
      {submissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Your Submissions
            </CardTitle>
            <CardDescription>
              Files you have submitted for this assignment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {submissions.map((submission) => (
                <div
                  key={submission.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {submission.originalFileName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(submission.fileSize)} • Submitted {" "}
                        {new Date(submission.submittedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(submission.status)}
                    <span className="text-sm">{getStatusText(submission.status)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}