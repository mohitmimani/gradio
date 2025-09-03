"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Brain, 
  Loader2, 
  Plus, 
  Trash2, 
  Save, 
  Sparkles,
  CheckCircle,
  Circle,
  AlertCircle,
  Edit3,
  Eye,
  EyeOff
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export default function CreateMCQPage() {
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [numberOfQuestions, setNumberOfQuestions] = useState(5);
  const [additionalContext, setAdditionalContext] = useState("");
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [quizTitle, setQuizTitle] = useState("");
  const [quizDescription, setQuizDescription] = useState("");
  const [selectedQuestion, setSelectedQuestion] = useState<number | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<number | null>(null);
  const [editMode, setEditMode] = useState<number | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const generateMCQs = async () => {
    if (!topic.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a topic for MCQ generation",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/mcq/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          difficulty,
          numberOfQuestions,
          additionalContext,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to generate MCQs");
      }

      const data = await response.json();
      setGeneratedQuestions(data.questions);
      setQuizTitle(data.suggestedTitle || `MCQ Quiz: ${topic}`);
      setQuizDescription(data.suggestedDescription || `A ${difficulty} quiz about ${topic}`);
      setSelectedQuestion(0);
      
      toast({
        title: "Success!",
        description: `Generated ${data.questions.length} MCQs successfully`,
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate MCQs. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const saveQuiz = async () => {
    if (!quizTitle.trim() || generatedQuestions.length === 0) {
      toast({
        title: "Incomplete Quiz",
        description: "Please generate questions and add a title before saving",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/mcq/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: quizTitle,
          description: quizDescription,
          subject: topic,
          difficulty,
          questions: generatedQuestions,
          aiGenerated: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save quiz");
      }

      const data = await response.json();
      toast({
        title: "Quiz Saved!",
        description: "Your quiz has been saved to the library",
      });
      
      router.push(`/dashboard/mcq-generator/library`);
    } catch (error) {
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save quiz. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updated = [...generatedQuestions];
    updated[index] = { ...updated[index], [field]: value };
    setGeneratedQuestions(updated);
  };

  const removeQuestion = (index: number) => {
    setGeneratedQuestions(generatedQuestions.filter((_, i) => i !== index));
    if (selectedQuestion === index) {
      setSelectedQuestion(index > 0 ? index - 1 : 0);
    } else if (selectedQuestion && selectedQuestion > index) {
      setSelectedQuestion(selectedQuestion - 1);
    }
    setShowDeleteDialog(false);
    setQuestionToDelete(null);
    toast({
      description: "Question removed",
    });
  };

  const addNewQuestion = () => {
    const newQuestion: Question = {
      question: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
      explanation: "",
    };
    setGeneratedQuestions([...generatedQuestions, newQuestion]);
    setSelectedQuestion(generatedQuestions.length);
    setEditMode(generatedQuestions.length);
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "easy": return "bg-green-500/10 text-green-600 border-green-200";
      case "medium": return "bg-yellow-500/10 text-yellow-600 border-yellow-200";
      case "hard": return "bg-red-500/10 text-red-600 border-red-200";
      default: return "";
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            AI MCQ Generator
          </h1>
          <p className="text-muted-foreground mt-2">
            Create engaging multiple choice questions with AI assistance
          </p>
        </div>
        <div className="flex gap-2">
          {generatedQuestions.length > 0 && (
            <>
              <Button
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? (
                  <>
                    <Edit3 className="mr-2 h-4 w-4" />
                    Edit Mode
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </>
                )}
              </Button>
              <Button 
                onClick={saveQuiz} 
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Quiz
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Generation Panel */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>Generation Settings</CardTitle>
            <CardDescription>Configure your quiz parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="topic">Topic *</Label>
              <Input
                id="topic"
                placeholder="e.g., World History, Python, Biology"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="transition-all focus:scale-[1.02]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty Level</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger id="difficulty">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">
                    <div className="flex items-center gap-2">
                      <Circle className="h-3 w-3 fill-green-500 text-green-500" />
                      Easy
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex items-center gap-2">
                      <Circle className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                      Medium
                    </div>
                  </SelectItem>
                  <SelectItem value="hard">
                    <div className="flex items-center gap-2">
                      <Circle className="h-3 w-3 fill-red-500 text-red-500" />
                      Hard
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="numQuestions">Number of Questions</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="numQuestions"
                  type="number"
                  min="1"
                  max="20"
                  value={numberOfQuestions}
                  onChange={(e) => setNumberOfQuestions(parseInt(e.target.value) || 5)}
                  className="transition-all focus:scale-[1.02]"
                />
                <Badge variant="secondary">{numberOfQuestions} questions</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="context">Additional Context</Label>
              <Textarea
                id="context"
                placeholder="Specific topics, focus areas, or requirements..."
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
                rows={4}
                className="resize-none transition-all focus:scale-[1.02]"
              />
            </div>

            <Button 
              onClick={generateMCQs} 
              className="w-full"
              size="lg"
              disabled={isGenerating || !topic.trim()}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Brain className="mr-2 h-4 w-4" />
                  Generate Questions
                </>
              )}
            </Button>

            {generatedQuestions.length > 0 && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Quiz Title</span>
                      <Badge className={getDifficultyColor(difficulty)}>
                        {difficulty}
                      </Badge>
                    </div>
                    <Input
                      value={quizTitle}
                      onChange={(e) => setQuizTitle(e.target.value)}
                      placeholder="Enter quiz title"
                      className="font-semibold"
                    />
                    <Textarea
                      value={quizDescription}
                      onChange={(e) => setQuizDescription(e.target.value)}
                      placeholder="Enter quiz description"
                      rows={2}
                      className="resize-none text-sm"
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Questions Panel */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {generatedQuestions.length > 0 
                    ? `Questions (${generatedQuestions.length})`
                    : "Questions"
                  }
                </CardTitle>
                <CardDescription>
                  {generatedQuestions.length > 0 
                    ? "Review and edit your generated questions"
                    : "Generate questions to get started"
                  }
                </CardDescription>
              </div>
              {generatedQuestions.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addNewQuestion}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Question
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {generatedQuestions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <Brain className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-2">No questions yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Configure your settings and click "Generate Questions" to create your quiz
                </p>
              </div>
            ) : (
              <Tabs value={selectedQuestion?.toString()} onValueChange={(v) => setSelectedQuestion(parseInt(v))}>
                <TabsList className="grid grid-cols-5 lg:grid-cols-10 mb-6">
                  {generatedQuestions.map((_, index) => (
                    <TabsTrigger
                      key={index}
                      value={index.toString()}
                      className="relative"
                    >
                      {index + 1}
                      {editMode === index && (
                        <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary animate-pulse" />
                      )}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <AnimatePresence mode="wait">
                  {generatedQuestions.map((q, index) => (
                    <TabsContent
                      key={index}
                      value={index.toString()}
                      className="mt-0 space-y-4"
                    >
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        {showPreview ? (
                          /* Preview Mode */
                          <Card className="border-2">
                            <CardHeader>
                              <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                  <Badge variant="outline">Question {index + 1}</Badge>
                                  <h3 className="text-lg font-semibold">{q.question}</h3>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="space-y-2">
                                {q.options.map((option, optIndex) => (
                                  <div
                                    key={optIndex}
                                    className={`p-3 rounded-lg border-2 transition-all ${
                                      q.correctAnswer === optIndex
                                        ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                                        : "border-muted hover:border-muted-foreground/20"
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      {q.correctAnswer === optIndex ? (
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                      ) : (
                                        <Circle className="h-5 w-5 text-muted-foreground" />
                                      )}
                                      <span className={q.correctAnswer === optIndex ? "font-medium" : ""}>
                                        {option}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              {q.explanation && (
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
                            </CardContent>
                          </Card>
                        ) : (
                          /* Edit Mode */
                          <div className="space-y-4">
                            <div className="flex items-center justify-between mb-4">
                              <Badge variant="outline">Question {index + 1}</Badge>
                              <div className="flex gap-2">
                                <Button
                                  variant={editMode === index ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setEditMode(editMode === index ? null : index)}
                                >
                                  {editMode === index ? (
                                    <>
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      Done Editing
                                    </>
                                  ) : (
                                    <>
                                      <Edit3 className="mr-2 h-4 w-4" />
                                      Edit
                                    </>
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setQuestionToDelete(index);
                                    setShowDeleteDialog(true);
                                  }}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label>Question Text</Label>
                              <Textarea
                                value={q.question}
                                onChange={(e) => updateQuestion(index, "question", e.target.value)}
                                disabled={editMode !== index}
                                rows={2}
                                className="resize-none"
                              />
                            </div>
                            
                            <div className="space-y-3">
                              <Label>Answer Options</Label>
                              {q.options.map((option, optIndex) => (
                                <div key={optIndex} className="flex gap-2 items-center">
                                  <div className="flex-1">
                                    <Input
                                      value={option}
                                      onChange={(e) => {
                                        const newOptions = [...q.options];
                                        newOptions[optIndex] = e.target.value;
                                        updateQuestion(index, "options", newOptions);
                                      }}
                                      disabled={editMode !== index}
                                      placeholder={`Option ${optIndex + 1}`}
                                      className={`transition-all ${
                                        q.correctAnswer === optIndex 
                                          ? "border-green-500 bg-green-50/50 dark:bg-green-950/20" 
                                          : ""
                                      }`}
                                    />
                                  </div>
                                  <Button
                                    variant={q.correctAnswer === optIndex ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => updateQuestion(index, "correctAnswer", optIndex)}
                                    disabled={editMode !== index}
                                    className="shrink-0"
                                  >
                                    {q.correctAnswer === optIndex ? (
                                      <CheckCircle className="h-4 w-4" />
                                    ) : (
                                      <Circle className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              ))}
                              <p className="text-xs text-muted-foreground">
                                Click the circle to mark the correct answer
                              </p>
                            </div>

                            <div className="space-y-2">
                              <Label>Explanation</Label>
                              <Textarea
                                value={q.explanation}
                                onChange={(e) => updateQuestion(index, "explanation", e.target.value)}
                                disabled={editMode !== index}
                                placeholder="Explain why this is the correct answer..."
                                rows={3}
                                className="resize-none"
                              />
                            </div>
                          </div>
                        )}
                      </motion.div>
                    </TabsContent>
                  ))}
                </AnimatePresence>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete question {(questionToDelete ?? 0) + 1}? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => questionToDelete !== null && removeQuestion(questionToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}