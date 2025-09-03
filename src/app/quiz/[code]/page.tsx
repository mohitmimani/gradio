"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  TooltipProvider,
} from "@/components/ui/tooltip";
import { 
  Brain, 
  Clock, 
  CheckCircle, 
  Circle,
  AlertCircle,
  Trophy,
  Target,
  ChevronLeft,
  ChevronRight,
  Send,
  Loader2,
  FileText,
  Hash,
  Play,
  RotateCcw,
  Shield,
  AlertTriangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useAntiCheat } from "@/hooks/use-anti-cheat";

interface Question {
  id: string;
  question: string;
  options: string[];
  points: number;
  orderIndex: number;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  subject: string;
  difficulty: string;
  questionCount: number;
}

interface QuizResults {
  score: number;
  totalScore: number;
  percentage: number;
  correct: number;
  incorrect: number;
  feedback: Array<{
    questionId: string;
    correct: boolean;
    correctAnswer: number;
    userAnswer: number;
    explanation: string;
  }>;
}

export default function PublicQuizPage() {
  const params = useParams();
  const { toast } = useToast();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizResults, setQuizResults] = useState<QuizResults | null>(null);
  const [showExitDialog, setShowExitDialog] = useState(false);
  
  // Anti-cheat monitoring
  const { 
    metrics: cheatingMetrics, 
    warnings, 
    cheatingRiskPercentage, 
    riskLevel,
    clearWarnings 
  } = useAntiCheat();

  useEffect(() => {
    fetchQuizData();
  }, [params.code]);

  const fetchQuizData = async () => {
    try {
      const response = await fetch(`/api/mcq/share/${params.code}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Quiz not found");
        } else if (response.status === 403) {
          throw new Error("This quiz is not available");
        }
        throw new Error("Failed to fetch quiz");
      }
      
      const data = await response.json();
      setQuiz(data.quiz);
      setQuestions(data.questions);
    } catch (error) {
      console.error("Error fetching quiz:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load quiz",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startQuiz = () => {
    if (!studentName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your name to start the quiz",
        variant: "destructive",
      });
      return;
    }
    
    setQuizStarted(true);
    setStartTime(new Date());
  };

  const selectAnswer = (questionId: string, answerIndex: number) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };

  const submitQuiz = async () => {
    if (Object.keys(userAnswers).length < questions.length) {
      toast({
        title: "Incomplete Quiz",
        description: "Please answer all questions before submitting",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const endTime = new Date();
      const timeSpent = startTime ? Math.floor((endTime.getTime() - startTime.getTime()) / 1000) : 0;
      
      const response = await fetch("/api/mcq/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId: quiz?.id,
          studentName,
          studentEmail,
          responses: userAnswers,
          timeSpent,
          cheatingMetrics,
        }),
      });

      if (!response.ok) throw new Error("Failed to submit quiz");

      const results = await response.json();
      setQuizResults(results);
      
      toast({
        title: "Quiz Submitted!",
        description: "Your responses have been recorded",
      });
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "Failed to submit quiz. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetQuiz = () => {
    setQuizStarted(false);
    setCurrentQuestion(0);
    setUserAnswers({});
    setStartTime(null);
    setQuizResults(null);
    setStudentName("");
    setStudentEmail("");
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "bg-green-500/10 text-green-600 border-green-200";
      case "medium": return "bg-yellow-500/10 text-yellow-600 border-yellow-200";
      case "hard": return "bg-red-500/10 text-red-600 border-red-200";
      default: return "";
    }
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  if (isLoading) {
    return (
      <TooltipProvider>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
          <div className="text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Loading quiz...</p>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  if (!quiz || !questions.length) {
    return (
      <TooltipProvider>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 p-4">
          <Card className="max-w-md w-full">
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Quiz Not Available</h3>
              <p className="text-muted-foreground">
                This quiz doesn't exist or is not available for taking.
              </p>
            </CardContent>
          </Card>
        </div>
      </TooltipProvider>
    );
  }

  // Quiz Results View
  if (quizResults) {
    return (
      <TooltipProvider>
        <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 p-4">
          <div className="max-w-3xl mx-auto space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card>
              <CardHeader className="text-center">
                <Trophy className="h-16 w-16 mx-auto text-primary mb-4" />
                <CardTitle className="text-3xl">Quiz Completed!</CardTitle>
                <CardDescription>Here are your results</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className={`text-6xl font-bold mb-2 ${getScoreColor(quizResults.percentage)}`}>
                    {quizResults.percentage}%
                  </div>
                  <p className="text-xl text-muted-foreground">
                    {quizResults.score} / {quizResults.totalScore} points
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold">{quizResults.correct}</p>
                      <p className="text-sm text-muted-foreground">Correct</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold">{quizResults.incorrect}</p>
                      <p className="text-sm text-muted-foreground">Incorrect</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Review Answers</h3>
                  {quizResults.feedback.map((item, index) => {
                    const question = questions.find(q => q.id === item.questionId);
                    if (!question) return null;
                    
                    return (
                      <Card key={item.questionId} className={item.correct ? "border-green-200" : "border-red-200"}>
                        <CardContent className="pt-4">
                          <div className="flex items-start gap-3">
                            {item.correct ? (
                              <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1 space-y-2">
                              <p className="font-medium">Q{index + 1}: {question.question}</p>
                              <p className="text-sm">
                                Your answer: <span className={item.correct ? "text-green-600" : "text-red-600"}>
                                  {question.options[item.userAnswer]}
                                </span>
                              </p>
                              {!item.correct && (
                                <p className="text-sm">
                                  Correct answer: <span className="text-green-600">
                                    {question.options[item.correctAnswer]}
                                  </span>
                                </p>
                              )}
                              {item.explanation && (
                                <p className="text-sm text-muted-foreground italic">
                                  {item.explanation}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                <Button onClick={resetQuiz} className="w-full" size="lg">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Take Quiz Again
                </Button>
              </CardContent>
            </Card>
          </motion.div>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  // Quiz Taking View
  if (quizStarted) {
    const currentQ = questions[currentQuestion];
    const progress = ((currentQuestion + 1) / questions.length) * 100;
    const answeredCount = Object.keys(userAnswers).length;

    const getRiskColor = (risk: string) => {
      switch (risk) {
        case 'high': return 'text-red-600';
        case 'medium': return 'text-yellow-600';
        case 'low': return 'text-orange-600';
        default: return 'text-green-600';
      }
    };

    return (
      <TooltipProvider>
        <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 p-4">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Progress Header */}
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" />
                    <span className="font-semibold">{quiz.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getRiskColor(riskLevel)} bg-background border`} title={`Monitoring Status: ${cheatingRiskPercentage}% risk, ${cheatingMetrics.tabSwitches} tab switches`}>
                      <Shield className="h-3 w-3" />
                      <span className="font-medium">
                        {riskLevel === 'minimal' ? 'Secure' : riskLevel}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowExitDialog(true)}
                    >
                      Exit Quiz
                    </Button>
                  </div>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                  <span>Question {currentQuestion + 1} of {questions.length}</span>
                  <span>{answeredCount} answered</span>
                </div>
              </CardContent>
            </Card>

            {/* Question Card */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-xl">{currentQ.question}</CardTitle>
                      <Badge variant="outline">
                        {currentQ.points} {currentQ.points === 1 ? "point" : "points"}
                      </Badge>
                    </div>
                  </CardHeader>
                <CardContent className="space-y-3">
                  {currentQ.options.map((option, index) => {
                    const isSelected = userAnswers[currentQ.id] === index;
                    
                    return (
                      <div
                        key={index}
                        onClick={() => selectAnswer(currentQ.id, index)}
                        className={`
                          p-4 rounded-lg border-2 cursor-pointer transition-all
                          hover:border-primary/50
                          ${isSelected ? "border-primary bg-primary/5" : "border-muted"}
                        `}
                      >
                        <div className="flex items-center gap-3">
                          {isSelected ? (
                            <CheckCircle className="h-5 w-5 text-primary" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground" />
                          )}
                          <span>{option}</span>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
                <CardContent className="pt-0">
                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                      disabled={currentQuestion === 0}
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Previous
                    </Button>
                    
                    {currentQuestion === questions.length - 1 ? (
                      <Button
                        onClick={submitQuiz}
                        disabled={isSubmitting || answeredCount < questions.length}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Submit Quiz
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => setCurrentQuestion(prev => Math.min(questions.length - 1, prev + 1))}
                      >
                        Next
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
              </motion.div>
            </AnimatePresence>

            {/* Question Navigator */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Question Navigator</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                  {questions.map((_, index) => {
                    const isAnswered = userAnswers[questions[index].id] !== undefined;
                    const isCurrent = currentQuestion === index;
                    
                    return (
                      <Button
                        key={index}
                        variant={isCurrent ? "default" : isAnswered ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => setCurrentQuestion(index)}
                        className="h-10 w-full"
                      >
                        {index + 1}
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Anti-cheat Warnings */}
            <AnimatePresence>
              {warnings.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="fixed top-4 right-4 z-50"
                >
                  <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 max-w-sm">
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-orange-900 dark:text-orange-100 mb-1">
                            Activity Detected
                          </p>
                          <p className="text-xs text-orange-800 dark:text-orange-200">
                            {warnings[warnings.length - 1]}
                          </p>
                          {warnings.length > 1 && (
                            <p className="text-xs text-orange-600 mt-1">
                              +{warnings.length - 1} more warnings
                            </p>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 mt-2 text-xs"
                            onClick={clearWarnings}
                          >
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Exit Confirmation Dialog */}
          <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Exit Quiz?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to exit? Your progress will be lost.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Continue Quiz</AlertDialogCancel>
                <AlertDialogAction onClick={resetQuiz}>
                  Exit Quiz
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TooltipProvider>
    );
  }

  // Quiz Start View
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
        <Card className="max-w-2xl w-full">
          <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4">
              <Brain className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-3xl">{quiz.title}</CardTitle>
            <CardDescription className="text-lg mt-2">
              {quiz.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Quiz Info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center">
                <FileText className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="font-semibold">{quiz.subject}</p>
                <p className="text-xs text-muted-foreground">Subject</p>
              </div>
              <div className="text-center">
                <Target className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <Badge className={`${getDifficultyColor(quiz.difficulty)} mx-auto`}>
                  {quiz.difficulty}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">Difficulty</p>
              </div>
              <div className="text-center">
                <Hash className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="font-semibold">{quiz.questionCount}</p>
                <p className="text-xs text-muted-foreground">Questions</p>
              </div>
              <div className="text-center">
                <Clock className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="font-semibold">Untimed</p>
                <p className="text-xs text-muted-foreground">Duration</p>
              </div>
            </div>

            {/* Student Info Form */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Your Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter your full name"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Instructions */}
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Instructions
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Answer all questions to complete the quiz</li>
                  <li>• You can navigate between questions</li>
                  <li>• Review your answers before submitting</li>
                  <li>• Your score will be shown after submission</li>
                </ul>
              </CardContent>
            </Card>

            <Button
              onClick={startQuiz}
              size="lg"
              className="w-full"
              disabled={!studentName.trim()}
            >
              <Play className="mr-2 h-4 w-4" />
              Start Quiz
            </Button>
          </CardContent>
        </Card>
      </motion.div>
      </div>
    </TooltipProvider>
  );
}