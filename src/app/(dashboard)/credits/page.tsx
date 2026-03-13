"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Coins,
  ArrowDown,
  ArrowUp,
  RotateCcw,
  Clock,
  BookOpen,
  Search,
  ImageIcon,
  Sparkles,
  Mic,
  Radar,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CreditBalance {
  balance: number;
  monthlyAllocation: number;
  resetDate: string;
  costs: Record<string, number>;
  history?: TransactionEntry[];
}

interface TransactionEntry {
  id: string;
  amount: number;
  balanceAfter: number;
  type: string;
  action: string | null;
  createdAt: string;
}

const actionIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  research_report: Search,
  ebook_generation: BookOpen,
  cover_generation: ImageIcon,
  scout_scan: Radar,
  chapter_rewrite: Sparkles,
  voice_transcription: Mic,
};

const actionLabels: Record<string, string> = {
  research_report: "Niche Research",
  ebook_generation: "Ebook Generation",
  cover_generation: "Cover Generation",
  scout_scan: "Scout Scan",
  chapter_rewrite: "Chapter Rewrite",
  voice_transcription: "Voice Transcription",
};

const typeLabels: Record<string, string> = {
  monthly_reset: "Monthly Reset",
  generation: "Used",
  purchase: "Purchased",
  referral_reward: "Referral Reward",
  refund: "Refund",
  bonus: "Bonus",
};

export default function CreditsPage() {
  const [data, setData] = useState<CreditBalance | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCredits = useCallback(async () => {
    try {
      const res = await fetch("/api/credits?history=true&limit=100");
      const json = await res.json();
      if (json.data) setData(json.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  if (loading || !data) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Credits</h1>
        <div className="animate-pulse space-y-4">
          <div className="h-32 rounded-xl bg-muted" />
          <div className="h-48 rounded-xl bg-muted" />
        </div>
      </div>
    );
  }

  const daysUntilReset = Math.max(
    0,
    Math.ceil((new Date(data.resetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );
  const usedPercent = Math.round(((data.monthlyAllocation - data.balance) / data.monthlyAllocation) * 100);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Credits</h1>

      {/* Balance Card */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Current Balance</p>
            <p className="mt-1 text-4xl font-bold tracking-tight">{data.balance}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              of {data.monthlyAllocation} monthly credits
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Coins className="size-6 text-primary" />
          </div>
        </div>

        {/* Usage bar */}
        <div className="mt-4 space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{usedPercent}% used</span>
            <span className="flex items-center gap-1">
              <RotateCcw className="size-3" />
              Resets in {daysUntilReset} days
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                usedPercent > 80 ? "bg-destructive" : usedPercent > 50 ? "bg-yellow-500" : "bg-primary"
              )}
              style={{ width: `${usedPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Cost Table */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Credit Costs
        </h2>
        <div className="space-y-3">
          {Object.entries(data.costs).map(([action, cost]) => {
            const Icon = actionIcons[action] ?? Coins;
            return (
              <div key={action} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Icon className="size-4 text-muted-foreground" />
                  <span className="text-sm">{actionLabels[action] ?? action}</span>
                </div>
                <span className="text-sm font-semibold">{cost} credits</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Transaction History */}
      {data.history && data.history.length > 0 && (
        <div className="rounded-xl border bg-card p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Transaction History
          </h2>
          <div className="space-y-3">
            {data.history.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between border-b border-border/50 pb-3 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full",
                    tx.amount > 0 ? "bg-green-500/10" : "bg-muted"
                  )}>
                    {tx.amount > 0 ? (
                      <ArrowUp className="size-4 text-green-600" />
                    ) : (
                      <ArrowDown className="size-4 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {tx.action ? actionLabels[tx.action] ?? tx.action : typeLabels[tx.type] ?? tx.type}
                    </p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="size-3" />
                      {new Date(tx.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn("text-sm font-semibold", tx.amount > 0 ? "text-green-600" : "text-foreground")}>
                    {tx.amount > 0 ? "+" : ""}{tx.amount}
                  </p>
                  <p className="text-xs text-muted-foreground">bal: {tx.balanceAfter}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
