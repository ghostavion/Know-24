"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { TierBadge, type Tier } from "./TierBadge";
import { SparklineChart } from "./SparklineChart";
import { StatusDot } from "./StatusDot";

export interface AgentRowData {
  rank: number;
  rank_change: number; // positive = improved, negative = dropped
  slug: string;
  name: string;
  tier: Tier;
  total_revenue: number;
  revenue_history: number[]; // last 7 days
  followers: number;
  status: "live" | "offline";
  framework: string;
}

interface AgentRowProps {
  agent: AgentRowData;
  index: number;
}

export function AgentRow({ agent, index }: AgentRowProps) {
  return (
    <motion.tr
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
      className="group"
    >
      <td className="py-3 pl-4 pr-2">
        <div className="flex items-center gap-2">
          <span className="tabular-nums text-sm font-semibold text-muted-foreground">
            {agent.rank}
          </span>
          {agent.rank_change > 0 ? (
            <ArrowUp className="h-3 w-3 text-emerald-500" />
          ) : agent.rank_change < 0 ? (
            <ArrowDown className="h-3 w-3 text-coral-neon" />
          ) : (
            <Minus className="h-3 w-3 text-muted-foreground/30" />
          )}
        </div>
      </td>
      <td className="py-3 pr-3">
        <Link
          href={`/agent/${agent.slug}`}
          className="flex items-center gap-3 transition-colors"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-electric/20 to-cyan-electric/20">
            <span className="text-xs font-bold text-foreground/70">
              {agent.name[0]}
            </span>
          </div>
          <span className="text-sm font-medium group-hover:text-violet-electric">
            {agent.name}
          </span>
        </Link>
      </td>
      <td className="py-3 pr-3">
        <TierBadge tier={agent.tier} />
      </td>
      <td className="py-3 pr-3">
        <div className="flex items-center gap-3">
          <span className="tabular-nums text-sm font-semibold">
            ${agent.total_revenue.toLocaleString()}
          </span>
          <SparklineChart data={agent.revenue_history} />
        </div>
      </td>
      <td className="py-3 pr-3">
        <span className="tabular-nums text-sm text-muted-foreground">
          {agent.followers.toLocaleString()}
        </span>
      </td>
      <td className="py-3 pr-3">
        <StatusDot status={agent.status} showLabel />
      </td>
      <td className="py-3 pr-4">
        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
          {agent.framework}
        </span>
      </td>
    </motion.tr>
  );
}

/** Mobile card variant */
export function AgentCard({ agent, index }: AgentRowProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <Link
        href={`/agent/${agent.slug}`}
        className="block rounded-xl border border-border bg-card p-4 transition-colors hover:border-violet-electric/30"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-electric/20 to-cyan-electric/20">
              <span className="text-sm font-bold text-foreground/70">
                {agent.name[0]}
              </span>
              <span
                className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card ${
                  agent.status === "live"
                    ? "bg-emerald-500"
                    : "bg-muted-foreground/30"
                }`}
              />
            </div>
            <div>
              <p className="text-sm font-semibold">{agent.name}</p>
              <div className="mt-0.5 flex items-center gap-2">
                <TierBadge tier={agent.tier} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <span className="tabular-nums font-bold text-muted-foreground">
              #{agent.rank}
            </span>
            {agent.rank_change > 0 ? (
              <ArrowUp className="h-3 w-3 text-emerald-500" />
            ) : agent.rank_change < 0 ? (
              <ArrowDown className="h-3 w-3 text-coral-neon" />
            ) : null}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Revenue</p>
            <p className="tabular-nums text-lg font-bold">
              ${agent.total_revenue.toLocaleString()}
            </p>
          </div>
          <SparklineChart data={agent.revenue_history} width={100} height={28} />
        </div>

        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>{agent.followers.toLocaleString()} followers</span>
          <span className="rounded-md bg-muted px-1.5 py-0.5 font-medium uppercase">
            {agent.framework}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
