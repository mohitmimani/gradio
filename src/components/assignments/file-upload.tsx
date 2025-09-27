"use client";

import { useState, useCallback } from "react";
import { useDropzone, type DropzoneOptions } from "react-dropzone";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  File,
  CheckCircle,
  AlertCircle,
  X,
  FileText,
  Image,
  FileSpreadsheet,
} from "lucide-react";

interface FileUploadProps {
  assignmentId: string;
  allowedFileTypes: string[];
  maxFileSize: number; // in bytes
  onUploadSuccess?: (submission: any) => void;
  onUploadError?: (error: string) => void;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: "uploading" | "success" | "error";
  error?: string;
  submissionId?: string;
}

export default function FileUpload({
  assignmentId,
  allowedFileTypes,
  maxFileSize,
  onUploadSuccess,
  onUploadError,
}: FileUploadProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const { toast } = useToast();

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return <Image className="h-5 w-5" />;
      case "pdf":
        return <FileText className="h-5 w-5" />;
      case "doc":
      case "docx":
        return <FileText className="h-5 w-5" />;
      case "xls":
      case "xlsx":
        return <FileSpreadsheet className="h-5 w-5" />;
      default:
        return <File className="h-5 w-5" />;
    }
  };

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize) {
      const maxSizeMB = maxFileSize / 1024 / 1024;
      return `File size exceeds maximum limit of ${maxSizeMB}MB`;
    }

    // Check file type
    const fileExtension = file.name.split(".").pop()?.toLowerCase() || "";
    if (!allowedFileTypes.includes(fileExtension)) {
      return `File type .${fileExtension} is not allowed. Allowed types: ${allowedFileTypes.join(", ")}`;
    }

    return null;
  };

  const uploadFile = async (file: File) => {
    const fileId = Math.random().toString(36).substring(2);

    setUploadingFiles(prev => [
      ...prev,
      { file, progress: 0, status: "uploading" }
    ]);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("assignmentId", assignmentId);
      formData.append("studentName", ""); // Will be filled by the API from session
      formData.append("studentEmail", ""); // Will be filled by the API from session

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadingFiles(prev =>
            prev.map(f =>
              f.file.name === file.name
                ? { ...f, progress }
                : f
            )
          );
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status === 200) {
          try {
            const result = JSON.parse(xhr.responseText);
            setUploadingFiles(prev =>
              prev.map(f =>
                f.file.name === file.name
                  ? {
                      ...f,
                      progress: 100,
                      status: "success" as const,
                      submissionId: result.submission?.id
                    }
                  : f
              )
            );

            // Don't show toast here since parent component will show detailed confirmation
            if (onUploadSuccess) {
              onUploadSuccess(result.submission);
            }
          } catch (parseError) {
            console.error("Error parsing successful response:", parseError);
            throw new Error("Failed to process upload response");
          }
        } else {
          let errorMessage = "Upload failed";
          try {
            const errorResult = JSON.parse(xhr.responseText);
            errorMessage = errorResult.error || errorMessage;
            console.error("Upload error details:", errorResult);
          } catch (parseError) {
            console.error("Could not parse error response:", xhr.responseText);
            errorMessage = `Upload failed with status ${xhr.status}`;
          }
          throw new Error(errorMessage);
        }
      });

      xhr.addEventListener("error", (event) => {
        console.error("Upload network error:", event);
        throw new Error("Network error during upload. Please check your connection and try again.");
      });

      xhr.open("POST", "/api/assignments/upload");
      xhr.send(formData);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Upload failed";

      setUploadingFiles(prev =>
        prev.map(f =>
          f.file.name === file.name
            ? { ...f, status: "error" as const, error: errorMessage }
            : f
        )
      );

      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      });

      if (onUploadError) {
        onUploadError(errorMessage);
      }
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => {
      const validationError = validateFile(file);
      if (validationError) {
        toast({
          title: "Invalid File",
          description: validationError,
          variant: "destructive",
        });
        return;
      }

      uploadFile(file);
    });
  }, [assignmentId, allowedFileTypes, maxFileSize]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    accept: allowedFileTypes.reduce((acc, type) => {
      const mimeTypes = {
        'pdf': ['application/pdf'],
        'doc': ['application/msword'],
        'docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        'txt': ['text/plain'],
        'jpg': ['image/jpeg'],
        'jpeg': ['image/jpeg'],
        'png': ['image/png'],
      };
      const mimeType = mimeTypes[type as keyof typeof mimeTypes] || [];
      if (mimeType.length > 0) {
        mimeType.forEach(mime => {
          acc[mime] = [`.${type}`];
        });
      }
      return acc;
    }, {} as Record<string, string[]>),
  });

  const removeFile = (fileName: string) => {
    setUploadingFiles(prev => prev.filter(f => f.file.name !== fileName));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            {isDragActive ? (
              <p className="text-lg font-medium">Drop the files here...</p>
            ) : (
              <div>
                <p className="text-lg font-medium mb-2">
                  Drag and drop files here, or click to select
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Allowed types: {allowedFileTypes.join(", ")} | Max size: {formatFileSize(maxFileSize)}
                </p>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Choose Files
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {uploadingFiles.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-4">Upload Progress</h4>
            <div className="space-y-3">
              {uploadingFiles.map((uploadingFile, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {getFileIcon(uploadingFile.file.name)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {uploadingFile.file.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(uploadingFile.file.size)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {uploadingFile.status === "success" && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                      {uploadingFile.status === "error" && (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(uploadingFile.file.name)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {uploadingFile.status === "uploading" && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Uploading...</span>
                        <span>{uploadingFile.progress}%</span>
                      </div>
                      <Progress value={uploadingFile.progress} />
                    </div>
                  )}

                  {uploadingFile.status === "success" && (
                    <div className="text-sm text-green-600">
                      Upload completed successfully!
                    </div>
                  )}

                  {uploadingFile.status === "error" && (
                    <div className="text-sm text-red-600">
                      Error: {uploadingFile.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}