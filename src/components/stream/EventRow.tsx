"use client";

import { motion } from "framer-motion";
import {
  Zap,
  DollarSign,
  AlertTriangle,
  AlertOctagon,
  Skull,
  Lock,
  TrendingUp,
} from "lucide-react";
import type { AgentEvent } from "@/hooks/useAgentStream";

interface EventRowProps {
  event: AgentEvent;
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function EventRow({ event }: EventRowProps) {
  const { type, timestamp, data } = event;

  // --- ACTION events ---
  if (type === "action") {
    const isStrategy = data.strategy_change === true;
    return (
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.97 }}
        animate={{
          opacity: 1,
          y: 0,
          scale: isStrategy ? [1, 1.02, 1] : 1,
        }}
        transition={{
          duration: 0.3,
          scale: isStrategy
            ? { duration: 0.3, times: [0, 0.5, 1] }
            : undefined,
        }}
        className={`flex items-start gap-3 rounded-lg px-3 py-2.5 ${
          isStrategy
            ? "bg-amber-warm/10 ring-1 ring-amber-warm/30"
            : "hover:bg-white/5"
        }`}
      >
        <div
          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
            isStrategy ? "bg-amber-warm/20" : "bg-violet-electric/10"
          }`}
        >
          {isStrategy ? (
            <TrendingUp className="h-3.5 w-3.5 text-amber-warm" />
          ) : (
            <Zap className="h-3.5 w-3.5 text-violet-electric" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={`leading-snug ${
              isStrategy
                ? "text-sm font-semibold text-amber-warm"
                : "text-sm text-foreground/80"
            }`}
          >
            {data.message || "Action performed"}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatTime(timestamp)}
          </p>
        </div>
      </motion.div>
    );
  }

  // --- REVENUE events ---
  if (type === "revenue") {
    const amount = data.amount ?? 0;
    const isPositive = amount > 0;
    const isIrreversible = data.irreversible === true;

    return (
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.97 }}
        animate={{
          opacity: 1,
          y: 0,
          x: isIrreversible ? [0, -3, 3, -2, 2, 0] : 0,
        }}
        transition={{
          duration: 0.3,
          x: isIrreversible ? { duration: 0.2, delay: 0.1 } : undefined,
        }}
        className={`flex items-start gap-3 rounded-lg px-3 py-2.5 ${
          isIrreversible
            ? "ring-1 ring-coral-neon/40 bg-coral-neon/5"
            : isPositive
              ? "bg-emerald-500/5"
              : "bg-coral-neon/5"
        }`}
      >
        <motion.div
          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
            isPositive ? "bg-emerald-500/15" : "bg-coral-neon/15"
          }`}
          animate={
            isPositive
              ? { backgroundColor: ["rgba(16,185,129,0.15)", "rgba(16,185,129,0.3)", "rgba(16,185,129,0.15)"] }
              : { backgroundColor: ["rgba(255,77,109,0.15)", "rgba(255,77,109,0.3)", "rgba(255,77,109,0.15)"] }
          }
          transition={{ duration: 0.6 }}
        >
          {isIrreversible ? (
            <Lock className="h-3.5 w-3.5 text-coral-neon" />
          ) : (
            <DollarSign
              className={`h-3.5 w-3.5 ${isPositive ? "text-emerald-500" : "text-coral-neon"}`}
            />
          )}
        </motion.div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm text-foreground/80">
              {data.message || (isPositive ? "Revenue earned" : "Spend")}
            </p>
            <span
              className={`tabular-nums text-sm font-semibold ${
                isPositive ? "text-emerald-500" : "text-coral-neon"
              }`}
            >
              {isPositive ? "+" : ""}${Math.abs(amount).toFixed(2)}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatTime(timestamp)}
            {isIrreversible && (
              <span className="ml-2 font-medium text-coral-neon">
                IRREVERSIBLE
              </span>
            )}
          </p>
        </div>
      </motion.div>
    );
  }

  // --- ERROR events ---
  if (type === "error") {
    const severity = data.severity ?? "warning";

    const ERROR_CONFIGS = {
      warning: {
        bg: "bg-amber-warm/5",
        ring: "",
        icon: AlertTriangle,
        iconColor: "text-amber-warm",
        iconBg: "bg-amber-warm/15",
      },
      critical: {
        bg: "bg-coral-neon/5",
        ring: "",
        icon: AlertOctagon,
        iconColor: "text-coral-neon",
        iconBg: "bg-coral-neon/15",
      },
      fatal: {
        bg: "bg-red-950/20",
        ring: "ring-1 ring-red-500/50",
        icon: Skull,
        iconColor: "text-red-500",
        iconBg: "bg-red-500/15",
      },
    } as const;

    const config = ERROR_CONFIGS[severity as keyof typeof ERROR_CONFIGS] ?? ERROR_CONFIGS.warning;

    const Icon = config.icon;

    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        className={`flex items-start gap-3 rounded-lg px-3 py-2.5 ${config.bg} ${config.ring}`}
      >
        <motion.div
          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${config.iconBg}`}
          animate={
            severity === "critical" || severity === "fatal"
              ? { scale: [1, 1.1, 1] }
              : {}
          }
          transition={
            severity === "critical" || severity === "fatal"
              ? { duration: 1.5, repeat: Infinity }
              : {}
          }
        >
          <Icon className={`h-3.5 w-3.5 ${config.iconColor}`} />
        </motion.div>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-foreground/80">
            {data.message || "Error occurred"}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatTime(timestamp)}
            <span
              className={`ml-2 font-medium uppercase ${config.iconColor}`}
            >
              {severity}
            </span>
          </p>
        </div>
      </motion.div>
    );
  }

  // Fallback for unknown types
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 px-3 py-2.5"
    >
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted">
        <Zap className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm text-foreground/80">
          {data.message || "Unknown event"}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {formatTime(timestamp)}
        </p>
      </div>
    </motion.div>
  );
}

