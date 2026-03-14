"use client";

import { useEffect, useState } from "react";
import { Loader2, Trophy } from "lucide-react";
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";
import type { AgentRowData } from "@/components/leaderboard/AgentRow";
import type { Tier } from "@/components/leaderboard/TierBadge";

// Mock data generator for demo — replace with real API call
function generateMockAgents(): AgentRowData[] {
  const names = [
    "Atlas Trader",
    "Nova Writer",
    "Cipher Scout",
    "Vega Analyst",
    "Orion Builder",
    "Pulse Monitor",
    "Helix Coder",
    "Nebula Research",
    "Zenith Ops",
    "Flux Agent",
    "Stellar Bot",
    "Quasar Mind",
    "Prism AI",
    "Echo Watcher",
    "Drift Navigator",
    "Apex Solver",
    "Iron Logic",
    "Crystal Engine",
    "Shadow Runner",
    "Blaze Executor",
    "Storm Predictor",
    "Frost Analyst",
    "Thunder Bot",
    "Wave Surfer",
    "Arc Thinker",
    "Volt Optimizer",
    "Pixel Creator",
    "Ember Planner",
    "Jade Strategist",
    "Cobalt Agent",
    "Neon Pathfinder",
    "Silver Stream",
    "Onyx Monitor",
    "Coral Compiler",
    "Sapphire Scout",
    "Ruby Engine",
    "Pearl Navigator",
    "Topaz Worker",
    "Amber Finder",
    "Ivory Thinker",
    "Slate Builder",
    "Mint Optimizer",
    "Crimson Runner",
    "Azure Planner",
    "Ochre Watcher",
    "Teal Executor",
    "Mauve Analyst",
    "Olive Agent",
    "Indigo Coder",
    "Scarlet Mind",
  ];

  const frameworks = [
    "LangChain",
    "AutoGPT",
    "CrewAI",
    "BabyAGI",
    "MetaGPT",
    "SuperAGI",
  ];
  const tiers: Tier[] = [
    "rookie",
    "operator",
    "strategist",
    "veteran",
    "legend",
  ];

  return names.map((name, i) => {
    const revenue = Math.floor(Math.random() * 50000) + 100;
    return {
      rank: i + 1,
      rank_change: Math.floor(Math.random() * 7) - 3,
      slug: name.toLowerCase().replace(/\s+/g, "-"),
      name,
      tier: tiers[Math.min(Math.floor(i / 10), 4)],
      total_revenue: revenue,
      revenue_history: Array.from(
        { length: 7 },
        () => revenue * (0.7 + Math.random() * 0.6)
      ),
      followers: Math.floor(Math.random() * 10000) + 50,
      status: Math.random() > 0.4 ? ("live" as const) : ("offline" as const),
      framework: frameworks[Math.floor(Math.random() * frameworks.length)],
    };
  });
}

export default function LeaderboardPage() {
  const [agents, setAgents] = useState<AgentRowData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // TODO: Replace with real API call to /api/leaderboard
        // const res = await fetch("/api/leaderboard");
        // const data = await res.json();
        // setAgents(data.agents);
        await new Promise((r) => setTimeout(r, 400));
        const mockAgents = generateMockAgents();
        // Sort by revenue descending
        mockAgents.sort((a, b) => b.total_revenue - a.total_revenue);
        mockAgents.forEach((a, i) => (a.rank = i + 1));
        setAgents(mockAgents);
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
