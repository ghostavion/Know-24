export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  Users,
  CreditCard,
  DollarSign,
  Bot,
  Radio,
  Activity,
  Store,
  TrendingUp,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { createServiceClient } from "@/lib/supabase/server";
import { AdminHealthPanel } from "@/components/admin/AdminHealthPanel";
import TestLoggingButton from "@/components/admin/TestLoggingButton";

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
}

function StatCard({ label, value, subtitle, icon: Icon }: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default async function AdminOverviewPage() {
  const supabase = createServiceClient();
  const sevenDaysAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000
  ).toISOString();

  const [
    totalUsersResult,
    activeSubscribersResult,
    totalAgentsResult,
    liveAgentsResult,
    totalEventsResult,
    marketplaceItemsResult,
    platformRevenueResult,
    recentErrorsResult,
  ] = await Promise.all([
    supabase
      .from("user_profiles")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("agent_subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("agents")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("agents")
      .select("*", { count: "exact", head: true })
      .eq("status", "running"),
    supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo),
    supabase
      .from("marketplace_items")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("agent_daily_stats")
      .select("revenue_cents"),
    supabase
      .from("platform_logs")
      .select("id, timestamp, event_type, error_message, status")
      .eq("status", "error")
      .order("timestamp", { ascending: false })
      .limit(5),
  ]);

  const activeSubCount = activeSubscribersResult.count ?? 0;
  const mrrCents = activeSubCount * 99 * 100; // $99 per subscriber in cents

  const totalPlatformRevenueCents = (platformRevenueResult.data ?? []).reduce(
    (sum: number, row: { revenue_cents: number }) =>
      sum + (row.revenue_cents ?? 0),
    0
  );

  const stats: StatCardProps[] = [
    {
      label: "Total Users",
      value: totalUsersResult.count ?? 0,
      subtitle: "registered user profiles",
      icon: Users,
    },
    {
      label: "Active Subscribers",
      value: activeSubCount,
      subtitle: `of ${totalUsersResult.count ?? 0} total users`,
      icon: CreditCard,
    },
    {
      label: "MRR",
      value: formatCurrency(mrrCents),
      subtitle: `${activeSubCount} subscribers x $99/mo`,
      icon: DollarSign,
    },
    {
      label: "Total Agents",
      value: totalAgentsResult.count ?? 0,
      subtitle: "agents created",
      icon: Bot,
    },
    {
      label: "Live Agents",
      value: liveAgentsResult.count ?? 0,
      subtitle: `of ${totalAgentsResult.count ?? 0} total agents`,
      icon: Radio,
    },
    {
      label: "Total Agent Events (7d)",
      value: totalEventsResult.count ?? 0,
      subtitle: "events in last 7 days",
      icon: Activity,
    },
    {
      label: "Marketplace Items",
      value: marketplaceItemsResult.count ?? 0,
      subtitle: "listed in marketplace",
      icon: Store,
    },
    {
      label: "Platform Revenue",
      value: formatCurrency(totalPlatformRevenueCents),
      subtitle: "from agent daily stats",
      icon: TrendingUp,
    },
  ];

  const recentErrors = (recentErrorsResult.data ?? []) as Array<{
    id: string;
    timestamp: string;
    event_type: string;
    error_message: string | null;
    status: string;
  }>;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">
          Platform Overview
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Real-time metrics across the AgentTV platform.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold text-foreground">
          Service Health
        </h3>
        <AdminHealthPanel />
      </div>

      {/* Recent errors */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Recent Errors
          </h3>
          <Link
            href="/admin/logs?status=error"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {recentErrors.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No recent errors</p>
        ) : (
          <div className="space-y-2">
            {recentErrors.map((err) => (
              <div
                key={err.id}
                className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900/30 dark:bg-red-900/10"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{err.event_type}</p>
                  {err.error_message && (
                    <p className="mt-0.5 text-xs text-muted-foreground truncate">{err.error_message}</p>
                  )}
                </div>
                <span className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(err.timestamp).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Logging diagnostic */}
      <TestLoggingButton />

      {/* Quick links */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Platform Logs", href: "/admin/logs", desc: "Browse all events" },
          { label: "Agent Management", href: "/admin/agents", desc: "Manage & monitor agents" },
          { label: "Subscriptions", href: "/admin/subscriptions", desc: "Billing & plans" },
          { label: "Live Feed", href: "/admin/feed", desc: "Real-time stream" },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group rounded-xl border border-border bg-card p-4 transition-colors hover:bg-accent"
          >
            <p className="text-sm font-semibold text-foreground group-hover:text-foreground">{link.label}</p>
            <p className="mt-1 text-xs text-muted-foreground">{link.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
