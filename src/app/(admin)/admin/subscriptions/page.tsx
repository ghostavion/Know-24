export const dynamic = "force-dynamic";

import { requireAdmin } from "@/lib/admin/guard";
import { createServiceClient } from "@/lib/supabase/server";
import {
  CreditCard,
  Users,
  TrendingUp,
  UserMinus,
} from "lucide-react";

interface SubscriptionRow {
  user_id: string;
  tier: string;
  status: string;
  stripe_subscription_id: string | null;
  price_cents: number;
  current_period_start: string | null;
  created_at: string;
  updated_at: string;
}

const statusStyles: Record<string, string> = {
  active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  inactive: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  canceled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  past_due: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
};

export default async function AdminSubscriptionsPage() {
  await requireAdmin();

  const supabase = createServiceClient();

  const { data: rows } = await supabase
    .from("agent_subscriptions")
    .select(
      "user_id, tier, status, stripe_subscription_id, price_cents, current_period_start, created_at, updated_at"
    )
    .order("created_at", { ascending: false });

  const subscriptions = (rows ?? []) as SubscriptionRow[];

  const totalSubscribers = subscriptions.length;
  const activeSubscriptions = subscriptions.filter(
    (s) => s.status === "active"
  );
  const activeCount = activeSubscriptions.length;
  const mrr = activeCount * 99;
  const canceledCount = subscriptions.filter(
    (s) => s.status === "canceled"
  ).length;

  const kpis = [
    {
      label: "Total Subscribers",
      value: totalSubscribers.toLocaleString(),
      icon: Users,
    },
    {
      label: "Active Subscribers",
      value: activeCount.toLocaleString(),
      icon: TrendingUp,
    },
    {
      label: "MRR",
      value: `$${mrr.toLocaleString()}`,
      icon: CreditCard,
    },
    {
      label: "Churn (Canceled)",
      value: canceledCount.toLocaleString(),
      icon: UserMinus,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <CreditCard className="h-5 w-5 text-[#7C3AED]" />
        <h2 className="text-2xl font-semibold text-foreground">
          Subscriptions
        </h2>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-xl border border-border bg-card p-5"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#7C3AED]/10">
                <kpi.icon className="h-5 w-5 text-[#7C3AED]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{kpi.label}</p>
                <p className="text-xl font-semibold text-foreground">
                  {kpi.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  User ID
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Tier
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Stripe Sub ID
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Price
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Period Start
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {subscriptions.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No subscriptions found.
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub, idx) => (
                  <tr
                    key={`${sub.user_id}-${sub.stripe_subscription_id ?? idx}`}
                    className="transition-colors hover:bg-muted/30"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-foreground">
                      {sub.user_id.slice(0, 12)}...
                    </td>
                    <td className="px-4 py-3 text-foreground capitalize">
                      {sub.tier}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          statusStyles[sub.status] ??
                          "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                        }`}
                      >
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {sub.stripe_subscription_id
                        ? `${sub.stripe_subscription_id.slice(0, 20)}...`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      ${(sub.price_cents / 100).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {sub.current_period_start
                        ? new Date(sub.current_period_start).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric", year: "numeric" }
                          )
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(sub.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
