"use client";

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
  Check,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { STOREFRONT_PALETTES } from "@/lib/constants/product-types";
import { useSetupWizard } from "@/hooks/useSetupWizard";
import type { StorefrontPalette } from "@/types/setup";

/**
 * Maps palette header colors to Tailwind bg classes.
 * These are written as full class strings so Tailwind can detect them at build time.
 */
const headerBgMap: Record<string, string> = {
  "#1e293b": "bg-[#1e293b]",
  "#14532d": "bg-[#14532d]",
  "#3b0764": "bg-[#3b0764]",
  "#0f172a": "bg-[#0f172a]",
};

/**
 * Maps palette colors to Tailwind bg classes for swatches.
 */
const swatchBgMap: Record<string, string> = {
  "#1e293b": "bg-[#1e293b]",
  "#14532d": "bg-[#14532d]",
  "#3b0764": "bg-[#3b0764]",
  "#0f172a": "bg-[#0f172a]",
  "#f97316": "bg-[#f97316]",
  "#f59e0b": "bg-[#f59e0b]",
  "#ec4899": "bg-[#ec4899]",
  "#6366f1": "bg-[#6366f1]",
};

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

interface GoLiveStepProps {
  className?: string;
}

const GoLiveStep = ({ className }: GoLiveStepProps) => {
  const {
    businessName,
    businessSlug,
    buildItems,
    selectedPalette,
    setSelectedPalette,
  } = useSetupWizard();

  const activePalette = STOREFRONT_PALETTES.find(
    (p) => p.id === selectedPalette
  ) ?? STOREFRONT_PALETTES[0];

  const completedItems = buildItems.filter(
    (item) => item.status === "complete"
  );

  return (
    <div className={cn("space-y-10", className)}>
      {/* Section 1: Storefront Preview */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Storefront Preview</h3>
        <div className="overflow-hidden rounded-xl border border-border shadow-sm">
          {/* Browser Chrome Bar */}
          <div className="flex items-center gap-1.5 rounded-t-xl bg-gray-100 px-4 py-2.5">
            <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
            <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
          </div>

          {/* Header with palette color */}
          <div
            className={cn(
              "flex items-center justify-center py-10",
              headerBgMap[activePalette.headerColor] ?? "bg-[#1e293b]"
            )}
          >
            <h4 className="text-xl font-bold text-white">
              {businessName || "Your Business"}
            </h4>
          </div>

          {/* Content area */}
          <div className="flex items-center justify-center bg-white py-12">
            <p className="text-sm text-gray-400">
              Your products will appear here
            </p>
          </div>
        </div>
      </section>

      {/* Section 2: Color Palette Selector */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Choose Your Brand Palette</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {STOREFRONT_PALETTES.map((palette) => {
            const isSelected = selectedPalette === palette.id;

            return (
              <button
                key={palette.id}
                type="button"
                onClick={() =>
                  setSelectedPalette(palette.id as StorefrontPalette)
                }
                className={cn(
                  "relative flex flex-col items-start gap-2 rounded-lg border-2 p-4 text-left transition-colors",
                  isSelected
                    ? "border-[#0891b2] bg-[#0891b2]/5"
                    : "border-border hover:border-gray-400"
                )}
              >
                {/* Selected badge */}
                {isSelected && (
                  <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#0891b2]">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}

                {/* Color swatches */}
                <div className="flex overflow-hidden rounded">
                  <div
                    className={cn(
                      "h-6 w-12 rounded-l",
                      swatchBgMap[palette.headerColor] ?? "bg-gray-500"
                    )}
                  />
                  <div
                    className={cn(
                      "h-6 w-12 rounded-r",
                      swatchBgMap[palette.accentColor] ?? "bg-gray-500"
                    )}
                  />
                </div>

                {/* Palette name */}
                <span className="text-sm font-semibold">{palette.name}</span>

                {/* Description */}
                <span className="text-xs text-muted-foreground">
                  {palette.description}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Section 3: Product Summary */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Products Ready to Launch</h3>
        <div className="space-y-2">
          {completedItems.map((item) => {
            const IconComponent = iconMap[item.iconName] ?? FileText;

            return (
              <div
                key={item.productTypeSlug}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                  <IconComponent className="h-4 w-4 text-muted-foreground" />
                </div>

                <span className="flex-1 text-sm font-medium">
                  {item.displayName}
                </span>

                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                  Ready
                </span>
              </div>
            );
          })}

          {completedItems.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No products have been built yet.
            </p>
          )}
        </div>
      </section>

      {/* Section 4: Go Live Reassurance */}
      <section className="space-y-2 rounded-lg border border-border bg-card p-6 text-center">
        <p className="text-sm font-medium text-foreground">
          Everything looks great! Click Go Live to publish your storefront and
          start selling.
        </p>
        <p className="text-xs text-muted-foreground">
          Your storefront will be live at{" "}
          <span className="font-medium">
            {businessSlug || "your-business"}.know24.io
          </span>
        </p>
      </section>
    </div>
  );
};

export default GoLiveStep;
