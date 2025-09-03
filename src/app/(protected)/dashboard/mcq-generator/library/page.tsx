"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter,
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Brain, 
  Copy, 
  Edit, 
  Eye, 
  Trash2, 
  Share2, 
  Plus, 
  Search, 
  Filter,
  MoreVertical,
  FileText,
  Clock,
  Users,
  CheckCircle,
  Circle,
  Sparkles,
  Grid3X3,
  List,
  Download,
  Trophy
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

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
  questionCount: number;
  attemptCount?: number;
  avgScore?: number;
}

export default function MCQLibraryPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [filteredQuizzes, setFilteredQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    fetchQuizzes();
  }, []);

  useEffect(() => {
    filterQuizzes();
  }, [quizzes, searchQuery, filterDifficulty, filterStatus]);

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

  const filterQuizzes = () => {
    let filtered = [...quizzes];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (quiz) =>
          quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          quiz.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          quiz.subject?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Difficulty filter
    if (filterDifficulty !== "all") {
      filtered = filtered.filter((quiz) => quiz.difficulty === filterDifficulty);
    }

    // Status filter
    if (filterStatus !== "all") {
      if (filterStatus === "published") {
        filtered = filtered.filter((quiz) => quiz.isPublished);
      } else if (filterStatus === "draft") {
        filtered = filtered.filter((quiz) => !quiz.isPublished);
      }
    }

    setFilteredQuizzes(filtered);
  };

  const copyShareLink = async (code: string) => {
    const shareUrl = `${window.location.origin}/quiz/${code}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link Copied!",
        description: "Share link copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy share link",
        variant: "destructive",
      });
    }
  };

  const deleteQuiz = async (quizId: string) => {
    try {
      const response = await fetch(`/api/mcq/${quizId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete quiz");

      toast({
        title: "Quiz Deleted",
        description: "Quiz has been successfully deleted",
      });
      
      fetchQuizzes();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete quiz",
        variant: "destructive",
      });
    }
  };

  const exportQuiz = async (quizId: string) => {
    toast({
      title: "Exporting...",
      description: "Preparing your quiz for download",
    });
  };

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

  const getStatusIcon = (isPublished: boolean) => {
    return isPublished ? (
      <CheckCircle className="h-3 w-3 text-green-600" />
    ) : (
      <Circle className="h-3 w-3 text-muted-foreground" />
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
              <Brain className="h-6 w-6 text-primary animate-pulse" />
            </div>
            <p className="text-muted-foreground">Loading your quizzes...</p>
          </div>
        </div>
      </div>
    );
  }

  const QuizCard = ({ quiz }: { quiz: Quiz }) => (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="group hover:shadow-lg transition-all duration-200 overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="space-y-1 flex-1">
              <CardTitle className="text-lg line-clamp-1 group-hover:text-primary transition-colors">
                {quiz.title}
              </CardTitle>
              <CardDescription className="line-clamp-2">
                {quiz.description || "No description available"}
              </CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/mcq-generator/view/${quiz.id}`} className="flex cursor-pointer">
                    <Eye className="mr-2 h-4 w-4" />
                    View Quiz
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/mcq-generator/edit/${quiz.id}`} className="flex cursor-pointer">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Quiz
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => copyShareLink(quiz.shareCode)}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Copy Share Link
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportQuiz(quiz.id)}>
                  <Download className="mr-2 h-4 w-4" />
                  Export Quiz
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => deleteQuiz(quiz.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Quiz
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {quiz.aiGenerated && (
                <Badge variant="secondary" className="gap-1">
                  <Sparkles className="h-3 w-3" />
                  AI Generated
                </Badge>
              )}
              {quiz.subject && (
                <Badge variant="outline">{quiz.subject}</Badge>
              )}
              <Badge className={getDifficultyColor(quiz.difficulty)}>
                {quiz.difficulty}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">{quiz.questionCount || 0} Questions</span>
              </div>
              <div className="flex items-center gap-1.5">
                {getStatusIcon(quiz.isPublished)}
                <span className="text-muted-foreground">
                  {quiz.isPublished ? "Published" : "Draft"}
                </span>
              </div>
              {quiz.attemptCount !== undefined && (
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">{quiz.attemptCount} Attempts</span>
                </div>
              )}
              {quiz.avgScore !== undefined && (
                <div className="flex items-center gap-1.5">
                  <Trophy className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">{quiz.avgScore}% Avg</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                  {quiz.shareCode}
                </code>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={() => copyShareLink(quiz.shareCode)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                <Clock className="inline h-3 w-3 mr-1" />
                {new Date(quiz.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-0 pb-3 gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1"
            asChild
          >
            <Link href={`/dashboard/mcq-generator/view/${quiz.id}`}>
              <Eye className="h-4 w-4 mr-1" />
              Preview
            </Link>
          </Button>
          <Button 
            size="sm" 
            variant="default" 
            className="flex-1"
            asChild
          >
            <Link href={`/dashboard/share/distribute?quiz=${quiz.id}`}>
              <Share2 className="h-4 w-4 mr-1" />
              Share
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            MCQ Library
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage and share your quiz collection
          </p>
        </div>
        <Link href="/dashboard/mcq-generator/create">
          <Button size="lg" className="gap-2">
            <Plus className="h-4 w-4" />
            Create New Quiz
          </Button>
        </Link>
      </div>

      {/* Filters and Search */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search quizzes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Drafts</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-1 border rounded-lg p-1">
              <Button
                size="icon"
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                className="h-8 w-8"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant={viewMode === "list" ? "secondary" : "ghost"}
                className="h-8 w-8"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Bar */}
      {quizzes.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{quizzes.length}</p>
                <p className="text-sm text-muted-foreground">Total Quizzes</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {quizzes.filter(q => q.isPublished).length}
                </p>
                <p className="text-sm text-muted-foreground">Published</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Sparkles className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {quizzes.filter(q => q.aiGenerated).length}
                </p>
                <p className="text-sm text-muted-foreground">AI Generated</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {quizzes.reduce((sum, q) => sum + (q.attemptCount || 0), 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Attempts</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Quiz Grid/List */}
      {filteredQuizzes.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted">
                {searchQuery || filterDifficulty !== "all" || filterStatus !== "all" ? (
                  <Search className="h-8 w-8 text-muted-foreground" />
                ) : (
                  <Brain className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <h3 className="text-lg font-semibold">
                {searchQuery || filterDifficulty !== "all" || filterStatus !== "all" 
                  ? "No matching quizzes found" 
                  : "No quizzes yet"}
              </h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                {searchQuery || filterDifficulty !== "all" || filterStatus !== "all"
                  ? "Try adjusting your filters or search terms"
                  : "Start by creating your first AI-powered MCQ quiz"}
              </p>
              {!(searchQuery || filterDifficulty !== "all" || filterStatus !== "all") && (
                <Link href="/dashboard/mcq-generator/create">
                  <Button className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Quiz
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className={viewMode === "grid" 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
            : "space-y-4"
          }>
            {filteredQuizzes.map((quiz) => (
              <QuizCard key={quiz.id} quiz={quiz} />
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}