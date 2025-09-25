"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  Calendar,
  Users,
  Brain,
  Download,
  Share2,
  Edit3,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Copy,
  Eye,
} from "lucide-react";

interface Assignment {
  id: string;
  title: string;
  description: string;
  instructions: string;
  dueDate: string | null;
  allowedFileTypes: string;
  maxFileSize: number;
  isPublished: boolean;
  shareCode: string;
  createdAt: string;
  updatedAt: string;
}

interface Submission {
  id: string;
  studentName: string;
  studentEmail: string;
  fileName: string;
  fileSize: number;
  status: "submitted" | "analyzing" | "analyzed" | "error";
  submittedAt: string;
  analyzedAt: string | null;
  isAiGenerated: boolean | null;
  confidenceScore: number | null;
  aiDetectionReason: string | null;
  handwritingConfidence: number | null;
}

export default function AssignmentViewPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (assignmentId) {
      fetchAssignmentDetails();
    }
  }, [assignmentId]);

  const fetchAssignmentDetails = async () => {
    try {
      const response = await fetch(`/api/assignments/${assignmentId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch assignment");
      }

      setAssignment(result.assignment);
      setSubmissions(result.submissions || []);
    } catch (error) {
      console.error("Error fetching assignment:", error);
      toast({
        title: "Error",
        description: "Failed to load assignment details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
        description: "The submission is being analyzed for AI-generated content",
      });

      // Refresh the data
      setTimeout(() => {
        fetchAssignmentDetails();
      }, 2000);

    } catch (error) {
      console.error("Error analyzing submission:", error);
      toast({
        title: "Analysis Failed",
        description: "Failed to start AI analysis",
        variant: "destructive",
      });
    }
  };

  const bulkAnalyzeSubmissions = async () => {
    const unanalyzedSubmissions = submissions.filter(s => s.status === "submitted");

    if (unanalyzedSubmissions.length === 0) {
      toast({
        title: "No Submissions to Analyze",
        description: "All submissions have already been analyzed",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/assignments/bulk-analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ assignmentId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to start bulk analysis");
      }

      toast({
        title: "Bulk Analysis Started",
        description: `Analysis started for ${result.totalSubmissions} submissions`,
      });

      // Refresh the data after a delay
      setTimeout(() => {
        fetchAssignmentDetails();
      }, 3000);

    } catch (error) {
      console.error("Error starting bulk analysis:", error);
      toast({
        title: "Bulk Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to start bulk analysis",
        variant: "destructive",
      });
    }
  };

  const copyShareLink = async () => {
    if (!assignment) return;

    const shareLink = `${window.location.origin}/assignment/${assignment.shareCode}`;

    try {
      await navigator.clipboard.writeText(shareLink);
      toast({
        title: "Link Copied",
        description: "Assignment share link has been copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link to clipboard",
        variant: "destructive",
      });
    }
  };

  const togglePublishStatus = async () => {
    if (!assignment) return;

    try {
      const response = await fetch(`/api/assignments/${assignment.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isPublished: !assignment.isPublished,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update assignment");
      }

      const result = await response.json();

      toast({
        title: assignment.isPublished ? "Assignment Unpublished" : "Assignment Published",
        description: assignment.isPublished
          ? "Assignment is no longer accessible to students"
          : "Assignment is now available to students via the share link",
      });

      // Refresh the assignment data
      fetchAssignmentDetails();

    } catch (error) {
      console.error("Error updating assignment:", error);
      toast({
        title: "Error",
        description: "Failed to update assignment status",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No due date";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
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

  const getAiConfidenceColor = (score: number | null) => {
    if (score === null) return "bg-gray-500";
    if (score >= 80) return "bg-red-500";
    if (score >= 60) return "bg-orange-500";
    if (score >= 40) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getAiConfidenceText = (isAiGenerated: boolean | null, score: number | null) => {
    if (isAiGenerated === null || score === null) return "Pending Analysis";
    return isAiGenerated ? `${score}% AI Generated` : `${100 - score}% Human Written`;
  };

  // Calculate statistics
  const totalSubmissions = submissions.length;
  const analyzedSubmissions = submissions.filter(s => s.status === "analyzed").length;
  const aiGeneratedCount = submissions.filter(s => s.isAiGenerated === true).length;
  const humanWrittenCount = submissions.filter(s => s.isAiGenerated === false).length;

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 bg-muted rounded w-64 animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-48 mt-2 animate-pulse"></div>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Card>
          <CardContent className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="mb-2">Assignment Not Found</CardTitle>
            <CardDescription>
              The assignment you're looking for doesn't exist or you don't have access to it.
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{assignment.title}</h1>
          <p className="text-muted-foreground mt-1">
            Created {new Date(assignment.createdAt).toLocaleDateString()}
            {assignment.dueDate && ` • Due ${formatDate(assignment.dueDate)}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/dashboard/assignments/library")}>
            Back to Library
          </Button>
          <Button
            variant={assignment.isPublished ? "default" : "outline"}
            onClick={togglePublishStatus}
          >
            {assignment.isPublished ? "Published" : "Publish"}
          </Button>
          <Button variant="outline" onClick={copyShareLink}>
            <Share2 className="h-4 w-4 mr-2" />
            Copy Link
          </Button>
          <Button variant="outline">
            <Edit3 className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSubmissions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Analyzed</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyzedSubmissions}</div>
            <p className="text-xs text-muted-foreground">
              {totalSubmissions > 0 ? Math.round((analyzedSubmissions / totalSubmissions) * 100) : 0}% complete
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Generated</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{aiGeneratedCount}</div>
            <p className="text-xs text-muted-foreground">
              {analyzedSubmissions > 0 ? Math.round((aiGeneratedCount / analyzedSubmissions) * 100) : 0}% of analyzed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Human Written</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{humanWrittenCount}</div>
            <p className="text-xs text-muted-foreground">
              {analyzedSubmissions > 0 ? Math.round((humanWrittenCount / analyzedSubmissions) * 100) : 0}% of analyzed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Assignment Details & Submissions */}
      <Tabs defaultValue="submissions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          <TabsTrigger value="details">Assignment Details</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="submissions" className="space-y-4">
          {submissions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <CardTitle className="mb-2">No submissions yet</CardTitle>
                <CardDescription>
                  Share the assignment link with students to start receiving submissions
                </CardDescription>
                <Button className="mt-4" onClick={copyShareLink}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Share Link
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Student Submissions</CardTitle>
                    <CardDescription>
                      Review submissions and AI analysis results
                    </CardDescription>
                  </div>
                  <Button
                    onClick={bulkAnalyzeSubmissions}
                    variant="outline"
                    disabled={submissions.filter(s => s.status === "submitted").length === 0}
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    Analyze All ({submissions.filter(s => s.status === "submitted").length})
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {submissions.map((submission) => (
                    <div key={submission.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{submission.studentName || "Anonymous"}</h4>
                            <Badge variant="outline" className="text-xs">
                              {submission.studentEmail}
                            </Badge>
                            {getStatusIcon(submission.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {submission.fileName} • {formatFileSize(submission.fileSize)} •{" "}
                            {new Date(submission.submittedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {submission.status === "submitted" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => analyzeSubmission(submission.id)}
                            >
                              <Brain className="h-4 w-4 mr-1" />
                              Analyze
                            </Button>
                          )}
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>

                      {submission.status === "analyzed" && submission.confidenceScore !== null && (
                        <div className="space-y-3 pt-3 border-t">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">AI Detection Result:</span>
                            <Badge variant={submission.isAiGenerated ? "destructive" : "default"}>
                              {getAiConfidenceText(submission.isAiGenerated, submission.confidenceScore)}
                            </Badge>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>AI Confidence</span>
                              <span>{submission.confidenceScore}%</span>
                            </div>
                            <Progress
                              value={submission.confidenceScore}
                              className="h-2"
                              style={{
                                "--progress-background": getAiConfidenceColor(submission.confidenceScore),
                              } as any}
                            />
                          </div>

                          {submission.handwritingConfidence !== null && submission.handwritingConfidence > 0 && (
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Handwriting Confidence</span>
                                <span>{submission.handwritingConfidence}%</span>
                              </div>
                              <Progress value={submission.handwritingConfidence} className="h-2" />
                            </div>
                          )}

                          {submission.aiDetectionReason && (
                            <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                              <strong>Analysis:</strong> {submission.aiDetectionReason}
                            </div>
                          )}
                        </div>
                      )}

                      {submission.status === "analyzing" && (
                        <div className="pt-3 border-t">
                          <div className="flex items-center gap-2 text-sm text-blue-600">
                            <Clock className="h-4 w-4 animate-spin" />
                            Analyzing submission for AI-generated content...
                          </div>
                        </div>
                      )}

                      {submission.status === "error" && (
                        <div className="pt-3 border-t">
                          <div className="flex items-center gap-2 text-sm text-red-600">
                            <AlertTriangle className="h-4 w-4" />
                            Analysis failed. Please try again.
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Assignment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-1">Title</h4>
                <p className="text-muted-foreground">{assignment.title}</p>
              </div>

              {assignment.description && (
                <div>
                  <h4 className="font-medium mb-1">Description</h4>
                  <p className="text-muted-foreground">{assignment.description}</p>
                </div>
              )}

              {assignment.instructions && (
                <div>
                  <h4 className="font-medium mb-1">Instructions</h4>
                  <div className="text-muted-foreground whitespace-pre-wrap bg-muted/50 p-3 rounded">
                    {assignment.instructions}
                  </div>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h4 className="font-medium mb-1">Due Date</h4>
                  <p className="text-muted-foreground">{formatDate(assignment.dueDate)}</p>
                </div>

                <div>
                  <h4 className="font-medium mb-1">Status</h4>
                  <Badge variant={assignment.isPublished ? "default" : "secondary"}>
                    {assignment.isPublished ? "Published" : "Draft"}
                  </Badge>
                </div>

                <div>
                  <h4 className="font-medium mb-1">Allowed File Types</h4>
                  <p className="text-muted-foreground">
                    {assignment.allowedFileTypes.split(",").join(", ").toUpperCase()}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-1">Max File Size</h4>
                  <p className="text-muted-foreground">{formatFileSize(assignment.maxFileSize)}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-1">Share Code</h4>
                <div className="flex items-center gap-2">
                  <code className="bg-muted px-2 py-1 rounded text-sm">{assignment.shareCode}</code>
                  <Button size="sm" variant="outline" onClick={copyShareLink}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Submission Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Analytics coming soon</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI Detection Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Analyzed</span>
                  <Badge variant="outline">{analyzedSubmissions}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">AI Generated</span>
                  <Badge variant="destructive">{aiGeneratedCount}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Human Written</span>
                  <Badge variant="default">{humanWrittenCount}</Badge>
                </div>
                {analyzedSubmissions > 0 && (
                  <div className="pt-2">
                    <div className="text-sm text-muted-foreground mb-2">Detection Rate</div>
                    <Progress value={(aiGeneratedCount / analyzedSubmissions) * 100} />
                    <p className="text-xs text-muted-foreground mt-1">
                      {Math.round((aiGeneratedCount / analyzedSubmissions) * 100)}% flagged as AI-generated
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}