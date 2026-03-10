export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  Users,
  Building2,
  Package,
  ShoppingCart,
  DollarSign,
  Globe,
  BrainCircuit,
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
    usersTotal,
    usersRecent,
    businessesTotal,
    businessesActive,
    businessesRecent,
    productsTotal,
    ordersTotal,
    ordersRevenue,
    storefrontsTotal,
    llmCallsResult,
    recentErrorsResult,
  ] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo),
    supabase.from("businesses").select("*", { count: "exact", head: true }),
    supabase
      .from("businesses")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("businesses")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo),
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase
      .from("orders")
      .select("amount_cents")
      .eq("status", "completed"),
    supabase.from("storefronts").select("*", { count: "exact", head: true }),
    supabase
      .from("platform_logs")
      .select("*", { count: "exact", head: true })
      .eq("event_category", "LLM")
      .gte("timestamp", sevenDaysAgo),
    supabase
      .from("platform_logs")
      .select("id, timestamp, event_type, error_message, status")
      .eq("status", "error")
      .order("timestamp", { ascending: false })
      .limit(5),
  ]);

  const totalRevenueCents = (ordersRevenue.data ?? []).reduce(
    (sum: number, row: { amount_cents: number }) =>
      sum + (row.amount_cents ?? 0),
    0
  );

  const stats: StatCardProps[] = [
    {
      label: "Total Users",
      value: usersTotal.count ?? 0,
      subtitle: `+${usersRecent.count ?? 0} last 7 days`,
      icon: Users,
    },
    {
      label: "Total Businesses",
      value: businessesTotal.count ?? 0,
      subtitle: `+${businessesRecent.count ?? 0} last 7 days`,
      icon: Building2,
    },
    {
      label: "Active Businesses",
      value: businessesActive.count ?? 0,
      subtitle: `of ${businessesTotal.count ?? 0} total`,
      icon: Building2,
    },
    {
      label: "Total Products",
      value: productsTotal.count ?? 0,
      subtitle: "across all businesses",
      icon: Package,
    },
    {
      label: "Total Orders",
      value: ordersTotal.count ?? 0,
      subtitle: "all time",
      icon: ShoppingCart,
    },
    {
      label: "Total Revenue",
      value: formatCurrency(totalRevenueCents),
      subtitle: "from completed orders",
      icon: DollarSign,
    },
    {
      label: "Storefronts",
      value: storefrontsTotal.count ?? 0,
      subtitle: "published storefronts",
      icon: Globe,
    },
    {
      label: "LLM Calls (7d)",
      value: llmCallsResult.count ?? 0,
      subtitle: "AI API calls this week",
      icon: BrainCircuit,
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
          Real-time metrics across the Know24 platform.
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
          { label: "Analytics", href: "/admin/analytics", desc: "Revenue & growth" },
          { label: "LLM Usage", href: "/admin/llm", desc: "Token costs & trends" },
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
