"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Brain,
  FileText,
  Users,
  Clock,
  Target,
  Activity,
} from "lucide-react";

interface AnalyticsData {
  totalAssignments: number;
  totalSubmissions: number;
  analyzedSubmissions: number;
  aiGeneratedCount: number;
  humanWrittenCount: number;
  averageConfidenceScore: number;
  recentActivity: {
    date: string;
    submissions: number;
    aiDetected: number;
  }[];
  topAssignments: {
    id: string;
    title: string;
    submissionCount: number;
    aiDetectionRate: number;
  }[];
  detectionTrends: {
    week: string;
    submissions: number;
    aiDetected: number;
    detectionRate: number;
  }[];
}

export default function AssignmentsAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch("/api/assignments/analytics");

      if (!response.ok) {
        // If API doesn't exist yet, use mock data
        setAnalytics(getMockAnalyticsData());
        return;
      }

      const result = await response.json();
      setAnalytics(result.analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      // Use mock data for now
      setAnalytics(getMockAnalyticsData());
      toast({
        title: "Using Demo Data",
        description: "Analytics API not fully implemented yet. Showing sample data.",
        variant: "default",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getMockAnalyticsData = (): AnalyticsData => ({
    totalAssignments: 12,
    totalSubmissions: 148,
    analyzedSubmissions: 132,
    aiGeneratedCount: 23,
    humanWrittenCount: 109,
    averageConfidenceScore: 76,
    recentActivity: [
      { date: "2024-01-15", submissions: 8, aiDetected: 2 },
      { date: "2024-01-14", submissions: 12, aiDetected: 1 },
      { date: "2024-01-13", submissions: 6, aiDetected: 3 },
      { date: "2024-01-12", submissions: 15, aiDetected: 2 },
      { date: "2024-01-11", submissions: 9, aiDetected: 4 },
    ],
    topAssignments: [
      { id: "1", title: "Essay on Climate Change", submissionCount: 45, aiDetectionRate: 22.2 },
      { id: "2", title: "History Research Paper", submissionCount: 38, aiDetectionRate: 18.4 },
      { id: "3", title: "Creative Writing Assignment", submissionCount: 32, aiDetectionRate: 12.5 },
      { id: "4", title: "Science Lab Report", submissionCount: 28, aiDetectionRate: 7.1 },
    ],
    detectionTrends: [
      { week: "Week 1", submissions: 42, aiDetected: 8, detectionRate: 19.0 },
      { week: "Week 2", submissions: 38, aiDetected: 6, detectionRate: 15.8 },
      { week: "Week 3", submissions: 35, aiDetected: 5, detectionRate: 14.3 },
      { week: "Week 4", submissions: 17, aiDetected: 4, detectionRate: 23.5 },
    ],
  });

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

  if (!analytics) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Card>
          <CardContent className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="mb-2">Analytics Not Available</CardTitle>
            <CardDescription>
              Unable to load analytics data. Please try again later.
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    );
  }

  const aiDetectionRate = analytics.analyzedSubmissions > 0
    ? (analytics.aiGeneratedCount / analytics.analyzedSubmissions) * 100
    : 0;

  const pendingAnalysis = analytics.totalSubmissions - analytics.analyzedSubmissions;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <BarChart3 className="h-8 w-8" />
          Assignment Analytics
        </h1>
        <p className="text-muted-foreground mt-1">
          Track AI detection patterns and submission insights across all your assignments
        </p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalAssignments}</div>
            <p className="text-xs text-muted-foreground">Active assignments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalSubmissions}</div>
            <p className="text-xs text-muted-foreground">Files submitted</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Detected</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {analytics.aiGeneratedCount}
            </div>
            <p className="text-xs text-muted-foreground">
              {aiDetectionRate.toFixed(1)}% of analyzed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Human Written</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {analytics.humanWrittenCount}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.analyzedSubmissions > 0
                ? ((analytics.humanWrittenCount / analytics.analyzedSubmissions) * 100).toFixed(1)
                : 0}% of analyzed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Confidence</CardTitle>
            <Brain className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.averageConfidenceScore}%</div>
            <p className="text-xs text-muted-foreground">AI detection confidence</p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Detection Trends</TabsTrigger>
          <TabsTrigger value="assignments">Top Assignments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Analysis Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Analysis Progress</CardTitle>
                <CardDescription>
                  How many submissions have been processed
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Analyzed</span>
                    <span>{analytics.analyzedSubmissions}/{analytics.totalSubmissions}</span>
                  </div>
                  <Progress
                    value={analytics.totalSubmissions > 0
                      ? (analytics.analyzedSubmissions / analytics.totalSubmissions) * 100
                      : 0}
                  />
                </div>
                {pendingAnalysis > 0 && (
                  <div className="flex items-center gap-2 text-sm text-amber-600">
                    <Clock className="h-4 w-4" />
                    <span>{pendingAnalysis} submissions pending analysis</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Detection Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Detection Summary</CardTitle>
                <CardDescription>
                  Breakdown of AI vs human-generated content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span className="text-sm">AI Generated</span>
                    </div>
                    <span className="font-medium">{analytics.aiGeneratedCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-sm">Human Written</span>
                    </div>
                    <span className="font-medium">{analytics.humanWrittenCount}</span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>AI Detection Rate</span>
                      <span>{aiDetectionRate.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Daily submission and detection activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.recentActivity.map((day, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">{new Date(day.date).toLocaleDateString()}</p>
                      <p className="text-sm text-muted-foreground">
                        {day.submissions} submissions • {day.aiDetected} AI detected
                      </p>
                    </div>
                    <Badge variant={day.aiDetected > 2 ? "destructive" : "secondary"}>
                      {day.aiDetected > 0 ? `${((day.aiDetected / day.submissions) * 100).toFixed(0)}% AI` : "No AI"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Detection Trends</CardTitle>
              <CardDescription>AI detection patterns over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.detectionTrends.map((week, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{week.week}</span>
                      <div className="text-right">
                        <span className="text-sm">{week.aiDetected}/{week.submissions}</span>
                        <Badge className="ml-2" variant={week.detectionRate > 20 ? "destructive" : "secondary"}>
                          {week.detectionRate.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                    <Progress value={week.detectionRate} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assignment Performance</CardTitle>
              <CardDescription>
                Assignments ranked by submission count and AI detection rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.topAssignments.map((assignment, index) => (
                  <div key={assignment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{assignment.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {assignment.submissionCount} submissions
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={assignment.aiDetectionRate > 20 ? "destructive" : "secondary"}>
                        {assignment.aiDetectionRate.toFixed(1)}% AI
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}