"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChartBar, Download, Eye, FileText, TrendingUp, Users } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import ResponseDetailModal from "@/components/response-detail-modal";

interface Response {
  id: string;
  studentName: string;
  studentEmail: string;
  quizTitle: string;
  score: number;
  totalScore: number;
  submittedAt: string;
  timeSpent: number;
}

interface QuizStats {
  totalResponses: number;
  averageScore: number;
  completionRate: number;
  averageTime: number;
}

export default function StudentResponsesPage() {
  const [responses, setResponses] = useState<Response[]>([]);
  const [filteredResponses, setFilteredResponses] = useState<Response[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<string>("all");
  const [quizzes, setQuizzes] = useState<{ id: string; title: string }[]>([]);
  const [stats, setStats] = useState<QuizStats>({
    totalResponses: 0,
    averageScore: 0,
    completionRate: 0,
    averageTime: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedResponseId, setSelectedResponseId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchResponses();
    fetchQuizzes();
  }, []);

  useEffect(() => {
    filterResponses();
    calculateStats();
  }, [selectedQuiz, responses]);

  const fetchResponses = async () => {
    try {
      const response = await fetch("/api/responses");
      if (!response.ok) throw new Error("Failed to fetch responses");
      const data = await response.json();
      setResponses(data.responses);
      setFilteredResponses(data.responses);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load responses",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchQuizzes = async () => {
    try {
      const response = await fetch("/api/mcq/list");
      if (!response.ok) throw new Error("Failed to fetch quizzes");
      const data = await response.json();
      setQuizzes(data.quizzes);
    } catch (error) {
      console.error("Failed to load quizzes");
    }
  };

  const filterResponses = () => {
    if (selectedQuiz === "all") {
      setFilteredResponses(responses);
    } else {
      setFilteredResponses(responses.filter(r => r.quizTitle === selectedQuiz));
    }
  };

  const calculateStats = () => {
    const filtered = selectedQuiz === "all" ? responses : responses.filter(r => r.quizTitle === selectedQuiz);
    
    if (filtered.length === 0) {
      setStats({
        totalResponses: 0,
        averageScore: 0,
        completionRate: 0,
        averageTime: 0,
      });
      return;
    }

    const totalScore = filtered.reduce((acc, r) => acc + (r.score / r.totalScore * 100), 0);
    const totalTime = filtered.reduce((acc, r) => acc + r.timeSpent, 0);
    
    setStats({
      totalResponses: filtered.length,
      averageScore: Math.round(totalScore / filtered.length),
      completionRate: 100, // All submitted responses are complete
      averageTime: Math.round(totalTime / filtered.length / 60), // Convert to minutes
    });
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const exportResponses = async () => {
    try {
      const response = await fetch("/api/responses/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId: selectedQuiz }),
      });
      
      if (!response.ok) throw new Error("Failed to export responses");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `responses_${new Date().toISOString()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Success!",
        description: "Responses exported successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export responses",
        variant: "destructive",
      });
    }
  };

  const handleViewResponse = (responseId: string) => {
    setSelectedResponseId(responseId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedResponseId(null);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">Loading responses...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ChartBar className="h-8 w-8" />
          Student Responses
        </h1>
        <p className="text-muted-foreground mt-2">
          Track and analyze student quiz submissions
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Responses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalResponses}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Average Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageScore}%</div>
            <Progress value={stats.averageScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completionRate}%</div>
            <Progress value={stats.completionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Avg. Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageTime} min</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Response Details</CardTitle>
              <CardDescription>View individual student submissions</CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={selectedQuiz} onValueChange={setSelectedQuiz}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by quiz" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Quizzes</SelectItem>
                  {quizzes.map((quiz) => (
                    <SelectItem key={quiz.id} value={quiz.title}>
                      {quiz.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={exportResponses} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Quiz</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Time Spent</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredResponses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No responses yet
                  </TableCell>
                </TableRow>
              ) : (
                filteredResponses.map((response) => (
                  <TableRow key={response.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{response.studentName}</div>
                        <div className="text-sm text-muted-foreground">
                          {response.studentEmail}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{response.quizTitle}</TableCell>
                    <TableCell>
                      <span className={`font-semibold ${getScoreColor(response.score, response.totalScore)}`}>
                        {response.score}/{response.totalScore}
                      </span>
                      <Badge variant="secondary" className="ml-2">
                        {Math.round((response.score / response.totalScore) * 100)}%
                      </Badge>
                    </TableCell>
                    <TableCell>{formatTime(response.timeSpent)}</TableCell>
                    <TableCell>
                      {new Date(response.submittedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleViewResponse(response.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Response Detail Modal */}
      <ResponseDetailModal
        responseId={selectedResponseId}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}