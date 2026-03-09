"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnalyticsPeriodTabs } from "@/components/admin/AnalyticsPeriodTabs";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { BrainCircuit, Coins, Clock, Hash } from "lucide-react";

interface LLMUsageData {
  summary: {
    totalCalls: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalCostUsd: number;
    avgLatencyMs: number;
  };
  topUsers: Array<{
    userId: string;
    email: string;
    callCount: number;
    totalTokens: number;
    totalCostUsd: number;
  }>;
  dailyBreakdown: Array<{
    date: string;
    callCount: number;
    totalTokens: number;
    totalCostUsd: number;
  }>;
  byFeature: Array<{
    feature: string;
    callCount: number;
    totalCostUsd: number;
  }>;
}

export default function LLMUsagePage() {
  const [period, setPeriod] = useState("30d");

  const { data, isLoading } = useQuery<LLMUsageData>({
    queryKey: ["admin-llm-usage", period],
    queryFn: async () => {
      const res = await fetch(`/api/admin/llm-usage?period=${period}`);
      const json = await res.json();
      return json.data;
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">LLM Usage</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            AI token consumption, costs, and performance.
          </p>
        </div>
        <AnalyticsPeriodTabs active={period} onChange={setPeriod} />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl border border-border bg-muted/50" />
          ))}
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              label="Total LLM Calls"
              value={data.summary.totalCalls.toLocaleString()}
              icon={BrainCircuit}
            />
            <SummaryCard
              label="Total Tokens"
              value={(data.summary.totalInputTokens + data.summary.totalOutputTokens).toLocaleString()}
              icon={Hash}
            />
            <SummaryCard
              label="Estimated Cost"
              value={`$${data.summary.totalCostUsd.toFixed(2)}`}
              icon={Coins}
            />
            <SummaryCard
              label="Avg Latency"
              value={`${Math.round(data.summary.avgLatencyMs)}ms`}
              icon={Clock}
            />
          </div>

          {/* Cost trend */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-4 text-base font-semibold text-foreground">Daily Cost</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data.dailyBreakdown.map((d) => ({
                    ...d,
                    label: new Date(d.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `$${v.toFixed(2)}`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: unknown) => [`$${Number(value).toFixed(4)}`, "Cost"]}
                  />
                  <Line type="monotone" dataKey="totalCostUsd" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top users + by feature */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="mb-4 text-base font-semibold text-foreground">Top Users by Cost</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">User</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">Calls</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">Tokens</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.topUsers.map((u) => (
                      <tr key={u.userId}>
                        <td className="max-w-[160px] truncate px-3 py-2 text-foreground">{u.email}</td>
                        <td className="px-3 py-2 text-right text-muted-foreground">{u.callCount}</td>
                        <td className="px-3 py-2 text-right text-muted-foreground">{u.totalTokens.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right text-muted-foreground">${u.totalCostUsd.toFixed(4)}</td>
                      </tr>
                    ))}
                    {data.topUsers.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">No data yet</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="mb-4 text-base font-semibold text-foreground">By Feature</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Feature</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">Calls</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.byFeature.map((f) => (
                      <tr key={f.feature}>
                        <td className="px-3 py-2 font-mono text-xs text-foreground">{f.feature}</td>
                        <td className="px-3 py-2 text-right text-muted-foreground">{f.callCount}</td>
                        <td className="px-3 py-2 text-right text-muted-foreground">${f.totalCostUsd.toFixed(4)}</td>
                      </tr>
                    ))}
                    {data.byFeature.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-3 py-8 text-center text-muted-foreground">No data yet</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      ) : (
        <p className="text-muted-foreground">Failed to load LLM usage data.</p>
      )}
    </div>
  );
}

interface SummaryCardProps {
  label: string;
  value: string;
  icon: React.ElementType;
}

function SummaryCard({ label, value, icon: Icon }: SummaryCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
    </div>
  );
}
