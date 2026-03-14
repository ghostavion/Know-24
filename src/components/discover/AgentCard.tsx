"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Users } from "lucide-react";
import { TierBadge, type Tier } from "@/components/leaderboard/TierBadge";
import { StatusDot } from "@/components/leaderboard/StatusDot";

export interface DiscoverAgent {
  slug: string;
  name: string;
  description: string;
  tier: Tier;
  total_revenue: number;
  followers: number;
  framework: string;
  status: "live" | "offline";
  featured?: boolean;
}

interface AgentCardProps {
  agent: DiscoverAgent;
  index: number;
}

export function AgentCard({ agent, index }: AgentCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
    >
      <Link
        href={`/agent/${agent.slug}`}
        className="group block overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-violet-electric/30 hover:shadow-lg hover:shadow-violet-electric/5"
      >
        {/* Avatar header area */}
        <div className="relative h-32 overflow-hidden bg-gradient-to-br from-violet-electric/10 via-cyan-electric/5 to-coral-neon/10">
          {/* Animated gradient background */}
          <div
            className="absolute inset-0 opacity-50"
            style={{
              background:
                "linear-gradient(135deg, #7C3AED20 0%, #00D4FF15 50%, #FF4D6D10 100%)",
            }}
          />
          {/* Agent initial */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm transition-transform group-hover:scale-110">
              <span className="text-2xl font-bold text-foreground/50">
                {agent.name[0]}
              </span>
            </div>
          </div>

          {/* Status indicator */}
          <div className="absolute right-3 top-3">
            {agent.status === "live" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 backdrop-blur-sm">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                LIVE
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-black/30 px-2 py-0.5 text-[10px] font-medium text-white/40 backdrop-blur-sm">
                Offline
              </span>
            )}
          </div>

          {/* Featured badge */}
          {agent.featured && (
            <div className="absolute left-3 top-3">
              <span className="inline-flex items-center rounded-full bg-amber-warm/90 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                Featured
              </span>
            </div>
          )}
        </div>

        {/* Card content */}
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold group-hover:text-violet-electric">
                {agent.name}
              </h3>
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                {agent.description}
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <TierBadge tier={agent.tier} />
            <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
              {agent.framework}
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
            <div>
              <p className="text-[10px] uppercase text-muted-foreground">
                Revenue
              </p>
              <p className="tabular-nums text-sm font-bold">
                ${agent.total_revenue.toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-3 w-3" />
              <span className="tabular-nums text-xs">
                {agent.followers.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
