"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import {
  Loader2,
  PieChart,
  TrendingUp,
  TrendingDown,
  Eye,
  Trophy,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createAuthenticatedBrowserClient } from "@/lib/supabase/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Stake {
  id: string;
  user_id: string;
  agent_id: string;
  pct_owned: number;
  purchase_price_cents: number;
  current_value_cents: number;
  purchased_at: string;
  agent?: {
    name: string;
    slug: string;
    status: string;
    tier: string;
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function daysSince(date: string): number {
  return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
}

const STREAK_MILESTONES = [
  { days: 365, label: "1 Year", color: "bg-yellow-500 text-white" },
  { days: 90, label: "90d", color: "bg-purple-500 text-white" },
  { days: 60, label: "60d", color: "bg-blue-500 text-white" },
  { days: 30, label: "30d", color: "bg-green-500 text-white" },
  { days: 7, label: "7d", color: "bg-orange-500 text-white" },
];

function getStreakMilestone(purchasedAt: string) {
  const days = daysSince(purchasedAt);
  for (const milestone of STREAK_MILESTONES) {
    if (days >= milestone.days) return milestone;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function PortfolioPage() {
  const { getToken } = useAuth();
  const [stakes, setStakes] = useState<Stake[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const supabase = await createAuthenticatedBrowserClient(getToken);

        // Fetch stakes with agent info
        const { data, error } = await supabase
          .from("stakes")
          .select(
            `
            id, user_id, agent_id, pct_owned, purchase_price_cents, current_value_cents, purchased_at,
            agents!inner(name, slug, status, tier)
          `
          )
          .order("purchased_at", { ascending: false });

        if (error) throw error;

        // Flatten the joined data
        const mapped = (data ?? []).map((row: Record<string, unknown>) => ({
          ...row,
          agent: row.agents as Stake["agent"],
        })) as Stake[];

        setStakes(mapped);
      } catch (err) {
        console.error("[portfolio] Load failed:", err);
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

  const totalValue = stakes.reduce((sum, s) => sum + s.current_value_cents, 0);
  const totalCost = stakes.reduce((sum, s) => sum + s.purchase_price_cents, 0);
  const totalPnL = totalValue - totalCost;
  const pnlPercent = totalCost > 0 ? ((totalPnL / totalCost) * 100).toFixed(1) : "0.0";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Stake Portfolio</h1>
        <p className="text-sm text-muted-foreground">
          {stakes.length} stake{stakes.length !== 1 ? "s" : ""} across{" "}
          {new Set(stakes.map((s) => s.agent_id)).size} agent
          {new Set(stakes.map((s) => s.agent_id)).size !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/10">
              <PieChart className="size-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Portfolio Value</p>
              <p className="text-2xl font-semibold tracking-tight">{formatCents(totalValue)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-green-500/10">
              <TrendingUp className="size-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Invested</p>
              <p className="text-2xl font-semibold tracking-tight">{formatCents(totalCost)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-3">
            <div
              className={`flex size-10 items-center justify-center rounded-lg ${
                totalPnL >= 0 ? "bg-green-500/10" : "bg-red-500/10"
              }`}
            >
              {totalPnL >= 0 ? (
                <TrendingUp className="size-5 text-green-600" />
              ) : (
                <TrendingDown className="size-5 text-red-600" />
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total P&L</p>
              <p
                className={`text-2xl font-semibold tracking-tight ${
                  totalPnL >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {totalPnL >= 0 ? "+" : ""}
                {formatCents(totalPnL)}{" "}
                <span className="text-sm font-normal">({pnlPercent}%)</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stakes List */}
      {stakes.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-primary/20 bg-primary/5 p-12 text-center">
          <PieChart className="mx-auto size-12 text-muted-foreground/40" />
          <h3 className="mt-4 text-lg font-semibold">No stakes yet</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Buy fractional ownership in AI agents to earn a share of their revenue.
            Browse the marketplace to find high-performing agents.
          </p>
          <div className="mt-6">
            <Link href="/discover">
              <Button>Browse Marketplace</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {stakes.map((stake) => {
            const pnl = stake.current_value_cents - stake.purchase_price_cents;
            const pnlPct =
              stake.purchase_price_cents > 0
                ? ((pnl / stake.purchase_price_cents) * 100).toFixed(1)
                : "0.0";
            const milestone = getStreakMilestone(stake.purchased_at);
            const days = daysSince(stake.purchased_at);

            return (
              <div
                key={stake.id}
                className="flex items-center gap-4 rounded-xl border bg-card p-5 transition-colors hover:border-primary/30"
              >
                {/* Agent Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold truncate">
                      {stake.agent?.name ?? "Unknown Agent"}
                    </h3>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                        stake.agent?.status === "running"
                          ? "bg-green-500/10 text-green-600"
                          : "bg-gray-500/10 text-gray-600"
                      }`}
                    >
                      {stake.agent?.status ?? "offline"}
                    </span>
                    {stake.agent?.tier && (
                      <span className="shrink-0 rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs font-medium capitalize text-yellow-600">
                        {stake.agent.tier}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {stake.pct_owned}% ownership | Held for {days} day{days !== 1 ? "s" : ""}
                  </p>
                </div>

                {/* Streak Milestone */}
                {milestone && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div
                      className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${milestone.color}`}
                    >
                      {milestone.days >= 365 ? (
                        <Trophy className="size-3" />
                      ) : (
                        <Flame className="size-3" />
                      )}
                      {milestone.label}
                    </div>
                  </div>
                )}

                {/* Financial */}
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold">{formatCents(stake.current_value_cents)}</p>
                  <p className="text-xs text-muted-foreground">
                    Cost: {formatCents(stake.purchase_price_cents)}
                  </p>
                  <p
                    className={`text-xs font-medium ${
                      pnl >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {pnl >= 0 ? "+" : ""}
                    {formatCents(pnl)} ({pnlPct}%)
                  </p>
                </div>

                {/* Action */}
                <Link href={`/watch/${stake.agent?.slug ?? ""}`} className="shrink-0">
                  <Button variant="outline" size="sm">
                    <Eye className="size-3" />
                    View
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
