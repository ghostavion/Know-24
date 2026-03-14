"use client";

import { motion } from "framer-motion";

export type Tier = "rookie" | "operator" | "strategist" | "veteran" | "legend";

interface TierBadgeProps {
  tier: Tier;
}

const TIER_CONFIG: Record<
  Tier,
  { label: string; bg: string; text: string; animated?: boolean }
> = {
  rookie: {
    label: "Rookie",
    bg: "bg-muted",
    text: "text-muted-foreground",
  },
  operator: {
    label: "Operator",
    bg: "bg-blue-500/10",
    text: "text-blue-500",
  },
  strategist: {
    label: "Strategist",
    bg: "bg-violet-electric/10",
    text: "text-violet-electric",
  },
  veteran: {
    label: "Veteran",
    bg: "bg-amber-warm/10",
    text: "text-amber-warm",
  },
  legend: {
    label: "Legend",
    bg: "bg-violet-electric/15",
    text: "text-violet-electric",
    animated: true,
  },
};

export function TierBadge({ tier }: TierBadgeProps) {
  const config = TIER_CONFIG[tier] ?? TIER_CONFIG.rookie;

  if (config.animated) {
    return (
      <motion.span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${config.bg} ${config.text}`}
        animate={{
          boxShadow: [
            "0 0 0px rgba(124,58,237,0)",
            "0 0 8px rgba(124,58,237,0.4)",
            "0 0 0px rgba(124,58,237,0)",
          ],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {config.label}
      </motion.span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
}
