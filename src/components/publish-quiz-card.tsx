"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  CheckCircle, 
  AlertCircle, 
  Share2, 
  Copy, 
  Lock,
  Unlock,
  Globe,
  Loader2,
  ExternalLink,
  QrCode,
  Mail
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import QRCode from "qrcode";
import { useEffect, useRef } from "react";

interface PublishQuizCardProps {
  quiz: {
    id: string;
    title: string;
    shareCode: string;
    isPublished: boolean;
  };
  onStatusChange: (isPublished: boolean) => void;
}

export default function PublishQuizCard({ quiz, onStatusChange }: PublishQuizCardProps) {
  const [isPublished, setIsPublished] = useState(quiz.isPublished);
  const [isUpdating, setIsUpdating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  
  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/quiz/${quiz.shareCode}`;

  useEffect(() => {
    if (showQR && qrCanvasRef.current && shareUrl) {
      // Clear previous canvas content
      const canvas = qrCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      
      QRCode.toCanvas(qrCanvasRef.current, shareUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      }).then(() => {
        console.log('QR Code generated successfully for:', shareUrl);
      }).catch((error) => {
        console.error('QR Code generation failed:', error);
        toast({
          title: "QR Code Error",
          description: "Failed to generate QR code",
          variant: "destructive",
        });
      });
    }
  }, [showQR, shareUrl, toast]);

  const togglePublishStatus = async () => {
    setIsUpdating(true);
    
    try {
      const response = await fetch(`/api/mcq/${quiz.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !isPublished }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Failed to update status:', response.status, errorData);
        throw new Error(`Failed to update status: ${response.status}`);
      }

      const newStatus = !isPublished;
      setIsPublished(newStatus);
      onStatusChange(newStatus);
      
      toast({
        title: newStatus ? "Quiz Published! 🎉" : "Quiz Unpublished",
        description: newStatus 
          ? "Your quiz is now live and ready to share with students" 
          : "Quiz is now private and no longer accessible via share link",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update quiz status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Link Copied!",
        description: "Share link has been copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link. Please try again.",
        variant: "destructive",
      });
    }
  };

  const openInNewTab = () => {
    window.open(shareUrl, '_blank');
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Quiz: ${quiz.title}`);
    const body = encodeURIComponent(`Take this quiz: ${shareUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <TooltipProvider>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className={`relative overflow-hidden transition-all duration-300 ${
          isPublished 
            ? "border-green-200 bg-gradient-to-r from-green-50/50 to-transparent dark:from-green-950/20" 
            : "border-orange-200 bg-gradient-to-r from-orange-50/50 to-transparent dark:from-orange-950/20"
        }`}>
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
          </div>

          <CardContent className="relative py-6">
            <div className="flex items-center justify-between">
              {/* Status Section */}
              <div className="flex items-center gap-4">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={isPublished ? "published" : "private"}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`p-3 rounded-full ${
                      isPublished 
                        ? "bg-green-100 dark:bg-green-900/30" 
                        : "bg-orange-100 dark:bg-orange-900/30"
                    }`}
                  >
                    {isPublished ? (
                      <Globe className="h-6 w-6 text-green-600 dark:text-green-400" />
                    ) : (
                      <Lock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    )}
                  </motion.div>
                </AnimatePresence>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">
                      {isPublished ? "Quiz is Live" : "Quiz is Private"}
                    </h3>
                    {isPublished && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex items-center"
                      >
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                      </motion.div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {isPublished 
                      ? "Students can access this quiz via the share link" 
                      : "Publish to allow students to take this quiz"}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {isPublished && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2"
                  >
                    {/* Share Link Input Group */}
                    <div className="hidden sm:flex items-center gap-2 p-2 rounded-lg bg-background border">
                      <Input
                        value={shareUrl}
                        readOnly
                        className="border-0 bg-transparent h-8 w-[200px] lg:w-[300px] text-xs font-mono focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={copyShareLink}
                          >
                            {copied ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {copied ? "Copied!" : "Copy link"}
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={openInNewTab}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Open in new tab</TooltipContent>
                      </Tooltip>

                      <Popover open={showQR} onOpenChange={setShowQR}>
                        <PopoverTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                          >
                            <QrCode className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-4">
                          <div className="space-y-3 text-center">
                            <h4 className="font-medium">QR Code</h4>
                            <div className="flex justify-center">
                              <canvas 
                                ref={qrCanvasRef} 
                                className="border rounded"
                                style={{ maxWidth: '200px', maxHeight: '200px' }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Scan to access quiz
                            </p>
                          </div>
                        </PopoverContent>
                      </Popover>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={shareViaEmail}
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Share via email</TooltipContent>
                      </Tooltip>
                    </div>

                    {/* Mobile Share Button */}
                    <div className="sm:hidden">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyShareLink}
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Publish/Unpublish Button */}
                <Button
                  variant={isPublished ? "outline" : "default"}
                  onClick={togglePublishStatus}
                  disabled={isUpdating}
                  className="min-w-[120px]"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : isPublished ? (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Unpublish
                    </>
                  ) : (
                    <>
                      <Unlock className="mr-2 h-4 w-4" />
                      Publish Quiz
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Share Code Badge */}
            <AnimatePresence>
              {isPublished && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-4 pt-4 border-t"
                >
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Share Code:</span>
                      <code className="px-2 py-1 rounded bg-muted font-mono font-semibold">
                        {quiz.shareCode}
                      </code>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-muted-foreground">
                        Ready to share with students
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </TooltipProvider>
  );
}