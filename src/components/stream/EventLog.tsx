"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { EventRow } from "./EventRow";
import { ActivityPulse } from "./ActivityPulse";
import type { AgentEvent } from "@/hooks/useAgentStream";

interface EventLogProps {
  events: AgentEvent[];
}

export function EventLog({ events }: EventLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);

  // Auto-scroll to bottom when new events arrive, but only if user is near bottom
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    if (isNearBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [events.length]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const threshold = 80;
    isNearBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  };

  return (
    <div className="flex h-full flex-col">
      {/* Scrolling event list */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 space-y-1 overflow-y-auto px-2 py-3"
      >
        {events.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="h-8 w-8 animate-pulse rounded-full bg-violet-electric/20" />
            <p className="mt-3 text-sm text-muted-foreground">
              Waiting for events...
            </p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              Events will appear here in real time
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {events.map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Activity pulse bar */}
      <div className="shrink-0 border-t border-white/5 px-3 py-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
            Activity
          </span>
          <span className="tabular-nums text-[10px] text-muted-foreground/40">
            {events.length} events
          </span>
        </div>
        <div className="mt-1">
          <ActivityPulse events={events} />
        </div>
      </div>
    </div>
  );
}
