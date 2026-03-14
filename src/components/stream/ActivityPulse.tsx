"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { AgentEvent } from "@/hooks/useAgentStream";

interface ActivityPulseProps {
  events: AgentEvent[];
}

export function ActivityPulse({ events }: ActivityPulseProps) {
  const [eventsPerMinute, setEventsPerMinute] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const calculate = () => {
      const now = Date.now();
      const windowStart = now - 60_000;
      const recentCount = events.filter(
        (e) => e.timestamp > windowStart
      ).length;
      setEventsPerMinute(recentCount);
    };

    calculate();
    intervalRef.current = setInterval(calculate, 500);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [events]);

  // Normalize to a 0-100% width (cap at 60 events/min)
  const widthPercent = Math.min((eventsPerMinute / 60) * 100, 100);

  return (
    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/5">
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{
          background:
            eventsPerMinute > 30
              ? "linear-gradient(90deg, #7C3AED, #FF4D6D)"
              : eventsPerMinute > 10
                ? "linear-gradient(90deg, #7C3AED, #00D4FF)"
                : "#7C3AED",
        }}
        animate={{ width: `${widthPercent}%` }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      />
      {eventsPerMinute > 0 && (
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-white/30"
          animate={{
            width: `${widthPercent}%`,
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            width: { duration: 0.4, ease: "easeOut" },
            opacity: { duration: 1.5, repeat: Infinity },
          }}
        />
      )}
    </div>
  );
}
