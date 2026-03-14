"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  Activity,
  BarChart3,
  DollarSign,
  Loader2,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { createAuthenticatedBrowserClient } from "@/lib/supabase/client";

interface DailyMetric {
  date: string;
  revenue_cents: number;
  actions_count: number;
  follower_count: number;
}

interface AgentOverview {
  id: string;
  name: string;
  slug: string;
  status: string;
  tier: string;
  total_revenue_cents: number;
  follower_count: number;
  framework: string;
}

type TimeRange = "7d" | "30d" | "90d";

function formatCents(cents: number): string {
  if (cents >= 100_00) return `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function BarChartSimple({ data, valueKey, color }: { data: DailyMetric[]; valueKey: keyof DailyMetric; color: string }) {
  const max = Math.max(...data.map((d) => Number(d[valueKey]) || 1), 1);
  return (
    <div className="flex items-end gap-1 h-32">
      {data.map((d) => {
        const val = Number(d[valueKey]) || 0;
        const pct = Math.max((val / max) * 100, 2);
        return (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative">
            <div className="absolute -top-8 hidden group-hover:block rounded bg-foreground text-background text-[10px] px-1.5 py-0.5 whitespace-nowrap z-10">
              {valueKey === "revenue_cents" ? formatCents(val) : val.toLocaleString()} — {formatDate(d.date)}
            </div>
            <div
              className="w-full rounded-t transition-all"
              style={{ height: `${pct}%`, backgroundColor: color, minHeight: "2px" }}
            />
          </div>
        );
      })}
    </div>
  );
}

export default function AnalyticsPage() {
  const { getToken } = useAuth();
  const [agents, setAgents] = useState<AgentOverview[]>([]);
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [selectedAgent, setSelectedAgent] = useState<string>("all");

  useEffect(() => {
    async function load() {
      try {
        const supabase = await createAuthenticatedBrowserClient(getToken);

        const { data: agentData } = await supabase
          .from("agents")
          .select("id, name, slug, status, tier, total_revenue_cents, follower_count, framework")
          .neq("status", "deleted")
          .order("total_revenue_cents", { ascending: false });

        const agentList = (agentData ?? []) as AgentOverview[];
        setAgents(agentList);

        if (agentList.length > 0) {
          const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
          const since = new Date();
          since.setDate(since.getDate() - days);

          let query = supabase
            .from("agent_daily_stats")
            .select("agent_id, date, revenue_cents, actions_count, follower_count")
            .gte("date", since.toISOString().split("T")[0])
            .order("date", { ascending: true });

          if (selectedAgent !== "all") {
            query = query.eq("agent_id", selectedAgent);
          } else {
            query = query.in("agent_id", agentList.map((a) => a.id));
          }

          const { data: statsData } = await query;

          // Aggregate by date
          const byDate = new Map<string, DailyMetric>();
          for (const row of (statsData ?? []) as Array<{ date: string; revenue_cents: number; actions_count: number; follower_count: number }>) {
            const existing = byDate.get(row.date);
            if (existing) {
              existing.revenue_cents += row.revenue_cents;
              existing.actions_count += row.actions_count;
              existing.follower_count = Math.max(existing.follower_count, row.follower_count);
            } else {
              byDate.set(row.date, { ...row });
            }
          }
          setDailyMetrics(Array.from(byDate.values()));
        }
      } catch (err) {
        console.error("[analytics] Load failed:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [getToken, timeRange, selectedAgent]);

  const totals = useMemo(() => {
    const totalRevenue = dailyMetrics.reduce((s, d) => s + d.revenue_cents, 0);
    const totalActions = dailyMetrics.reduce((s, d) => s + d.actions_count, 0);
    const latestFollowers = dailyMetrics.length > 0 ? dailyMetrics[dailyMetrics.length - 1].follower_count : 0;
    const avgDailyRevenue = dailyMetrics.length > 0 ? Math.round(totalRevenue / dailyMetrics.length) : 0;
    return { totalRevenue, totalActions, latestFollowers, avgDailyRevenue };
  }, [dailyMetrics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-bold tracking-tight">Analytics</h2>
        <div className="flex items-center gap-3">
          <select
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-electric/30"
          >
            <option value="all">All Agents</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          <div className="flex rounded-lg border border-border">
            {(["7d", "30d", "90d"] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 text-sm transition-colors ${
                  timeRange === range
                    ? "bg-violet-electric/10 text-violet-electric"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-green-500/10">
              <DollarSign className="size-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Period Revenue</p>
              <p className="text-2xl font-semibold tracking-tight">{formatCents(totals.totalRevenue)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-violet-electric/10">
              <TrendingUp className="size-5 text-violet-electric" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Daily Revenue</p>
              <p className="text-2xl font-semibold tracking-tight">{formatCents(totals.avgDailyRevenue)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/10">
              <Zap className="size-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Actions</p>
              <p className="text-2xl font-semibold tracking-tight">{totals.totalActions.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/10">
              <Users className="size-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Followers</p>
              <p className="text-2xl font-semibold tracking-tight">{totals.latestFollowers.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      {dailyMetrics.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border bg-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <DollarSign className="size-4 text-green-600" />
              <h3 className="text-sm font-semibold">Revenue</h3>
            </div>
            <BarChartSimple data={dailyMetrics} valueKey="revenue_cents" color="#22c55e" />
            <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
              <span>{formatDate(dailyMetrics[0].date)}</span>
              <span>{formatDate(dailyMetrics[dailyMetrics.length - 1].date)}</span>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <Activity className="size-4 text-blue-600" />
              <h3 className="text-sm font-semibold">Actions</h3>
            </div>
            <BarChartSimple data={dailyMetrics} valueKey="actions_count" color="#3b82f6" />
            <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
              <span>{formatDate(dailyMetrics[0].date)}</span>
              <span>{formatDate(dailyMetrics[dailyMetrics.length - 1].date)}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border bg-card py-16 text-center">
          <BarChart3 className="mx-auto size-12 text-muted-foreground/30" />
          <p className="mt-4 text-lg font-medium text-muted-foreground">No data yet</p>
          <p className="mt-1 text-sm text-muted-foreground/60">
            Deploy and run agents to see analytics here
          </p>
        </div>
      )}

      {/* Per-Agent Breakdown */}
      {agents.length > 0 && (
        <div className="rounded-xl border bg-card">
          <div className="border-b px-5 py-4">
            <h3 className="font-semibold">Agent Performance</h3>
          </div>
          <div className="divide-y">
            {agents.map((agent) => (
              <div key={agent.id} className="flex items-center justify-between px-5 py-3">
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
                    <p className="text-xs text-muted-foreground">
                      {agent.framework} · {agent.tier}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-600">
                      {formatCents(agent.total_revenue_cents)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {agent.follower_count} followers
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
