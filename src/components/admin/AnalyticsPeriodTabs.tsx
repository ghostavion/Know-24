"use client";

import { cn } from "@/lib/utils";

const PERIODS = [
  { label: "7 days", value: "7d" },
  { label: "30 days", value: "30d" },
  { label: "90 days", value: "90d" },
  { label: "1 year", value: "1y" },
];

interface AnalyticsPeriodTabsProps {
  active: string;
  onChange: (period: string) => void;
}

export const AnalyticsPeriodTabs = ({
  active,
  onChange,
}: AnalyticsPeriodTabsProps) => {
  return (
    <div className="flex gap-1 rounded-lg border border-border bg-muted/50 p-1">
      {PERIODS.map((p) => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className={cn(
            "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
            active === p.value
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
};
