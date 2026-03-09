"use client";

import { cn } from "@/lib/utils";
import type { EventCategory } from "@/types/admin-logs";

const CATEGORY_COLORS: Record<EventCategory, string> = {
  AUTH: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  USER_ACTION:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  UI: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
  DATA: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
  LLM: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400",
  API: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  ERROR: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  SYSTEM: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  SECURITY:
    "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400",
};

interface CategoryBadgeProps {
  category: EventCategory;
}

export const CategoryBadge = ({ category }: CategoryBadgeProps) => {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        CATEGORY_COLORS[category] ?? CATEGORY_COLORS.SYSTEM
      )}
    >
      {category}
    </span>
  );
};
