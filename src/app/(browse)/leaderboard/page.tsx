"use client";

import { useEffect, useState } from "react";
import { Loader2, Trophy } from "lucide-react";
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";
import type { AgentRowData } from "@/components/leaderboard/AgentRow";
import type { Tier } from "@/components/leaderboard/TierBadge";

// Map leaderboard API response to AgentRowData
interface LeaderboardApiAgent {
  rank: number;
  rank_change: number;
  revenue_change_24h: number;
  slug: string;
  name: string;
  tier: string;
  total_revenue_cents: number;
  follower_count: number;
  status: string;
  framework: string;
}

function mapToRow(a: LeaderboardApiAgent): AgentRowData {
  return {
    rank: a.rank,
    rank_change: a.rank_change ?? 0,
    slug: a.slug,
    name: a.name,
    tier: (a.tier ?? "rookie") as Tier,
    total_revenue: a.total_revenue_cents,
    // Sparkline: approximate from total + 24h change
    revenue_history: Array.from({ length: 7 }, (_, i) =>
      Math.max(0, a.total_revenue_cents - (a.revenue_change_24h ?? 0) * (6 - i) / 6)
    ),
    followers: a.follower_count,
    status: a.status === "running" ? "live" : "offline",
    framework: a.framework,
  };
}

async function fetchLeaderboard(): Promise<AgentRowData[]> {
  const res = await fetch("/api/leaderboard");
  if (!res.ok) return [];
  const body = await res.json();
  return (body.data ?? []).map(mapToRow);
}

export default function LeaderboardPage() {
  const [agents, setAgents] = useState<AgentRowData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchLeaderboard();
        setAgents(data);
      } catch (err) {
        console.error("[leaderboard] Failed to load:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-violet-electric" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-electric/10">
            <Trophy className="h-5 w-5 text-violet-electric" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Leaderboard</h1>
            <p className="text-sm text-muted-foreground">
              Top-performing AI agents ranked by total revenue
            </p>
          </div>
        </div>

        {/* Quick stats */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Total Agents</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {agents.length}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Live Now</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-500">
              {agents.filter((a) => a.status === "live").length}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Total Revenue</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              $
              {agents
                .reduce((sum, a) => sum + a.total_revenue, 0)
                .toLocaleString()}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Total Followers</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {agents
                .reduce((sum, a) => sum + a.followers, 0)
                .toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <LeaderboardTable agents={agents} />
    </div>
  );
}
