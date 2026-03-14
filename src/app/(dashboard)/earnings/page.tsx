"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  DollarSign,
  Loader2,
  TrendingUp,
  Calendar,
  Link as LinkIcon,
  ExternalLink,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createAuthenticatedBrowserClient } from "@/lib/supabase/client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface AgentEarning {
  agent_id: string;
  agent_name: string;
  agent_slug: string;
  total_revenue_cents: number;
}

interface DailyRevenue {
  date: string;
  revenue_cents: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatChartDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function EarningsPage() {
  const { getToken } = useAuth();
  const [agentEarnings, setAgentEarnings] = useState<AgentEarning[]>([]);
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenue[]>([]);
  const [stripeConnected, setStripeConnected] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectingStripe, setConnectingStripe] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const supabase = await createAuthenticatedBrowserClient(getToken);

        // Load agents owned by user with revenue
        const { data: agents, error: agentsErr } = await supabase
          .from("agents")
          .select("id, name, slug, total_revenue_cents")
          .neq("status", "deleted")
          .order("total_revenue_cents", { ascending: false });

        if (agentsErr) throw agentsErr;

        const mapped: AgentEarning[] = (agents ?? []).map((a: Record<string, unknown>) => ({
          agent_id: a.id as string,
          agent_name: a.name as string,
          agent_slug: a.slug as string,
          total_revenue_cents: (a.total_revenue_cents as number) ?? 0,
        }));
        setAgentEarnings(mapped);

        // Load daily stats (last 30 days) across all agents
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const agentIds = mapped.map((a) => a.agent_id);
        if (agentIds.length > 0) {
          const { data: stats, error: statsErr } = await supabase
            .from("agent_stats")
            .select("period_start, revenue_cents")
            .in("agent_id", agentIds)
            .eq("period", "daily")
            .gte("period_start", thirtyDaysAgo.toISOString())
            .order("period_start", { ascending: true });

          if (statsErr) throw statsErr;

          // Aggregate by date
          const byDate = new Map<string, number>();
          for (const row of stats ?? []) {
            const date = (row.period_start as string).slice(0, 10);
            byDate.set(date, (byDate.get(date) ?? 0) + ((row.revenue_cents as number) ?? 0));
          }

          const chartData: DailyRevenue[] = [];
          for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toISOString().slice(0, 10);
            chartData.push({ date: key, revenue_cents: byDate.get(key) ?? 0 });
          }
          setDailyRevenue(chartData);
        }

        // Check Stripe connect status
        try {
          const res = await fetch("/api/stripe/connect");
          if (res.ok) {
            const json = await res.json();
            setStripeConnected(json.data?.connected ?? false);
          }
        } catch {
          setStripeConnected(false);
        }
      } catch (err) {
        console.error("[earnings] Load failed:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [getToken]);

  const totalEarnings = useMemo(
    () => agentEarnings.reduce((sum, a) => sum + a.total_revenue_cents, 0),
    [agentEarnings]
  );

  const todayRevenue = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return dailyRevenue.find((d) => d.date === today)?.revenue_cents ?? 0;
  }, [dailyRevenue]);

  const thisMonthRevenue = useMemo(() => {
    const month = new Date().toISOString().slice(0, 7);
    return dailyRevenue
      .filter((d) => d.date.startsWith(month))
      .reduce((sum, d) => sum + d.revenue_cents, 0);
  }, [dailyRevenue]);

  async function connectStripe() {
    setConnectingStripe(true);
    try {
      const res = await fetch("/api/stripe/connect", { method: "POST" });
      if (res.ok) {
        const json = await res.json();
        if (json.data?.url) {
          window.location.href = json.data.url;
          return;
        }
      }
      alert("Failed to start Stripe Connect onboarding");
    } catch (err) {
      console.error("[earnings] Stripe connect failed:", err);
      alert("Failed to connect Stripe");
    } finally {
      setConnectingStripe(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Creator Earnings</h1>
        <p className="text-sm text-muted-foreground">Revenue from your AI agents</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-green-500/10">
              <DollarSign className="size-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Earnings</p>
              <p className="text-2xl font-semibold tracking-tight">{formatCents(totalEarnings)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/10">
              <Calendar className="size-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">This Month</p>
              <p className="text-2xl font-semibold tracking-tight">
                {formatCents(thisMonthRevenue)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-purple-500/10">
              <TrendingUp className="size-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Today</p>
              <p className="text-2xl font-semibold tracking-tight">{formatCents(todayRevenue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="rounded-xl border bg-card p-5">
        <h2 className="mb-4 font-semibold">Revenue (Last 30 Days)</h2>
        {dailyRevenue.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyRevenue}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatChartDate}
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                />
                <YAxis
                  tickFormatter={(v: number) => `$${(v / 100).toFixed(0)}`}
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                />
                <Tooltip
                  formatter={(value: unknown) => [formatCents(value as number), "Revenue"]}
                  labelFormatter={(label: unknown) =>
                    new Date(String(label)).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue_cents"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            No revenue data yet. Deploy an agent to start earning.
          </div>
        )}
      </div>

      {/* Per-Agent Breakdown */}
      <div className="rounded-xl border bg-card">
        <div className="border-b px-5 py-4">
          <h2 className="font-semibold">Per-Agent Breakdown</h2>
        </div>
        {agentEarnings.length === 0 ? (
          <div className="p-8 text-center">
            <DollarSign className="mx-auto size-8 text-muted-foreground/30" />
            <p className="mt-2 text-sm text-muted-foreground">No agents yet</p>
          </div>
        ) : (
          <div className="divide-y">
            {agentEarnings.map((agent) => (
              <div
                key={agent.agent_id}
                className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-muted/50"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{agent.agent_name}</p>
                  <p className="text-xs text-muted-foreground">/{agent.agent_slug}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold">
                    {formatCents(agent.total_revenue_cents)}
                  </span>
                  {totalEarnings > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {((agent.total_revenue_cents / totalEarnings) * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stripe Connect */}
      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-indigo-500/10">
              <LinkIcon className="size-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="font-semibold">Stripe Connect</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                {stripeConnected === true ? (
                  <>
                    <CheckCircle2 className="size-3.5 text-green-500" />
                    <span className="text-xs text-green-600 font-medium">Connected</span>
                  </>
                ) : stripeConnected === false ? (
                  <>
                    <XCircle className="size-3.5 text-red-500" />
                    <span className="text-xs text-red-600 font-medium">Not connected</span>
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground">Checking...</span>
                )}
              </div>
            </div>
          </div>

          {stripeConnected === false && (
            <Button onClick={connectStripe} disabled={connectingStripe}>
              {connectingStripe ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ExternalLink className="size-4" />
              )}
              Connect Stripe
            </Button>
          )}
        </div>

        {stripeConnected === false && (
          <p className="mt-3 text-sm text-muted-foreground">
            Connect your Stripe account to receive payouts from agent revenue and marketplace sales.
          </p>
        )}
      </div>
    </div>
  );
}
