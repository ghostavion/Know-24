"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { DateRangeFilter } from "./DateRangeFilter";
import type { EventCategory, LogStatus } from "@/types/admin-logs";

const CATEGORIES: EventCategory[] = [
  "AUTH", "USER_ACTION", "UI", "DATA", "LLM", "API", "ERROR", "SYSTEM", "SECURITY",
];

const STATUSES: LogStatus[] = ["success", "failure", "error", "warning", "info"];

interface LogsFiltersProps {
  basePath: string;
}

export const LogsFilters = ({ basePath }: LogsFiltersProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    router.push(`${basePath}?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4">
      <DateRangeFilter basePath={basePath} />
      <select
        className="rounded-md border border-border bg-background px-3 py-1.5 text-xs"
        value={searchParams.get("eventCategory") ?? ""}
        onChange={(e) => updateParam("eventCategory", e.target.value)}
      >
        <option value="">All Categories</option>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <select
        className="rounded-md border border-border bg-background px-3 py-1.5 text-xs"
        value={searchParams.get("status") ?? ""}
        onChange={(e) => updateParam("status", e.target.value)}
      >
        <option value="">All Statuses</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      <input
        type="text"
        placeholder="Search events..."
        className="rounded-md border border-border bg-background px-3 py-1.5 text-xs"
        defaultValue={searchParams.get("search") ?? ""}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            updateParam("search", e.currentTarget.value);
          }
        }}
      />
    </div>
  );
};
