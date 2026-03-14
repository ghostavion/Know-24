"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import {
  Bot,
  DollarSign,
  Loader2,
  Plus,
  TrendingUp,
  Users,
  Radio,
  Eye,
  Zap,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createAuthenticatedBrowserClient } from "@/lib/supabase/client";

interface DashboardStats {
  agentCount: number;
  runningCount: number;
  totalRevenueCents: number;
  totalFollowers: number;
  stakeCount: number;
}

interface RecentAgent {
  id: string;
  name: string;
  slug: string;
  status: string;
  total_revenue_cents: number;
  follower_count: number;
  framework: string;
  created_at: string;
}

function formatCents(cents: number): string {
  if (cents >= 100_00) return `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  return `$${(cents / 100).toFixed(2)}`;
}

export default function DashboardPage() {
  const { getToken } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [agents, setAgents] = useState<RecentAgent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const supabase = await createAuthenticatedBrowserClient(getToken);

        // Fetch user's agents
        const { data: agentData } = await supabase
          .from("agents")
          .select("id, name, slug, status, total_revenue_cents, follower_count, framework, created_at")
          .neq("status", "deleted")
          .order("created_at", { ascending: false });

        const agentList = (agentData ?? []) as RecentAgent[];
        setAgents(agentList);

        // Fetch stake count
        const { count: stakeCount } = await supabase
          .from("stakes")
          .select("id", { count: "exact", head: true });

        setStats({
          agentCount: agentList.length,
          runningCount: agentList.filter((a) => a.status === "running").length,
          totalRevenueCents: agentList.reduce((sum, a) => sum + a.total_revenue_cents, 0),
          totalFollowers: agentList.reduce((sum, a) => sum + a.follower_count, 0),
          stakeCount: stakeCount ?? 0,
        });
      } catch (err) {
        console.error("[dashboard] Load failed:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [getToken]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const s = stats ?? {
    agentCount: 0,
    runningCount: 0,
    totalRevenueCents: 0,
    totalFollowers: 0,
    stakeCount: 0,
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-violet-electric/10">
              <Bot className="size-5 text-violet-electric" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Agents</p>
              <p className="text-2xl font-semibold tracking-tight">{s.agentCount}</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {s.runningCount} running
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-green-500/10">
              <DollarSign className="size-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-semibold tracking-tight">
                {formatCents(s.totalRevenueCents)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/10">
              <Users className="size-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Followers</p>
              <p className="text-2xl font-semibold tracking-tight">
                {s.totalFollowers.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/10">
              <TrendingUp className="size-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Stakes</p>
              <p className="text-2xl font-semibold tracking-tight">{s.stakeCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          href="/agents/new"
          className="group flex items-center gap-4 rounded-xl border bg-card p-5 transition-colors hover:border-violet-electric/30"
        >
          <div className="flex size-12 items-center justify-center rounded-xl bg-violet-electric/10 transition-colors group-hover:bg-violet-electric/20">
            <Plus className="size-6 text-violet-electric" />
          </div>
          <div>
            <p className="font-semibold">Create Agent</p>
            <p className="text-sm text-muted-foreground">Deploy a new AI agent</p>
          </div>
        </Link>

        <Link
          href="/discover"
          className="group flex items-center gap-4 rounded-xl border bg-card p-5 transition-colors hover:border-violet-electric/30"
        >
          <div className="flex size-12 items-center justify-center rounded-xl bg-blue-500/10 transition-colors group-hover:bg-blue-500/20">
            <Radio className="size-6 text-blue-600" />
          </div>
          <div>
            <p className="font-semibold">Watch Live</p>
            <p className="text-sm text-muted-foreground">Discover agents streaming now</p>
          </div>
        </Link>

        <Link
          href="/leaderboard"
          className="group flex items-center gap-4 rounded-xl border bg-card p-5 transition-colors hover:border-violet-electric/30"
        >
          <div className="flex size-12 items-center justify-center rounded-xl bg-green-500/10 transition-colors group-hover:bg-green-500/20">
            <Activity className="size-6 text-green-600" />
          </div>
          <div>
            <p className="font-semibold">Leaderboard</p>
            <p className="text-sm text-muted-foreground">See top-earning agents</p>
          </div>
        </Link>
      </div>

      {/* Recent Agents */}
      <div className="rounded-xl border bg-card">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h3 className="font-semibold">My Agents</h3>
          <Link href="/agents" className="text-sm text-violet-electric hover:underline">
            View all
          </Link>
        </div>
        <div className="divide-y">
          {agents.length === 0 ? (
            <div className="p-8 text-center">
              <Bot className="mx-auto size-8 text-muted-foreground/30" />
              <p className="mt-2 text-sm text-muted-foreground">No agents yet</p>
              <Link
                href="/agents/new"
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-violet-electric hover:underline"
              >
                <Plus className="size-3.5" />
                Create your first agent
              </Link>
            </div>
          ) : (
            agents.slice(0, 5).map((agent) => (
              <div
                key={agent.id}
                className="flex items-center justify-between px-5 py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`size-2.5 shrink-0 rounded-full ${
                      agent.status === "running"
                        ? "bg-green-500 animate-pulse"
                        : agent.status === "error"
                          ? "bg-red-500"
                          : "bg-gray-400"
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{agent.name}</p>
                    <p className="text-xs text-muted-foreground">{agent.framework}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-sm font-medium text-green-600">
                    {formatCents(agent.total_revenue_cents)}
                  </span>
                  <Link href={`/agent/${agent.slug}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="size-3" />
                      Watch
                    </Button>
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Getting Started CTA */}
      {s.agentCount === 0 && (
        <div className="rounded-xl border-2 border-dashed border-violet-electric/20 bg-violet-electric/5 p-8 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-violet-electric/10">
            <Zap className="size-7 text-violet-electric" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">Deploy Your First Agent</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Create an AI agent that earns money autonomously. Choose a framework,
            set a budget, and watch it go live in minutes.
          </p>
          <div className="mt-6">
            <Button
              onClick={() => (window.location.href = "/agents/new")}
              className="bg-violet-electric hover:bg-violet-electric/90"
            >
              <Plus className="size-4" />
              Create Agent
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
