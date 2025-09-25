"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Plus,
  Calendar,
  Users,
  Eye,
  Edit3,
  Trash2,
  Share2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string | null;
  isPublished: boolean;
  shareCode: string;
  createdAt: string;
  updatedAt: string;
  submissionCount: number;
}

export default function AssignmentLibraryPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const response = await fetch("/api/assignments/list");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch assignments");
      }

      setAssignments(result.assignments || []);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      toast({
        title: "Error",
        description: "Failed to load assignments",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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

  const copyShareLink = async (shareCode: string) => {
    const shareLink = `${window.location.origin}/assignment/${shareCode}`;

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

  const togglePublishStatus = async (assignmentId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isPublished: !currentStatus,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update assignment");
      }

      toast({
        title: currentStatus ? "Assignment Unpublished" : "Assignment Published",
        description: currentStatus
          ? "Assignment is no longer accessible to students"
          : "Assignment is now available to students",
      });

      // Refresh the assignments list
      fetchAssignments();

    } catch (error) {
      console.error("Error updating assignment:", error);
      toast({
        title: "Error",
        description: "Failed to update assignment status",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Assignment Library</h1>
            <p className="text-muted-foreground">Manage your assignments and view submissions</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assignment Library</h1>
          <p className="text-muted-foreground">
            Manage your assignments and view submissions
          </p>
        </div>
        <Link href="/dashboard/assignments/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Assignment
          </Button>
        </Link>
      </div>

      {assignments.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <CardTitle className="mb-2">No assignments yet</CardTitle>
            <CardDescription className="mb-4">
              Create your first assignment to get started with file submissions and AI analysis
            </CardDescription>
            <Link href="/dashboard/assignments/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Assignment
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {assignments.map((assignment) => (
            <Card key={assignment.id} className="relative group hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="line-clamp-1 text-lg">
                      {assignment.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={assignment.isPublished ? "default" : "secondary"}>
                        {assignment.isPublished ? "Published" : "Draft"}
                      </Badge>
                      {assignment.submissionCount > 0 && (
                        <Badge variant="outline" className="text-xs">
                          <Users className="h-3 w-3 mr-1" />
                          {assignment.submissionCount} submissions
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                {assignment.description && (
                  <CardDescription className="line-clamp-2">
                    {assignment.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Due: {formatDate(assignment.dueDate)}</span>
                  </div>
                  <div className="text-xs">
                    Created: {new Date(assignment.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Link href={`/dashboard/assignments/view/${assignment.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </Link>
                  <Button
                    variant={assignment.isPublished ? "default" : "outline"}
                    size="sm"
                    onClick={() => togglePublishStatus(assignment.id, assignment.isPublished)}
                  >
                    {assignment.isPublished ? "Published" : "Publish"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyShareLink(assignment.shareCode)}
                    disabled={!assignment.isPublished}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}