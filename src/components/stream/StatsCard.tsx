"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock, Cpu, DollarSign, Users, Wallet } from "lucide-react";
import { useEarningsTicker } from "@/hooks/useEarningsTicker";
import type { AgentStatus } from "@/hooks/useAgentStream";

interface StatsCardProps {
  status: AgentStatus;
}

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function StatsCard({ status }: StatsCardProps) {
  const earnings = useEarningsTicker(status.earnings_total);
  const [liveUptime, setLiveUptime] = useState(status.uptime);

  // Tick uptime every second when agent is live
  useEffect(() => {
    setLiveUptime(status.uptime);
    if (status.status !== "live") return;

    const interval = setInterval(() => {
      setLiveUptime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [status.uptime, status.status]);

  const budgetPercent =
    status.initial_budget > 0
      ? (status.budget_left / status.initial_budget) * 100
      : 0;
  const isNearDeath = budgetPercent < 10 && budgetPercent > 0;

  return (
    <div className="space-y-4 p-4">
      {/* Earnings */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <Wallet className="h-3.5 w-3.5" />
          Earnings
        </div>
        <p className="mt-2 tabular-nums text-3xl font-bold tracking-tight text-emerald-500">
          ${earnings.toFixed(2)}
        </p>
      </div>

      {/* Uptime */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          Uptime
        </div>
        <p className="mt-2 tabular-nums text-xl font-semibold">
          {formatUptime(liveUptime)}
        </p>
      </div>

      {/* Budget */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <DollarSign className="h-3.5 w-3.5" />
            Budget Left
          </div>
          <span
            className={`tabular-nums text-xs font-semibold ${
              isNearDeath ? "text-coral-neon" : "text-muted-foreground"
            }`}
          >
            {budgetPercent.toFixed(0)}%
          </span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
          <motion.div
            className={`h-full rounded-full ${
              isNearDeath
                ? "bg-coral-neon"
                : budgetPercent < 30
                  ? "bg-amber-warm"
                  : "bg-violet-electric"
            }`}
            animate={{ width: `${budgetPercent}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        <p className="mt-1.5 tabular-nums text-sm font-medium">
          ${status.budget_left.toFixed(2)}{" "}
          <span className="text-muted-foreground">
            / ${status.initial_budget.toFixed(2)}
          </span>
        </p>
      </div>

      {/* Framework */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <Cpu className="h-3.5 w-3.5" />
          Framework
        </div>
        <p className="mt-2 text-sm font-semibold capitalize">
          {status.framework}
        </p>
      </div>

      {/* Followers */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          Followers
        </div>
        <p className="mt-2 tabular-nums text-xl font-semibold">
          {status.followers.toLocaleString()}
        </p>
      </div>
    </div>
  );
}

