"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Reaction {
  emoji: string;
  label: string;
  count: number;
}

const INITIAL_REACTIONS: Reaction[] = [
  { emoji: "\uD83D\uDD25", label: "fire", count: 0 },
  { emoji: "\uD83E\uDD26", label: "facepalm", count: 0 },
  { emoji: "\uD83D\uDCB0", label: "money", count: 0 },
  { emoji: "\uD83D\uDC40", label: "eyes", count: 0 },
];

interface ReactionBarProps {
  agentSlug: string;
  /** The event ID to react to. If not provided, reactions are local-only. */
  eventId?: string;
}

export function ReactionBar({ agentSlug, eventId }: ReactionBarProps) {
  const [reactions, setReactions] = useState<Reaction[]>(INITIAL_REACTIONS);
  const [recentlyClicked, setRecentlyClicked] = useState<string | null>(null);

  const handleReact = useCallback(
    async (label: string) => {
      // Optimistic UI update
      setReactions((prev) =>
        prev.map((r) =>
          r.label === label ? { ...r, count: r.count + 1 } : r
        )
      );
      setRecentlyClicked(label);
      setTimeout(() => setRecentlyClicked(null), 600);

      // Persist to API if we have an event ID
      if (eventId) {
        try {
          const res = await fetch(`/api/agents/${agentSlug}/reactions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ event_id: eventId, reaction: label }),
          });

          if (!res.ok) {
            // Revert on failure
            setReactions((prev) =>
              prev.map((r) =>
                r.label === label ? { ...r, count: Math.max(0, r.count - 1) } : r
              )
            );
          }
        } catch {
          // Revert on network error
          setReactions((prev) =>
            prev.map((r) =>
              r.label === label ? { ...r, count: Math.max(0, r.count - 1) } : r
            )
          );
        }
      }
    },
    [agentSlug, eventId]
  );

  return (
    <div className="flex items-center gap-2 p-4">
      {reactions.map((reaction) => (
        <motion.button
          key={reaction.label}
          onClick={() => handleReact(reaction.label)}
          className="group relative flex flex-1 flex-col items-center gap-1 rounded-xl border border-border bg-card px-3 py-2.5 transition-colors hover:border-violet-electric/30 hover:bg-violet-electric/5"
          whileTap={{ scale: 0.92 }}
        >
          <AnimatePresence>
            {recentlyClicked === reaction.label && (
              <motion.span
                key="burst"
                className="absolute -top-2 text-lg"
                initial={{ opacity: 1, y: 0, scale: 0.5 }}
                animate={{ opacity: 0, y: -20, scale: 1.2 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                {reaction.emoji}
              </motion.span>
            )}
          </AnimatePresence>
          <span className="text-xl">{reaction.emoji}</span>
          <span className="tabular-nums text-[10px] font-medium text-muted-foreground">
            {reaction.count > 0 ? reaction.count.toLocaleString() : "\u00B7"}
          </span>
        </motion.button>
      ))}
    </div>
  );
}
