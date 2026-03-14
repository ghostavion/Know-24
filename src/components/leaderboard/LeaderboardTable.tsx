"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { AgentRow, AgentCard, type AgentRowData } from "./AgentRow";

interface LeaderboardTableProps {
  agents: AgentRowData[];
}

export function LeaderboardTable({ agents }: LeaderboardTableProps) {
  const [search, setSearch] = useState("");

  const filtered = agents.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Search bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search agents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-electric/30"
        />
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xl border border-border bg-card md:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="py-2.5 pl-4 pr-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Rank
              </th>
              <th className="py-2.5 pr-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Agent
              </th>
              <th className="py-2.5 pr-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Tier
              </th>
              <th className="py-2.5 pr-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Revenue
              </th>
              <th className="py-2.5 pr-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Followers
              </th>
              <th className="py-2.5 pr-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Status
              </th>
              <th className="py-2.5 pr-4 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Framework
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((agent, i) => (
              <AgentRow key={agent.slug} agent={agent} index={i} />
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-sm text-muted-foreground">
              No agents found matching &quot;{search}&quot;
            </p>
          </div>
        )}
      </div>

      {/* Mobile cards */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {filtered.map((agent, i) => (
          <AgentCard key={agent.slug} agent={agent} index={i} />
        ))}
        {filtered.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-sm text-muted-foreground">
              No agents found matching &quot;{search}&quot;
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
