"use client";

import { useEffect, useRef } from "react";

import {
  BookOpen,
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
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { PRODUCT_TYPES } from "@/lib/constants/product-types";
import { useSetupWizard } from "@/hooks/useSetupWizard";
import type { BuildProductItem } from "@/types/setup";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen,
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

interface AIBuildingStepProps {
  className?: string;
}

const AIBuildingStep = ({ className }: AIBuildingStepProps) => {
  const {
    selectedProductTypes,
    buildItems,
    setBuildItems,
    updateBuildItem,
    setBuildComplete,
    setStep,
  } = useSetupWizard();

  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    const items: BuildProductItem[] = selectedProductTypes.map((slug) => {
      const productType = PRODUCT_TYPES.find((pt) => pt.slug === slug);
      return {
        productTypeSlug: slug,
        displayName: productType?.displayName ?? slug,
        iconName: productType?.iconName ?? "FileText",
        status: "queued" as const,
      };
    });

    setBuildItems(items);

    const runBuild = async () => {
      for (const item of items) {
        updateBuildItem(item.productTypeSlug, "building");
        await new Promise((resolve) => setTimeout(resolve, 1500));
        updateBuildItem(item.productTypeSlug, "complete");
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
      setBuildComplete(true);
      setStep(5);
    };

    runBuild();
  }, [
    selectedProductTypes,
    setBuildItems,
    updateBuildItem,
    setBuildComplete,
    setStep,
  ]);

  const completedCount = buildItems.filter(
    (item) => item.status === "complete"
  ).length;

  return (
    <div className={cn("flex flex-col items-center space-y-8", className)}>
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight">
          Building Your Products
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Sit back — our AI is generating your products right now.
        </p>
      </div>

      {/* Build Items List */}
      <div className="w-full max-w-md space-y-3">
        {buildItems.map((item) => {
          const IconComponent = iconMap[item.iconName] ?? FileText;

          return (
            <div
              key={item.productTypeSlug}
              className={cn(
                "flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-opacity duration-500",
                item.status === "queued" ? "opacity-60" : "opacity-100"
              )}
            >
              {/* Product Icon */}
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                <IconComponent className="h-5 w-5 text-muted-foreground" />
              </div>

              {/* Product Name */}
              <span className="flex-1 text-sm font-medium">
                {item.displayName}
              </span>

              {/* Status Indicator */}
              <div className="flex shrink-0 items-center gap-1.5">
                {item.status === "queued" && (
                  <span className="text-xs text-gray-400">Queued</span>
                )}

                {item.status === "building" && (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-[#0891b2]" />
                    <span className="text-xs font-medium text-[#0891b2]">
                      Building...
                    </span>
                  </>
                )}

                {item.status === "complete" && (
                  <>
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-xs font-medium text-green-500">
                      Complete
                    </span>
                  </>
                )}

                {item.status === "error" && (
                  <>
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-xs font-medium text-red-500">
                      {item.errorMessage ?? "Failed"}
                    </span>
                    <button
                      type="button"
                      className="ml-1 text-xs font-medium text-[#0891b2] underline hover:text-[#0891b2]/80"
                      onClick={() =>
                        updateBuildItem(item.productTypeSlug, "queued")
                      }
                    >
                      Retry
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress Counter */}
      {buildItems.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {completedCount} of {buildItems.length} products built
        </p>
      )}
    </div>
  );
};

export default AIBuildingStep;
