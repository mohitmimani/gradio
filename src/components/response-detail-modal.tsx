"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Shield,
  Eye,
  Monitor,
  Copy,
  MousePointer,
  Keyboard,
  Loader2,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  points: number;
  explanation?: string;
  userAnswer: number;
  isCorrect: boolean;
  userAnswerText: string;
  correctAnswerText: string;
}

interface CheatingData {
  tabSwitches: number;
  timeAwayFromTab: number;
  copyAttempts: number;
  pasteAttempts: number;
  rightClickAttempts: number;
  keyboardShortcuts: string[];
  fullscreenExits: number;
  pageVisibilityChanges: number;
  suspiciousActivity: string[];
  focusLossEvents: Array<{ timestamp: string; duration: number }>;
}

interface ResponseDetails {
  id: string;
  studentName: string;
  studentEmail: string;
  quizTitle: string;
  score: number;
  totalScore: number;
  submittedAt: string;
  timeSpent: number;
  startedAt: string;
  cheatingData?: CheatingData;
}

interface ResponseDetailModalProps {
  responseId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ResponseDetailModal({ responseId, isOpen, onClose }: ResponseDetailModalProps) {
  const [response, setResponse] = useState<ResponseDetails | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (responseId && isOpen) {
      fetchResponseDetails();
    }
  }, [responseId, isOpen]);

  const fetchResponseDetails = async () => {
    if (!responseId) return;
    
    setIsLoading(true);
    try {
      const res = await fetch(`/api/responses/${responseId}`);
      if (!res.ok) throw new Error("Failed to fetch response details");
      
      const data = await res.json();
      setResponse(data.response);
      setQuestions(data.questions);
    } catch (error) {
      console.error("Error fetching response details:", error);
    } finally {
      setIsLoading(false);
    }
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

  const getCheatingRiskLevel = (cheatingData: CheatingData) => {
    let risk = 0;
    risk += Math.min(cheatingData.tabSwitches * 10, 50);
    risk += Math.min(Math.floor(cheatingData.timeAwayFromTab / 60) * 5, 30);
    risk += Math.min((cheatingData.copyAttempts + cheatingData.pasteAttempts) * 15, 45);
    risk += Math.min(cheatingData.rightClickAttempts * 5, 20);
    risk += Math.min(cheatingData.keyboardShortcuts.length * 10, 40);
    risk += Math.min(cheatingData.fullscreenExits * 20, 60);
    
    const percentage = Math.min(risk, 100);
    
    if (percentage >= 70) return { level: 'High Risk', color: 'text-red-600', bg: 'bg-red-50 border-red-200' };
    if (percentage >= 40) return { level: 'Medium Risk', color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' };
    if (percentage >= 15) return { level: 'Low Risk', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' };
    return { level: 'Minimal Risk', color: 'text-green-600', bg: 'bg-green-50 border-green-200' };
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Response Details</DialogTitle>
          <DialogDescription>
            Detailed view of student submission and performance
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : response ? (
          <div className="space-y-6">
            {/* Student Info & Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Student Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="font-semibold">{response.studentName}</p>
                    <p className="text-sm text-muted-foreground">{response.studentEmail}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Quiz: {response.quizTitle}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4" />
                    <span>Time spent: {formatTime(response.timeSpent)}</span>
                  </div>
                  <div className="text-sm">
                    <span>Submitted: {new Date(response.submittedAt).toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Score Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-4">
                    <div className={`text-4xl font-bold ${getScoreColor(response.score, response.totalScore)}`}>
                      {Math.round((response.score / response.totalScore) * 100)}%
                    </div>
                    <p className="text-lg">
                      {response.score} / {response.totalScore} points
                    </p>
                  </div>
                  <Progress 
                    value={(response.score / response.totalScore) * 100} 
                    className="mb-2"
                  />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-semibold text-green-600">
                        {questions.filter(q => q.isCorrect).length}
                      </div>
                      <div className="text-muted-foreground">Correct</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-red-600">
                        {questions.filter(q => !q.isCorrect && q.userAnswer >= 0).length}
                      </div>
                      <div className="text-muted-foreground">Incorrect</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Anti-Cheat Analysis */}
            {response.cheatingData && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Anti-Cheat Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getCheatingRiskLevel(response.cheatingData).bg} ${getCheatingRiskLevel(response.cheatingData).color}`}>
                        <AlertTriangle className="h-4 w-4" />
                        {getCheatingRiskLevel(response.cheatingData).level}
                      </div>
                      
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Monitor className="h-4 w-4 text-orange-500" />
                          <span>{response.cheatingData.tabSwitches} tab switches</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Eye className="h-4 w-4 text-blue-500" />
                          <span>{Math.floor(response.cheatingData.timeAwayFromTab / 60)}m {response.cheatingData.timeAwayFromTab % 60}s away</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Copy className="h-4 w-4 text-purple-500" />
                          <span>{response.cheatingData.copyAttempts + response.cheatingData.pasteAttempts} copy/paste attempts</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <MousePointer className="h-4 w-4 text-red-500" />
                          <span>{response.cheatingData.rightClickAttempts} right-click attempts</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Keyboard className="h-4 w-4 text-gray-500" />
                          <span>{response.cheatingData.keyboardShortcuts.length} suspicious shortcuts</span>
                        </div>
                      </div>
                    </div>
                    
                    {response.cheatingData.suspiciousActivity.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Suspicious Activities</h4>
                        <div className="space-y-1">
                          {response.cheatingData.suspiciousActivity.slice(0, 5).map((activity, index) => (
                            <div key={index} className="text-sm text-orange-600 bg-orange-50 px-2 py-1 rounded">
                              {activity}
                            </div>
                          ))}
                          {response.cheatingData.suspiciousActivity.length > 5 && (
                            <div className="text-sm text-muted-foreground">
                              +{response.cheatingData.suspiciousActivity.length - 5} more activities
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Question Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Question Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {questions.map((question, index) => (
                  <div key={question.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium">Q{index + 1}: {question.question}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          {question.isCorrect ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span className={`text-sm font-medium ${question.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                            {question.isCorrect ? 'Correct' : question.userAnswer >= 0 ? 'Incorrect' : 'Not Answered'}
                          </span>
                          <Badge variant="outline">
                            {question.points} {question.points === 1 ? 'point' : 'points'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Student answer: </span>
                        <span className={question.isCorrect ? 'text-green-600' : 'text-red-600'}>
                          {question.userAnswerText}
                        </span>
                      </div>
                      
                      {!question.isCorrect && question.userAnswer >= 0 && (
                        <div>
                          <span className="font-medium">Correct answer: </span>
                          <span className="text-green-600">
                            {question.correctAnswerText}
                          </span>
                        </div>
                      )}
                      
                      {question.explanation && (
                        <div className="mt-2 p-2 bg-muted rounded text-sm">
                          <span className="font-medium">Explanation: </span>
                          {question.explanation}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-8">
            <p>Failed to load response details</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}