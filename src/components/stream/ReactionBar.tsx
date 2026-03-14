"use client";

import { useState } from "react";
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

export function ReactionBar() {
  const [reactions, setReactions] = useState<Reaction[]>(INITIAL_REACTIONS);
  const [recentlyClicked, setRecentlyClicked] = useState<string | null>(null);

  const handleReact = (label: string) => {
    setReactions((prev) =>
      prev.map((r) =>
        r.label === label ? { ...r, count: r.count + 1 } : r
      )
    );
    setRecentlyClicked(label);
    setTimeout(() => setRecentlyClicked(null), 600);
  };

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
