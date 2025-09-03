"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Brain, 
  ArrowLeft, 
  Edit, 
  CheckCircle, 
  Circle,
  AlertCircle,
  FileText,
  Hash,
  Loader2,
  Eye,
  EyeOff,
  Download,
  Play
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { motion } from "framer-motion";
import PublishQuizCard from "@/components/publish-quiz-card";

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  points: number;
  orderIndex: number;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  subject: string;
  difficulty: string;
  shareCode: string;
  isPublished: boolean;
  aiGenerated: boolean;
  createdAt: string;
}

export default function QuizPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("0");
  const [showAnswers, setShowAnswers] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchQuizData();
  }, [params.id]);

  const fetchQuizData = async () => {
    try {
      const response = await fetch(`/api/mcq/${params.id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch quiz");
      }
      
      const data = await response.json();
      setQuiz(data.quiz);
      setQuestions(data.questions.sort((a: Question, b: Question) => a.orderIndex - b.orderIndex));
    } catch (error) {
      console.error("Error fetching quiz:", error);
      toast({
        title: "Error",
        description: "Failed to load quiz",
        variant: "destructive",
      });
      router.push("/dashboard/mcq-generator/library");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublishStatusChange = (newStatus: boolean) => {
    setQuiz(prev => prev ? { ...prev, isPublished: newStatus } : null);
  };

  const exportQuiz = () => {
    const exportData = {
      quiz,
      questions,
      exportedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${quiz?.title.replace(/\s+/g, "_")}_export.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Quiz Exported",
      description: "Quiz has been downloaded as JSON",
    });
  };

  const calculateScore = () => {
    let correct = 0;
    let total = questions.length;
    
    questions.forEach((q) => {
      if (userAnswers[q.id] === q.correctAnswer) {
        correct++;
      }
    });
    
    return {
      correct,
      total,
      percentage: Math.round((correct / total) * 100),
    };
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "bg-green-500/10 text-green-600 border-green-200";
      case "medium": return "bg-yellow-500/10 text-yellow-600 border-yellow-200";
      case "hard": return "bg-red-500/10 text-red-600 border-red-200";
      default: return "";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (!quiz || !questions.length) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Quiz not found</h3>
            <p className="text-muted-foreground mb-4">
              This quiz doesn't exist or you don't have access to it.
            </p>
            <Button asChild>
              <Link href="/dashboard/mcq-generator/library">
                Back to Library
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard/mcq-generator/library")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              {quiz.title}
              {quiz.aiGenerated && (
                <Badge variant="secondary" className="gap-1">
                  <Brain className="h-3 w-3" />
                  AI Generated
                </Badge>
              )}
            </h1>
            <p className="text-muted-foreground mt-1">{quiz.description}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowAnswers(!showAnswers)}
          >
            {showAnswers ? (
              <>
                <EyeOff className="mr-2 h-4 w-4" />
                Hide Answers
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                Show Answers
              </>
            )}
          </Button>
          <Button variant="outline" onClick={exportQuiz}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button asChild>
            <Link href={`/dashboard/mcq-generator/edit/${quiz.id}`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Quiz
            </Link>
          </Button>
        </div>
      </div>

      {/* Quiz Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Subject</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">{quiz.subject}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Difficulty</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={getDifficultyColor(quiz.difficulty)}>
              {quiz.difficulty}
            </Badge>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">{questions.length}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">
                {questions.reduce((sum, q) => sum + q.points, 0)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Publish Status Card */}
      <PublishQuizCard 
        quiz={quiz} 
        onStatusChange={handlePublishStatusChange} 
      />

      {/* Test Mode Toggle */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Play className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Test Mode</p>
                <p className="text-sm text-muted-foreground">
                  Try the quiz as a student would
                </p>
              </div>
            </div>
            <Button
              variant={testMode ? "destructive" : "default"}
              onClick={() => {
                setTestMode(!testMode);
                setUserAnswers({});
              }}
            >
              {testMode ? "Exit Test Mode" : "Start Test Mode"}
            </Button>
          </div>
          
          {testMode && Object.keys(userAnswers).length === questions.length && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Test Results</p>
                  <p className="text-2xl font-bold">
                    {calculateScore().correct} / {calculateScore().total}
                  </p>
                </div>
                <Badge className="text-lg px-3 py-1">
                  {calculateScore().percentage}%
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Questions */}
      <Card>
        <CardHeader>
          <CardTitle>Questions</CardTitle>
          <CardDescription>
            {testMode ? "Answer all questions to see your score" : "Review all quiz questions"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid grid-cols-5 lg:grid-cols-10 mb-6">
              {questions.map((_, index) => (
                <TabsTrigger
                  key={index}
                  value={index.toString()}
                  className="relative"
                >
                  {index + 1}
                  {testMode && userAnswers[questions[index].id] !== undefined && (
                    <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary" />
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            {questions.map((q, index) => (
              <TabsContent key={index} value={index.toString()} className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <h3 className="text-lg font-semibold">{q.question}</h3>
                      <Badge variant="outline">
                        {q.points} {q.points === 1 ? "point" : "points"}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      {q.options.map((option, optIndex) => {
                        const isCorrect = q.correctAnswer === optIndex;
                        const isSelected = testMode && userAnswers[q.id] === optIndex;
                        
                        return (
                          <div
                            key={optIndex}
                            onClick={() => {
                              if (testMode) {
                                setUserAnswers(prev => ({
                                  ...prev,
                                  [q.id]: optIndex
                                }));
                              }
                            }}
                            className={`
                              p-4 rounded-lg border-2 transition-all
                              ${testMode ? "cursor-pointer hover:border-primary/50" : ""}
                              ${isSelected ? "border-primary bg-primary/5" : "border-muted"}
                              ${showAnswers && isCorrect ? "border-green-500 bg-green-50 dark:bg-green-950/20" : ""}
                              ${showAnswers && isSelected && !isCorrect ? "border-red-500 bg-red-50 dark:bg-red-950/20" : ""}
                            `}
                          >
                            <div className="flex items-center gap-3">
                              {testMode ? (
                                isSelected ? (
                                  <CheckCircle className="h-5 w-5 text-primary" />
                                ) : (
                                  <Circle className="h-5 w-5 text-muted-foreground" />
                                )
                              ) : showAnswers ? (
                                isCorrect ? (
                                  <CheckCircle className="h-5 w-5 text-green-600" />
                                ) : (
                                  <Circle className="h-5 w-5 text-muted-foreground" />
                                )
                              ) : (
                                <Circle className="h-5 w-5 text-muted-foreground" />
                              )}
                              <span className={isCorrect && showAnswers ? "font-medium" : ""}>
                                {option}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {(showAnswers || (testMode && userAnswers[q.id] !== undefined)) && q.explanation && (
                      <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
                        <div className="flex gap-2">
                          <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                              Explanation
                            </p>
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                              {q.explanation}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between mt-6">
                      <Button
                        variant="outline"
                        onClick={() => setSelectedTab((parseInt(selectedTab) - 1).toString())}
                        disabled={parseInt(selectedTab) === 0}
                      >
                        Previous
                      </Button>
                      <Button
                        onClick={() => setSelectedTab((parseInt(selectedTab) + 1).toString())}
                        disabled={parseInt(selectedTab) === questions.length - 1}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}