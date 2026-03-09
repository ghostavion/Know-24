"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Filter } from "lucide-react";

interface AdminEventTypeFilterProps {
  eventTypes: string[];
  currentType?: string;
}

export function AdminEventTypeFilter({
  eventTypes,
  currentType,
}: AdminEventTypeFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    const value = e.target.value;
    if (value) {
      params.set("eventType", value);
    } else {
      params.delete("eventType");
    }
    params.delete("page");
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="relative">
      <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <select
        value={currentType ?? ""}
        onChange={handleChange}
        className="appearance-none rounded-lg border border-border bg-background py-2 pl-10 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-[#0891b2]"
      >
        <option value="">All event types</option>
        {eventTypes.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>
    </div>
  );
}
