"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BookOpen,
  Plus,
  Search,
  Star,
  Clock,
  Users,
  Download,
  Eye,
  Copy,
  Filter,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface Template {
  id: string;
  title: string;
  description: string;
  subject: string;
  difficulty: "easy" | "medium" | "hard";
  questionCount: number;
  estimatedTime: number;
  isPublic: boolean;
  createdBy: string;
  creatorName?: string;
  usageCount: number;
  rating: number;
  tags: string[];
  preview: string;
}

const predefinedTemplates: Template[] = [
  {
    id: "template-1",
    title: "JavaScript Fundamentals",
    description: "Test basic JavaScript concepts including variables, functions, and control structures",
    subject: "Programming",
    difficulty: "easy",
    questionCount: 10,
    estimatedTime: 15,
    isPublic: true,
    createdBy: "system",
    creatorName: "Gradio Team",
    usageCount: 234,
    rating: 4.8,
    tags: ["JavaScript", "Basics", "Programming"],
    preview: "Questions cover: variables, functions, arrays, objects, loops, and conditionals",
  },
  {
    id: "template-2", 
    title: "Mathematics - Algebra Basics",
    description: "Essential algebra concepts for middle school students",
    subject: "Mathematics",
    difficulty: "medium",
    questionCount: 15,
    estimatedTime: 20,
    isPublic: true,
    createdBy: "system",
    creatorName: "Gradio Team",
    usageCount: 189,
    rating: 4.6,
    tags: ["Math", "Algebra", "Middle School"],
    preview: "Topics: linear equations, quadratic expressions, graphing, and word problems",
  },
  {
    id: "template-3",
    title: "World History - Ancient Civilizations",
    description: "Comprehensive quiz covering ancient civilizations and their contributions",
    subject: "History", 
    difficulty: "hard",
    questionCount: 20,
    estimatedTime: 30,
    isPublic: true,
    createdBy: "system",
    creatorName: "Gradio Team",
    usageCount: 156,
    rating: 4.7,
    tags: ["History", "Ancient", "Civilization"],
    preview: "Covers: Egypt, Greece, Rome, Mesopotamia, China, and India",
  },
  {
    id: "template-4",
    title: "Python Data Structures",
    description: "Advanced Python programming focusing on lists, dictionaries, and algorithms",
    subject: "Programming",
    difficulty: "hard",
    questionCount: 12,
    estimatedTime: 25,
    isPublic: true,
    createdBy: "system",
    creatorName: "Gradio Team",
    usageCount: 98,
    rating: 4.9,
    tags: ["Python", "Data Structures", "Advanced"],
    preview: "Topics: lists, tuples, dictionaries, sets, algorithms, and complexity",
  },
  {
    id: "template-5",
    title: "Biology - Cell Structure",
    description: "Detailed quiz on cell biology and cellular processes",
    subject: "Biology",
    difficulty: "medium",
    questionCount: 14,
    estimatedTime: 18,
    isPublic: true,
    createdBy: "system",
    creatorName: "Gradio Team",
    usageCount: 167,
    rating: 4.5,
    tags: ["Biology", "Cell", "Life Science"],
    preview: "Covers: organelles, cell division, metabolism, and cellular transport",
  },
  {
    id: "template-6",
    title: "English Literature - Shakespeare",
    description: "Comprehensive quiz on Shakespeare's major works and themes",
    subject: "Literature",
    difficulty: "hard",
    questionCount: 18,
    estimatedTime: 28,
    isPublic: true,
    createdBy: "system",
    creatorName: "Gradio Team",
    usageCount: 134,
    rating: 4.4,
    tags: ["Literature", "Shakespeare", "English"],
    preview: "Works: Hamlet, Romeo & Juliet, Macbeth, and literary devices",
  },
];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    // Simulate loading user templates + predefined ones
    setTimeout(() => {
      setTemplates(predefinedTemplates);
      setFilteredTemplates(predefinedTemplates);
      setIsLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [searchQuery, selectedSubject, selectedDifficulty, templates]);

  const filterTemplates = () => {
    let filtered = templates;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(template =>
        template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by subject
    if (selectedSubject !== "all") {
      filtered = filtered.filter(template => template.subject === selectedSubject);
    }

    // Filter by difficulty
    if (selectedDifficulty !== "all") {
      filtered = filtered.filter(template => template.difficulty === selectedDifficulty);
    }

    setFilteredTemplates(filtered);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "bg-green-500/10 text-green-600 border-green-200";
      case "medium": return "bg-yellow-500/10 text-yellow-600 border-yellow-200";
      case "hard": return "bg-red-500/10 text-red-600 border-red-200";
      default: return "";
    }
  };

  const getUniqueSubjects = () => {
    const subjects = templates.map(t => t.subject);
    return ["all", ...Array.from(new Set(subjects))];
  };

  const useTemplate = async (templateId: string) => {
    try {
      const response = await fetch(`/api/templates/${templateId}/use`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) throw new Error("Failed to use template");

      const data = await response.json();
      
      toast({
        title: "Template Applied!",
        description: "Quiz created from template successfully",
      });

      // Navigate to the created quiz
      router.push(`/dashboard/mcq-generator/view/${data.quizId}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to use template. Please try again.",
        variant: "destructive",
      });
    }
  };

  const previewTemplate = (template: Template) => {
    // For now, show a simple preview in the toast
    toast({
      title: template.title,
      description: template.preview,
      duration: 5000,
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Loading templates...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <div className="bg-primary/10 rounded-lg p-2">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          Quiz Templates
        </h1>
        <p className="text-muted-foreground mt-2">
          Start with professionally crafted quiz templates or create your own
        </p>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search templates by title, description, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent>
                {getUniqueSubjects().map((subject) => (
                  <SelectItem key={subject} value={subject}>
                    {subject === "all" ? "All Subjects" : subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-lg font-medium mb-2">No templates found</p>
            <p className="text-muted-foreground">
              Try adjusting your search criteria or create a custom quiz
            </p>
            <Button 
              className="mt-4"
              onClick={() => router.push("/dashboard/mcq-generator/create")}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Custom Quiz
            </Button>
          </div>
        ) : (
          filteredTemplates.map((template) => (
            <Card key={template.id} className="group hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {template.title}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {template.description}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span>{template.rating}</span>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="outline" className={getDifficultyColor(template.difficulty)}>
                    {template.difficulty}
                  </Badge>
                  <Badge variant="outline">
                    {template.subject}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {template.questionCount} questions
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{template.estimatedTime} min</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{template.usageCount} uses</span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {template.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {template.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{template.tags.length - 3}
                      </Badge>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => useTemplate(template.id)}
                      className="flex-1"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Use Template
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => previewTemplate(template)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Creator */}
                  <div className="text-xs text-muted-foreground">
                    by {template.creatorName || "Anonymous"}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Template CTA */}
      <Card className="mt-8 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="pt-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Create Your Own Template</h3>
            <p className="text-muted-foreground mb-4">
              Turn your best quizzes into reusable templates for yourself and others
            </p>
            <Button onClick={() => router.push("/dashboard/mcq-generator/create")}>
              <Plus className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}