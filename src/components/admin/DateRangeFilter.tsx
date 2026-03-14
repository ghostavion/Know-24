"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const PRESETS = [
  { label: "1h", value: "1h" },
  { label: "6h", value: "6h" },
  { label: "24h", value: "24h" },
  { label: "7d", value: "7d" },
  { label: "30d", value: "30d" },
];

interface DateRangeFilterProps {
  basePath: string;
}

export const DateRangeFilter = ({ basePath }: DateRangeFilterProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeRange = searchParams.get("range") ?? "24h";

  const handlePreset = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", value);
    params.delete("startDate");
    params.delete("endDate");
    params.set("page", "1");
    router.push(`${basePath}?${params.toString()}`);
  };

  const handleCustomDate = (key: "startDate" | "endDate", value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    params.delete("range");
    params.set("page", "1");
    router.push(`${basePath}?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRESETS.map((p) => (
        <button
          key={p.value}
          onClick={() => handlePreset(p.value)}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            activeRange === p.value
              ? "bg-[#7C3AED]/10 text-[#7C3AED]"
              : "text-muted-foreground hover:bg-accent"
          )}
        >
          {p.label}
        </button>
      ))}
      <div className="flex items-center gap-1 text-xs">
        <input
          type="date"
          className="rounded border border-border bg-background px-2 py-1 text-xs"
          value={searchParams.get("startDate") ?? ""}
          onChange={(e) => handleCustomDate("startDate", e.target.value)}
        />
        <span className="text-muted-foreground">to</span>
        <input
          type="date"
          className="rounded border border-border bg-background px-2 py-1 text-xs"
          value={searchParams.get("endDate") ?? ""}
          onChange={(e) => handleCustomDate("endDate", e.target.value)}
        />
      </div>
    </div>
  );
};
