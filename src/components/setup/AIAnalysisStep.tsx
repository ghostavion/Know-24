"use client";

import { useCallback } from "react";

import {
  BookOpen,
  Check,
  Loader2,
  Sparkles,
  BookOpen as BookOpenIcon,
  Layout,
  FileText,
  PenTool,
  Copy,
  List,
  Zap,
  Mail,
  CheckSquare,
  Monitor,
  MessageCircle,
  Cpu,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSetupWizard } from "@/hooks/useSetupWizard";
import { PRODUCT_TYPES } from "@/lib/constants/product-types";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, LucideIcon> = {
  BookOpen: BookOpenIcon,
  Layout,
  FileText,
  PenTool,
  Copy,
  List,
  Zap,
  Mail,
  CheckSquare,
  Monitor,
  MessageCircle,
  Cpu,
};

interface AIAnalysisStepProps {
  className?: string;
}

const AIAnalysisStep = ({ className }: AIAnalysisStepProps) => {
  const {
    aiAnalysis,
    analysisLoading,
    setAIAnalysis,
    setAnalysisLoading,
    setSelectedProductTypes,
    setStep,
  } = useSetupWizard();

  const handleAnalyze = useCallback(() => {
    setAnalysisLoading(true);

    setTimeout(() => {
      setAIAnalysis({
        knowledgeSummary:
          "Your expertise covers a diverse range of topics with strong practical applications. Your content demonstrates deep domain knowledge that can be packaged into multiple product formats for your audience.",
        topics: ["Topic 1", "Topic 2", "Topic 3"],
        recommendedProducts: [
          {
            productTypeSlug: "guide_ebook",
            reason:
              "Your content is well-suited for a comprehensive guide",
            suggestedTitle: "The Complete Guide",
          },
          {
            productTypeSlug: "cheat_sheet",
            reason:
              "Key concepts can be condensed into a quick reference",
            suggestedTitle: "Quick Reference Card",
          },
          {
            productTypeSlug: "email_course",
            reason:
              "Your topics naturally break into a learning sequence",
            suggestedTitle: "5-Day Masterclass",
          },
        ],
      });
      setAnalysisLoading(false);
    }, 2000);
  }, [setAIAnalysis, setAnalysisLoading]);

  const handleAcceptRecommendations = () => {
    if (!aiAnalysis) return;
    const slugs = aiAnalysis.recommendedProducts.map(
      (p) => p.productTypeSlug
    );
    setSelectedProductTypes(slugs);
    setStep(3);
  };

  const handleChooseOwn = () => {
    setSelectedProductTypes([]);
    setStep(3);
  };

  // Loading state
  if (analysisLoading) {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-6 py-16", className)}>
        <Loader2 className="h-12 w-12 animate-spin text-[#0891b2]" />
        <div className="text-center">
          <h2 className="text-xl font-semibold">Analyzing your expertise...</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            This usually takes 10-20 seconds
          </p>
        </div>
        <div className="h-2 w-64 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-2/3 animate-pulse rounded-full bg-[#0891b2]" />
        </div>
      </div>
    );
  }

  // Results state
  if (aiAnalysis) {
    return (
      <div className={cn("space-y-6", className)}>
        {/* Knowledge Summary */}
        <div className="flex items-start gap-4 rounded-xl border border-border p-5">
          <BookOpen className="mt-0.5 h-6 w-6 shrink-0 text-[#0891b2]" />
          <div>
            <h3 className="font-semibold">Knowledge Summary</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {aiAnalysis.knowledgeSummary}
            </p>
          </div>
        </div>

        {/* Topics */}
        <div>
          <h3 className="mb-2 text-sm font-semibold">Topics Identified</h3>
          <div className="flex flex-wrap gap-2">
            {aiAnalysis.topics.map((topic) => (
              <span
                key={topic}
                className="rounded-full bg-[#0891b2]/10 px-3 py-1 text-xs font-medium text-[#0891b2]"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>

        {/* Recommended Products */}
        <div>
          <h3 className="mb-3 font-semibold">
            Based on your expertise, we recommend:
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {aiAnalysis.recommendedProducts.map((rec) => {
              const productType = PRODUCT_TYPES.find(
                (pt) => pt.slug === rec.productTypeSlug
              );
              const Icon = ICON_MAP[productType?.iconName ?? ""] ?? Sparkles;

              return (
                <div
                  key={rec.productTypeSlug}
                  className="relative rounded-xl border border-[#0891b2] bg-[#0891b2]/5 p-4"
                >
                  <div className="absolute right-3 top-3">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0891b2] text-white">
                      <Check className="h-3 w-3" />
                    </div>
                  </div>
                  <Icon className="h-8 w-8 text-[#0891b2]" />
                  <p className="mt-2 text-xs font-medium text-muted-foreground">
                    {productType?.displayName ?? rec.productTypeSlug}
                  </p>
                  <p className="mt-0.5 font-semibold">{rec.suggestedTitle}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {rec.reason}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-3">
          <Button onClick={handleAcceptRecommendations}>
            These look great
          </Button>
          <Button variant="outline" onClick={handleChooseOwn}>
            I&apos;ll choose my own
          </Button>
        </div>
      </div>
    );
  }

  // No analysis yet
  return (
    <div className={cn("flex flex-col items-center justify-center gap-4 py-16", className)}>
      <Sparkles className="h-12 w-12 text-[#0891b2]" />
      <div className="text-center">
        <h2 className="text-xl font-semibold">Ready to Analyze</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          We&apos;ll review your knowledge sources and recommend the best
          products for your expertise.
        </p>
      </div>
      <Button onClick={handleAnalyze}>Analyze My Knowledge</Button>
    </div>
  );
};

export default AIAnalysisStep;
