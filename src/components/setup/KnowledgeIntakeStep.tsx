"use client";

import { useState, useRef } from "react";

import {
  Globe,
  Upload,
  Video,
  MessageCircle,
  X,
  Plus,
  FileText,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSetupWizard } from "@/hooks/useSetupWizard";
import { cn } from "@/lib/utils";

type IntakeMethod = "urls" | "documents" | "videos" | "interview" | null;

interface IntakeCard {
  id: IntakeMethod;
  icon: typeof Globe;
  title: string;
  description: string;
}

const INTAKE_CARDS: IntakeCard[] = [
  {
    id: "urls",
    icon: Globe,
    title: "Paste URLs",
    description: "Add website or blog URLs to extract knowledge from",
  },
  {
    id: "documents",
    icon: Upload,
    title: "Upload Documents",
    description: "Upload PDFs, Word docs, or text files",
  },
  {
    id: "videos",
    icon: Video,
    title: "Video Links",
    description: "Paste YouTube or Vimeo URLs for transcript extraction",
  },
  {
    id: "interview",
    icon: MessageCircle,
    title: "AI Interview",
    description: "Let our AI interview you to capture your expertise",
  },
];

interface KnowledgeIntakeStepProps {
  className?: string;
}

const KnowledgeIntakeStep = ({ className }: KnowledgeIntakeStepProps) => {
  const [activeMethod, setActiveMethod] = useState<IntakeMethod>(null);
  const [urlInput, setUrlInput] = useState("");
  const [videoInput, setVideoInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    knowledgeIntake,
    addUrl,
    removeUrl,
    addUploadedFile,
    removeUploadedFile,
    addVideoLink,
    removeVideoLink,
  } = useSetupWizard();

  const { urls, uploadedFiles, videoLinks, interviewCompleted } =
    knowledgeIntake;

  const totalSources =
    urls.length +
    uploadedFiles.length +
    videoLinks.length +
    (interviewCompleted ? 1 : 0);

  const handleCardClick = (method: IntakeMethod) => {
    setActiveMethod((prev) => (prev === method ? null : method));
  };

  const handleAddUrl = () => {
    const trimmed = urlInput.trim();
    if (trimmed && !urls.includes(trimmed)) {
      addUrl(trimmed);
      setUrlInput("");
    }
  };

  const handleAddVideo = () => {
    const trimmed = videoInput.trim();
    if (trimmed && !videoLinks.includes(trimmed)) {
      addVideoLink(trimmed);
      setVideoInput("");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      addUploadedFile({
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        type: file.type,
        r2Key: "",
        status: "uploaded",
      });
    });

    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Card grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {INTAKE_CARDS.map((card) => {
          const Icon = card.icon;
          const isActive = activeMethod === card.id;

          return (
            <button
              key={card.id}
              type="button"
              onClick={() => handleCardClick(card.id)}
              className={cn(
                "flex items-start gap-4 rounded-xl border p-4 text-left transition-all",
                isActive
                  ? "border-[#7C3AED] bg-[#7C3AED]/5"
                  : "border-border hover:border-[#7C3AED]"
              )}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#7C3AED]/10">
                <Icon className="h-5 w-5 text-[#7C3AED]" />
              </div>
              <div>
                <h3 className="font-semibold">{card.title}</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {card.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Expanded form area */}
      {activeMethod === "urls" && (
        <div className="space-y-3 rounded-xl border border-border p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddUrl();
              }}
              placeholder="https://example.com/article"
              className="h-8 flex-1 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]/50"
            />
            <Button onClick={handleAddUrl} disabled={!urlInput.trim()}>
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>

          {urls.length > 0 && (
            <ul className="space-y-2">
              {urls.map((url) => (
                <li
                  key={url}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <span className="mr-2 truncate">{url}</span>
                  <button
                    type="button"
                    onClick={() => removeUrl(url)}
                    className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {activeMethod === "documents" && (
        <div className="space-y-3 rounded-xl border border-border p-4">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.txt,.md"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-8 text-sm text-muted-foreground transition-colors hover:border-[#7C3AED] hover:text-foreground"
          >
            <Upload className="h-8 w-8" />
            <span>Drop files here or click to browse</span>
            <span className="text-xs">PDF, Word, or text files</span>
          </button>

          {uploadedFiles.length > 0 && (
            <ul className="space-y-2">
              {uploadedFiles.map((file) => (
                <li
                  key={file.id}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">{file.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      ({formatFileSize(file.size)})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeUploadedFile(file.id)}
                    className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {activeMethod === "videos" && (
        <div className="space-y-3 rounded-xl border border-border p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={videoInput}
              onChange={(e) => setVideoInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddVideo();
              }}
              placeholder="https://youtube.com/watch?v=..."
              className="h-8 flex-1 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]/50"
            />
            <Button onClick={handleAddVideo} disabled={!videoInput.trim()}>
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>

          {videoLinks.length > 0 && (
            <ul className="space-y-2">
              {videoLinks.map((link) => (
                <li
                  key={link}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <span className="mr-2 truncate">{link}</span>
                  <button
                    type="button"
                    onClick={() => removeVideoLink(link)}
                    className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {activeMethod === "interview" && (
        <div className="space-y-3 rounded-xl border border-border p-4">
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <MessageCircle className="h-10 w-10 text-muted-foreground" />
            <div>
              <h4 className="font-semibold">AI Interview — Coming Soon</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                This feature will let our AI ask you questions about your
                expertise.
              </p>
            </div>
            <Button disabled>Start Interview</Button>
          </div>
        </div>
      )}

      {/* Summary count */}
      <div className="text-center text-sm text-muted-foreground">
        {totalSources} {totalSources === 1 ? "source" : "sources"} added
      </div>
    </div>
  );
};

export default KnowledgeIntakeStep;
