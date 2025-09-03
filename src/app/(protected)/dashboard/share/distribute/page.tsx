"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle,
  Copy,
  ExternalLink,
  Globe,
  Link2,
  Loader2,
  Mail,
  MessageSquare,
  QrCode,
  Send,
  Share2,
  Users,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { useRef } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import QuizAnalytics from "@/components/quiz-analytics";

interface Quiz {
  id: string;
  title: string;
  description: string;
  subject: string;
  difficulty: string;
  shareCode: string;
  isPublished: boolean;
  createdAt: string;
  questionCount?: number;
}

export default function DistributeQuizPage() {
  const searchParams = useSearchParams();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<string>("");
  const [shareEmails, setShareEmails] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [shareLink, setShareLink] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchQuizzes();
  }, []);

  useEffect(() => {
    // Check if a quiz was passed via query params
    const quizId = searchParams.get("quiz");
    if (quizId && quizzes.length > 0) {
      const quiz = quizzes.find((q) => q.id === quizId);
      if (quiz) {
        handleQuizSelect(quizId);
      }
    }
  }, [searchParams, quizzes]);

  useEffect(() => {
    if (showQR && qrCanvasRef.current && shareLink) {
      // Clear previous canvas content
      const canvas = qrCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      
      QRCode.toCanvas(qrCanvasRef.current, shareLink, {
        width: 200,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      }).then(() => {
        console.log('QR Code generated successfully for:', shareLink);
      }).catch((error) => {
        console.error("QR Code generation failed:", error);
        toast({
          title: "QR Code Error",
          description: "Failed to generate QR code",
          variant: "destructive",
        });
      });
    }
  }, [showQR, shareLink, toast]);

  const fetchQuizzes = async () => {
    try {
      const response = await fetch("/api/mcq/list");
      if (!response.ok) throw new Error("Failed to fetch quizzes");
      const data = await response.json();
      setQuizzes(data.quizzes || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load quizzes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateShareLink = (shareCode: string) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/quiz/${shareCode}`;
  };

  const handleQuizSelect = (quizId: string) => {
    setSelectedQuiz(quizId);
    const quiz = quizzes.find((q) => q.id === quizId);
    if (quiz) {
      const link = generateShareLink(quiz.shareCode);
      setShareLink(link);

      // Generate default message
      setShareMessage(
        `You're invited to take the quiz: "${quiz.title}"\n\n` +
          `${quiz.description || "Test your knowledge!"}\n\n` +
          `Click here to start: ${link}`,
      );
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Link Copied!",
        description: "Share link has been copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  const shareViaEmail = () => {
    const quiz = quizzes.find((q) => q.id === selectedQuiz);
    if (!quiz) return;

    const subject = encodeURIComponent(`Quiz Invitation: ${quiz.title}`);
    const body = encodeURIComponent(shareMessage);
    window.location.href = `mailto:${shareEmails}?subject=${subject}&body=${body}`;
  };

  const shareViaWhatsApp = () => {
    const text = encodeURIComponent(shareMessage);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const publishQuiz = async () => {
    if (!selectedQuiz) return;

    try {
      const response = await fetch(`/api/mcq/${selectedQuiz}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: true }),
      });

      if (!response.ok) throw new Error("Failed to publish quiz");

      toast({
        title: "Quiz Published!",
        description: "Your quiz is now available for sharing",
      });

      fetchQuizzes();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to publish quiz",
        variant: "destructive",
      });
    }
  };

  const selectedQuizData = quizzes.find((q) => q.id === selectedQuiz);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-500/10 text-green-600 border-green-200";
      case "medium":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-200";
      case "hard":
        return "bg-red-500/10 text-red-600 border-red-200";
      default:
        return "";
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="space-y-3 text-center">
          <Loader2 className="text-primary mx-auto h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Loading quizzes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-3 text-3xl font-bold">
          <div className="bg-primary/10 rounded-lg p-2">
            <Share2 className="text-primary h-6 w-6" />
          </div>
          Share & Distribute
        </h1>
        <p className="text-muted-foreground mt-2">
          Share your quizzes with students via multiple channels
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Quiz Selector */}
        <Card className="h-fit lg:col-span-1">
          <CardHeader>
            <CardTitle>Select Quiz</CardTitle>
            <CardDescription>Choose a quiz to share</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedQuiz} onValueChange={handleQuizSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select a quiz to share" />
              </SelectTrigger>
              <SelectContent>
                {quizzes.length === 0 ? (
                  <div className="text-muted-foreground p-4 text-center">
                    No quizzes available
                  </div>
                ) : (
                  quizzes.map((quiz) => (
                    <SelectItem key={quiz.id} value={quiz.id}>
                      <div className="flex items-center gap-2">
                        <span>{quiz.title}</span>
                        {quiz.isPublished && (
                          <CheckCircle className="h-3 w-3 text-green-600" />
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            {selectedQuizData && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div className="bg-muted/50 space-y-2 rounded-lg p-3">
                  <p className="text-sm font-medium">
                    {selectedQuizData.title}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {selectedQuizData.description || "No description"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs">
                      {selectedQuizData.questionCount || 0} Questions
                    </Badge>
                    <Badge
                      className={`text-xs ${getDifficultyColor(selectedQuizData.difficulty)}`}
                    >
                      {selectedQuizData.difficulty}
                    </Badge>
                    {selectedQuizData.subject && (
                      <Badge variant="outline" className="text-xs">
                        {selectedQuizData.subject}
                      </Badge>
                    )}
                  </div>
                </div>

                {!selectedQuizData.isPublished ? (
                  <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 dark:bg-orange-950/20">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="mt-0.5 h-4 w-4 text-orange-600" />
                      <div className="flex-1 space-y-2">
                        <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                          Quiz Not Published
                        </p>
                        <p className="text-xs text-orange-800 dark:text-orange-200">
                          This quiz needs to be published before it can be
                          shared.
                        </p>
                        <Button
                          size="sm"
                          onClick={publishQuiz}
                          className="w-full"
                        >
                          Publish Now
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:bg-green-950/20">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-900 dark:text-green-100">
                          Ready to Share
                        </p>
                        <code className="font-mono text-xs">
                          Code: {selectedQuizData.shareCode}
                        </code>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Sharing Options */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Sharing Methods</CardTitle>
            <CardDescription>Choose how to share your quiz</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="link" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="link">
                  <Link2 className="mr-2 h-4 w-4" />
                  Direct Link
                </TabsTrigger>
                <TabsTrigger value="email">
                  <Mail className="mr-2 h-4 w-4" />
                  Email
                </TabsTrigger>
                <TabsTrigger value="social">
                  <Globe className="mr-2 h-4 w-4" />
                  Social
                </TabsTrigger>
              </TabsList>

              <TabsContent value="link" className="mt-4 space-y-4">
                <div className="space-y-3">
                  <Label>Share Link</Label>
                  <div className="flex gap-2">
                    <Input
                      value={shareLink}
                      readOnly
                      placeholder="Select a quiz first"
                      className="font-mono text-sm"
                    />
                    <Button
                      onClick={copyToClipboard}
                      disabled={!shareLink}
                      variant={copied ? "default" : "outline"}
                    >
                      {copied ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Popover open={showQR} onOpenChange={setShowQR}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" disabled={!shareLink}>
                          <QrCode className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-4">
                        <div className="space-y-3 text-center">
                          <h4 className="font-medium">QR Code</h4>
                          <div className="flex justify-center">
                            <canvas
                              ref={qrCanvasRef}
                              className="rounded border"
                              style={{ maxWidth: "200px", maxHeight: "200px" }}
                            />
                          </div>
                          <p className="text-muted-foreground text-xs">
                            Scan to access quiz
                          </p>
                        </div>
                      </PopoverContent>
                    </Popover>
                    <Button
                      variant="outline"
                      disabled={!shareLink}
                      onClick={() => window.open(shareLink, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Anyone with this link can take the quiz
                  </p>
                </div>

                {selectedQuizData?.isPublished && (
                  <Card className="bg-muted/50">
                    <CardContent className="pt-6">
                      <h4 className="mb-2 font-medium">Quick Share Options</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            const text = `Check out this quiz: ${shareLink}`;
                            window.open(
                              `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
                              "_blank",
                            );
                          }}
                          disabled={!shareLink}
                        >
                          Share on X
                        </Button>
                        <Button
                          variant="outline"
                          onClick={shareViaWhatsApp}
                          disabled={!shareLink}
                        >
                          <MessageSquare className="mr-2 h-4 w-4" />
                          WhatsApp
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="email" className="mt-4 space-y-4">
                <div className="space-y-3">
                  <Label>Recipients</Label>
                  <Input
                    value={shareEmails}
                    onChange={(e) => setShareEmails(e.target.value)}
                    placeholder="student1@example.com, student2@example.com"
                    disabled={!selectedQuizData?.isPublished}
                  />
                  <p className="text-muted-foreground text-xs">
                    Separate multiple emails with commas
                  </p>
                </div>

                <div className="space-y-3">
                  <Label>Message</Label>
                  <Textarea
                    value={shareMessage}
                    onChange={(e) => setShareMessage(e.target.value)}
                    placeholder="Add a personal message..."
                    rows={6}
                    disabled={!selectedQuizData?.isPublished}
                    className="resize-none"
                  />
                </div>

                <Button
                  onClick={shareViaEmail}
                  disabled={!selectedQuizData?.isPublished || !shareEmails}
                  className="w-full"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Send Email Invitation
                </Button>
              </TabsContent>

              <TabsContent value="social" className="mt-4 space-y-4">
                <div className="space-y-3">
                  <Label>Custom Message</Label>
                  <Textarea
                    value={shareMessage}
                    onChange={(e) => setShareMessage(e.target.value)}
                    placeholder="Customize your sharing message..."
                    rows={4}
                    disabled={!selectedQuizData?.isPublished}
                    className="resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Button
                    variant="outline"
                    onClick={shareViaWhatsApp}
                    disabled={!selectedQuizData?.isPublished}
                    className="w-full"
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Share on WhatsApp
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      window.open(
                        `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`,
                        "_blank",
                      );
                    }}
                    disabled={!selectedQuizData?.isPublished}
                    className="w-full"
                  >
                    Share on X (Twitter)
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      window.open(
                        `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareLink)}`,
                        "_blank",
                      );
                    }}
                    disabled={!selectedQuizData?.isPublished}
                    className="w-full"
                  >
                    Share on LinkedIn
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      window.open(
                        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}`,
                        "_blank",
                      );
                    }}
                    disabled={!selectedQuizData?.isPublished}
                    className="w-full"
                  >
                    Share on Facebook
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>Quiz Analytics</CardTitle>
          <CardDescription>
            Track your quiz performance and engagement
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedQuizData?.isPublished ? (
            <QuizAnalytics quizId={selectedQuizData.id} />
          ) : (
            <div className="text-muted-foreground py-8 text-center">
              <Users className="text-muted-foreground/50 mx-auto mb-4 h-8 w-8" />
              <p className="font-medium">No Analytics Available</p>
              <p className="mt-2 text-sm">
                Select and publish a quiz to view analytics
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
