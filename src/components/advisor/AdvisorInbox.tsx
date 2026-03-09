"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  AlertTriangle,
  TrendingUp,
  FileText,
  Search,
  Check,
  X,
  Clock,
  Loader2,
} from "lucide-react";

interface AdvisorItem {
  id: string;
  businessId: string;
  category: string;
  priority: string;
  title: string;
  summary: string;
  actionType: string;
  actionPayload: Record<string, unknown>;
  status: string;
  createdAt: string;
}

interface AdvisorInboxProps {
  items: AdvisorItem[];
}

type FilterTab = "all" | "high" | "content" | "sales" | "scout";

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "high", label: "High Priority" },
  { value: "content", label: "Content" },
  { value: "sales", label: "Sales" },
  { value: "scout", label: "Scout" },
];

const CATEGORY_CONFIG: Record<
  string,
  { label: string; color: string; icon: typeof Sparkles }
> = {
  sales_insight: {
    label: "Sales",
    color: "bg-emerald-100 text-emerald-700",
    icon: TrendingUp,
  },
  content_draft: {
    label: "Content",
    color: "bg-blue-100 text-blue-700",
    icon: FileText,
  },
  scout_opportunity: {
    label: "Scout",
    color: "bg-purple-100 text-purple-700",
    icon: Search,
  },
  product_idea: {
    label: "Product",
    color: "bg-amber-100 text-amber-700",
    icon: Sparkles,
  },
  performance_alert: {
    label: "Alert",
    color: "bg-red-100 text-red-700",
    icon: AlertTriangle,
  },
  reminder: {
    label: "Reminder",
    color: "bg-gray-100 text-gray-700",
    icon: Clock,
  },
  engagement_prompt: {
    label: "Engagement",
    color: "bg-cyan-100 text-cyan-700",
    icon: TrendingUp,
  },
};

const PRIORITY_INDICATOR: Record<string, string> = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-gray-400",
};

export const AdvisorInbox = ({ items }: AdvisorInboxProps) => {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [actionInFlight, setActionInFlight] = useState<string | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(
    () => new Set()
  );

  const filteredItems = items.filter((item) => {
    if (dismissedIds.has(item.id)) return false;

    switch (activeTab) {
      case "high":
        return item.priority === "high";
      case "content":
        return item.category === "content_draft";
      case "sales":
        return item.category === "sales_insight";
      case "scout":
        return item.category === "scout_opportunity";
      default:
        return true;
    }
  });

  const handleAction = useCallback(
    async (
      itemId: string,
      action: "approved" | "dismissed" | "snoozed"
    ) => {
      setActionInFlight(itemId);

      try {
        const response = await fetch(`/api/advisor/items/${itemId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: action }),
        });

        if (response.ok || response.status === 404) {
          // Optimistically remove from view on approve or dismiss
          if (action === "approved" || action === "dismissed") {
            setDismissedIds((prev) => new Set(prev).add(itemId));
          }
        }
      } catch {
        // Silently fail for now; API may not exist yet
      } finally {
        setActionInFlight(null);
      }
    },
    []
  );

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-card p-12 text-center">
        <Sparkles className="h-8 w-8 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold text-foreground">
          No recommendations yet
        </h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Once you set up a business, your AI Advisor will proactively surface
          insights, drafts, and opportunities here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-primary/30",
              activeTab === tab.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No items match the selected filter.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => {
            const config = CATEGORY_CONFIG[item.category] ?? {
              label: item.category,
              color: "bg-gray-100 text-gray-700",
              icon: Sparkles,
            };
            const CategoryIcon = config.icon;
            const priorityDot =
              PRIORITY_INDICATOR[item.priority] ?? "bg-gray-400";
            const isLoading = actionInFlight === item.id;

            return (
              <div
                key={item.id}
                className={cn(
                  "flex flex-col rounded-xl border border-border bg-card p-5",
                  "transition-shadow hover:shadow-md"
                )}
              >
                {/* Header: Category badge + Priority */}
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                      config.color
                    )}
                  >
                    <CategoryIcon className="h-3 w-3" />
                    {config.label}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span
                      className={cn(
                        "inline-block h-2 w-2 rounded-full",
                        priorityDot
                      )}
                    />
                    {item.priority}
                  </span>
                </div>

                {/* Title */}
                <h3 className="mt-3 text-sm font-semibold text-foreground line-clamp-2">
                  {item.title}
                </h3>

                {/* Summary */}
                <p className="mt-1.5 flex-1 text-xs text-muted-foreground line-clamp-3">
                  {item.summary}
                </p>

                {/* Timestamp */}
                <p className="mt-3 text-xs text-muted-foreground">
                  {new Date(item.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>

                {/* Action Buttons */}
                <div className="mt-4 flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleAction(item.id, "approved")}
                    className={cn(
                      "inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5",
                      "bg-primary text-xs font-medium text-primary-foreground",
                      "hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/30",
                      "disabled:cursor-not-allowed disabled:opacity-50",
                      "transition-colors"
                    )}
                  >
                    {isLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Check className="h-3 w-3" />
                    )}
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleAction(item.id, "dismissed")}
                    className={cn(
                      "inline-flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-1.5",
                      "text-xs font-medium text-muted-foreground",
                      "hover:bg-muted hover:text-foreground",
                      "focus:outline-none focus:ring-2 focus:ring-primary/30",
                      "disabled:cursor-not-allowed disabled:opacity-50",
                      "transition-colors"
                    )}
                  >
                    <X className="h-3 w-3" />
                    Dismiss
                  </button>
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleAction(item.id, "snoozed")}
                    className={cn(
                      "inline-flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-1.5",
                      "text-xs font-medium text-muted-foreground",
                      "hover:bg-muted hover:text-foreground",
                      "focus:outline-none focus:ring-2 focus:ring-primary/30",
                      "disabled:cursor-not-allowed disabled:opacity-50",
                      "transition-colors"
                    )}
                  >
                    <Clock className="h-3 w-3" />
                    Snooze
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
