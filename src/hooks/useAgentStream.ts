"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface AgentEvent {
  id: string;
  type: "action" | "revenue" | "status" | "error";
  timestamp: number;
  data: {
    message?: string;
    amount?: number;
    strategy_change?: boolean;
    irreversible?: boolean;
    severity?: "warning" | "critical" | "fatal";
    status?: string;
    budget_left?: number;
    initial_budget?: number;
    uptime?: number;
    framework?: string;
    earnings_total?: number;
    followers?: number;
    first_revenue?: boolean;
    [key: string]: unknown;
  };
}

export interface AgentStatus {
  status: string;
  budget_left: number;
  initial_budget: number;
  uptime: number;
  framework: string;
  earnings_total: number;
  followers: number;
}

const DEFAULT_STATUS: AgentStatus = {
  status: "offline",
  budget_left: 0,
  initial_budget: 100,
  uptime: 0,
  framework: "unknown",
  earnings_total: 0,
  followers: 0,
};

export function useAgentStream(agentId: string) {
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [latestStatus, setLatestStatus] = useState<AgentStatus>(DEFAULT_STATUS);
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabaseRef = useRef(createBrowserClient());

  const handleEvent = useCallback((payload: { new: AgentEvent }) => {
    const event = payload.new;

    if (event.type === "status") {
      setLatestStatus((prev) => ({
        ...prev,
        ...(event.data.status && { status: event.data.status }),
        ...(event.data.budget_left !== undefined && {
          budget_left: event.data.budget_left,
        }),
        ...(event.data.initial_budget !== undefined && {
          initial_budget: event.data.initial_budget,
        }),
        ...(event.data.uptime !== undefined && { uptime: event.data.uptime }),
        ...(event.data.framework && { framework: event.data.framework }),
        ...(event.data.earnings_total !== undefined && {
          earnings_total: event.data.earnings_total,
        }),
        ...(event.data.followers !== undefined && {
          followers: event.data.followers,
        }),
      }));
      return; // Status events don't go into the event log
    }

    setEvents((prev) => [...prev, event]);
  }, []);

  useEffect(() => {
    if (!agentId) return;

    const supabase = supabaseRef.current;
    const channel = supabase
      .channel(`agent:${agentId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "agent_events",
          filter: `agent_id=eq.${agentId}`,
        },
        handleEvent
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [agentId, handleEvent]);

  return { events, latestStatus, isConnected };
}
