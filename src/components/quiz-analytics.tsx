"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Users,
  TrendingUp,
  Clock,
  Target,
  AlertTriangle,
  Shield,
  Loader2,
} from "lucide-react";

interface QuizAnalytics {
  totalResponses: number;
  averageScore: number;
  averageTime: number;
  completionRate: number;
  scoreDistribution: Array<{ range: string; count: number }>;
  questionPerformance: Array<{
    questionId: string;
    question: string;
    correctAnswers: number;
    totalAnswers: number;
    difficulty: number;
  }>;
  timeDistribution: Array<{ range: string; count: number }>;
  cheatingMetrics: {
    totalSuspiciousActivities: number;
    averageRiskScore: number;
    highRiskSubmissions: number;
  };
  topPerformers: Array<{
    studentName: string;
    score: number;
    totalScore: number;
    percentage: number;
  }>;
}

interface QuizAnalyticsProps {
  quizId: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function QuizAnalytics({ quizId }: QuizAnalyticsProps) {
  const [analytics, setAnalytics] = useState<QuizAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (quizId) {
      fetchAnalytics();
    }
  }, [quizId]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/analytics/quiz/${quizId}`);
      if (!response.ok) throw new Error("Failed to fetch analytics");
      
      const data = await response.json();
      setAnalytics(data.analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Loading analytics...</span>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Failed to load analytics data</p>
      </div>
    );
  }

  if (analytics.totalResponses === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
        <p className="font-medium">No Submissions Yet</p>
        <p className="text-sm mt-2">
          Analytics will appear once students start taking this quiz
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{analytics.totalResponses}</p>
                <p className="text-xs text-muted-foreground">Total Submissions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{analytics.averageScore.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">Average Score</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{Math.round(analytics.averageTime / 60)}m</p>
                <p className="text-xs text-muted-foreground">Avg. Time</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{analytics.cheatingMetrics.highRiskSubmissions}</p>
                <p className="text-xs text-muted-foreground">High Risk</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Score Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={analytics.scoreDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Time Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Time Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={analytics.timeDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ range, count }) => `${range}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {analytics.timeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Question Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Question Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.questionPerformance.map((question, index) => {
              const successRate = (question.correctAnswers / question.totalAnswers) * 100;
              const difficultyLevel = 
                successRate > 80 ? { label: "Easy", color: "text-green-600" } :
                successRate > 60 ? { label: "Medium", color: "text-yellow-600" } :
                { label: "Hard", color: "text-red-600" };
              
              return (
                <div key={question.questionId} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 mr-4">
                      <p className="font-medium text-sm">Q{index + 1}: {question.question}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={difficultyLevel.color}>
                        {difficultyLevel.label}
                      </Badge>
                      <span className="text-sm font-medium">
                        {successRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={successRate} className="flex-1" />
                    <span className="text-xs text-muted-foreground">
                      {question.correctAnswers}/{question.totalAnswers}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Top Performers */}
      {analytics.topPerformers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Performers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.topPerformers.map((performer, index) => (
                <div key={index} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-800' :
                      index === 1 ? 'bg-gray-100 text-gray-800' :
                      index === 2 ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {index + 1}
                    </div>
                    <span className="font-medium">{performer.studentName}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{performer.percentage.toFixed(1)}%</div>
                    <div className="text-xs text-muted-foreground">
                      {performer.score}/{performer.totalScore}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Security Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-orange-600">
                {analytics.cheatingMetrics.totalSuspiciousActivities}
              </div>
              <div className="text-sm text-muted-foreground">Total Suspicious Activities</div>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-red-600">
                {analytics.cheatingMetrics.highRiskSubmissions}
              </div>
              <div className="text-sm text-muted-foreground">High Risk Submissions</div>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-blue-600">
                {analytics.cheatingMetrics.averageRiskScore.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Average Risk Score</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}