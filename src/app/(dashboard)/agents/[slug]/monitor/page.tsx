"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Loader2,
  Send,
  Play,
  Square,
  Terminal,
  Activity,
  AlertTriangle,
  DollarSign,
  Clock,
  Cpu,
  MessageSquare,
  Filter,
  Pencil,
  Radio,
  ArrowDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createBrowserClient } from "@/lib/supabase/client";
import type { Agent, AgentEvent } from "@/types/agenttv";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EventFilter = "all" | "action" | "revenue" | "error" | "log" | "heartbeat" | "status";

interface DbEvent {
  id: string;
  agent_id: string;
  run_id: string | null;
  event_type: string;
  event_name: string;
  data: Record<string, unknown>;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const EVENT_COLORS: Record<string, string> = {
  action: "text-blue-500 bg-blue-500/10",
  revenue: "text-emerald-500 bg-emerald-500/10",
  error: "text-red-500 bg-red-500/10",
  status: "text-amber-500 bg-amber-500/10",
  log: "text-gray-400 bg-gray-500/10",
  heartbeat: "text-purple-400 bg-purple-500/10",
  command: "text-cyan-500 bg-cyan-500/10",
};

const EVENT_ICONS: Record<string, React.ReactNode> = {
  action: <Activity className="size-3.5" />,
  revenue: <DollarSign className="size-3.5" />,
  error: <AlertTriangle className="size-3.5" />,
  status: <Radio className="size-3.5" />,
  log: <Terminal className="size-3.5" />,
  heartbeat: <Activity className="size-3.5" />,
  command: <MessageSquare className="size-3.5" />,
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function formatUptime(createdAt: string): string {
  const ms = Date.now() - new Date(createdAt).getTime();
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const mins = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  return `${hours}h ${mins}m`;
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function getEventMessage(event: DbEvent): string {
  const d = event.data;
  if (d.message && typeof d.message === "string") return d.message;
  if (event.event_type === "heartbeat") return "Agent alive";
  if (event.event_type === "revenue" && typeof d.amount === "number")
    return `Revenue: $${(d.amount / 100).toFixed(2)}`;
  if (event.event_type === "error" && d.error) return String(d.error);
  if (event.event_name && event.event_name !== event.event_type) return event.event_name;
  return JSON.stringify(d).slice(0, 200);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AgentMonitorPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<DbEvent[]>([]);
  const [filter, setFilter] = useState<EventFilter>("all");
  const [isConnected, setIsConnected] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [sending, setSending] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const logEndRef = useRef<HTMLDivElement>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // ---------- Load agent details ----------
  const loadAgent = useCallback(async () => {
    try {
      const res = await fetch(`/api/agents/${slug}`);
      if (!res.ok) {
        router.push("/agents");
        return;
      }
      const json = await res.json();
      setAgent(json.data as Agent);
    } catch {
      router.push("/agents");
    } finally {
      setLoading(false);
    }
  }, [slug, router]);

  // ---------- Load historical events ----------
  const loadEvents = useCallback(async () => {
    try {
      const res = await fetch(`/api/agents/${slug}/events?limit=200`);
      if (!res.ok) return;
      const json = await res.json();
      const evts = (json.data?.events ?? []) as DbEvent[];
      // API returns newest first, we want oldest first
      setEvents(evts.reverse());
    } catch {
      // Non-critical
    }
  }, [slug]);

  useEffect(() => {
    loadAgent();
    loadEvents();
  }, [loadAgent, loadEvents]);

  // ---------- Realtime subscription ----------
  useEffect(() => {
    if (!agent?.id) return;

    const supabase = createBrowserClient();
    const channel = supabase
      .channel(`monitor:${agent.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "events",
          filter: `agent_id=eq.${agent.id}`,
        },
        (payload: { new: DbEvent }) => {
          setEvents((prev) => [...prev, payload.new]);
        }
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    return () => {
      channel.unsubscribe();
    };
  }, [agent?.id]);

  // ---------- Auto-scroll ----------
  useEffect(() => {
    if (autoScroll && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [events, autoScroll]);

  // Detect manual scroll
  const handleScroll = useCallback(() => {
    const el = logContainerRef.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    setAutoScroll(isAtBottom);
  }, []);

  // ---------- Toggle agent ----------
  async function toggleAgent() {
    if (!agent) return;
    setToggling(true);
    const isRunning = agent.status === "running" || agent.status === "starting";
    const endpoint = isRunning ? "stop" : "start";

    try {
      const body = isRunning ? {} : { agent_cmd: "python main.py" };
      const res = await fetch(`/api/agents/${slug}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const newStatus = isRunning ? "offline" : "running";
        setAgent({ ...agent, status: newStatus } as Agent);
        toast.success(isRunning ? "Agent stopped" : "Agent started");
      } else {
        const json = await res.json().catch(() => ({}));
        toast.error(json.error?.message ?? `Failed to ${endpoint} agent`);
      }
    } catch {
      toast.error(`Failed to ${endpoint} agent`);
    } finally {
      setToggling(false);
    }
  }

  // ---------- Send command ----------
  async function sendCommand(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim() || !agent) return;
    setSending(true);
    const message = chatInput.trim();
    setChatInput("");

    try {
      const res = await fetch(`/api/agents/${slug}/command`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        toast.error(json.error?.message ?? "Failed to send command");
        setChatInput(message); // Restore on failure
      }
    } catch {
      toast.error("Failed to send command");
      setChatInput(message);
    } finally {
      setSending(false);
    }
  }

  // ---------- Filter events ----------
  const filteredEvents = filter === "all"
    ? events
    : events.filter((e) => e.event_type === filter);

  // ---------- Event counts ----------
  const eventCounts = events.reduce<Record<string, number>>((acc, e) => {
    acc[e.event_type] = (acc[e.event_type] ?? 0) + 1;
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!agent) return null;

  const isRunning = agent.status === "running" || agent.status === "starting";
  const config = (agent.config ?? {}) as Record<string, unknown>;
  const goal = (config.goal as string) ?? "No goal set";

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b px-4 py-2.5 sm:px-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/agents")}>
            <ChevronLeft className="size-4" />
            Agents
          </Button>
          <div className="hidden h-5 w-px bg-border sm:block" />
          <div className="flex items-center gap-2">
            <div
              className={`size-2.5 rounded-full ${
                agent.status === "running"
                  ? "bg-green-500 animate-pulse"
                  : agent.status === "error"
                    ? "bg-red-500"
                    : "bg-gray-400"
              }`}
            />
            <h1 className="text-lg font-semibold">{agent.name}</h1>
            <span className="text-sm text-muted-foreground capitalize">({agent.status})</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Connection status */}
          <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
            isConnected ? "bg-emerald-500/10 text-emerald-600" : "bg-gray-500/10 text-gray-500"
          }`}>
            <Radio className="size-3" />
            {isConnected ? "Live" : "Disconnected"}
          </div>

          <Button variant="outline" size="sm" onClick={toggleAgent} disabled={toggling}>
            {toggling ? (
              <Loader2 className="size-4 animate-spin" />
            ) : isRunning ? (
              <><Square className="size-3.5" /> Stop</>
            ) : (
              <><Play className="size-3.5" /> Start</>
            )}
          </Button>

          <Link href={`/agents/${slug}/edit`}>
            <Button variant="ghost" size="sm">
              <Pencil className="size-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Main content — 3 columns */}
      <div className="flex min-h-0 flex-1">
        {/* Left: Agent info panel */}
        <aside className="hidden w-72 shrink-0 flex-col gap-4 overflow-y-auto border-r p-4 xl:flex">
          {/* Agent details */}
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Agent Details
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Framework</span>
                <span className="font-medium capitalize">{agent.framework.replace("-", " ")}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Tier</span>
                <span className="font-medium capitalize">{agent.tier}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Revenue</span>
                <span className="font-semibold text-emerald-600">{formatCents(agent.total_revenue_cents)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Followers</span>
                <span className="font-medium">{agent.follower_count.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Uptime</span>
                <span className="font-medium">{formatUptime(agent.created_at)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Slug</span>
                <span className="font-mono text-xs">/{agent.slug}</span>
              </div>
            </div>
          </div>

          {/* Goal/mission */}
          <div className="rounded-lg border bg-card p-4 space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Mission / Goal
            </h3>
            <p className="text-sm leading-relaxed text-foreground/80">
              {goal}
            </p>
          </div>

          {/* Event stats */}
          <div className="rounded-lg border bg-card p-4 space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Event Summary
            </h3>
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Events</span>
                <span className="font-semibold">{events.length}</span>
              </div>
              {Object.entries(eventCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${EVENT_COLORS[type] ?? "text-gray-500 bg-gray-500/10"}`}>
                        {type}
                      </span>
                    </div>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Config */}
          {Object.keys(config).length > 0 && (
            <div className="rounded-lg border bg-card p-4 space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Configuration
              </h3>
              <pre className="max-h-40 overflow-auto rounded bg-muted/50 p-2 text-[11px] leading-relaxed text-foreground/70">
                {JSON.stringify(config, null, 2)}
              </pre>
            </div>
          )}
        </aside>

        {/* Center: Event log + chat */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Filter bar */}
          <div className="flex items-center gap-2 border-b px-4 py-2 overflow-x-auto">
            <Filter className="size-3.5 shrink-0 text-muted-foreground" />
            {(["all", "action", "revenue", "error", "log", "heartbeat", "status"] as EventFilter[]).map(
              (f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                    filter === f
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                  {f !== "all" && eventCounts[f] ? ` (${eventCounts[f]})` : ""}
                </button>
              )
            )}
          </div>

          {/* Event log */}
          <div
            ref={logContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto bg-muted/30"
          >
            {filteredEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Terminal className="size-10 mb-3 opacity-40" />
                <p className="text-sm font-medium">
                  {events.length === 0 ? "No events yet" : "No matching events"}
                </p>
                <p className="mt-1 text-xs">
                  {events.length === 0
                    ? isRunning
                      ? "Waiting for agent to emit events..."
                      : "Start the agent to see activity"
                    : "Try a different filter"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {filteredEvents.map((event) => {
                  const colors = EVENT_COLORS[event.event_type] ?? "text-gray-500 bg-gray-500/10";
                  const icon = EVENT_ICONS[event.event_type] ?? <Activity className="size-3.5" />;
                  const msg = getEventMessage(event);

                  return (
                    <div
                      key={event.id}
                      className="group flex items-start gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors"
                    >
                      {/* Time */}
                      <span className="shrink-0 pt-0.5 text-[11px] font-mono text-muted-foreground/60">
                        {formatTime(event.created_at)}
                      </span>

                      {/* Type badge */}
                      <span className={`mt-0.5 flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${colors}`}>
                        {icon}
                        {event.event_type}
                      </span>

                      {/* Message */}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm leading-relaxed">
                          {event.event_name !== event.event_type && (
                            <span className="mr-1.5 font-semibold text-foreground/90">
                              {event.event_name}
                            </span>
                          )}
                          <span className="text-foreground/70">{msg}</span>
                        </p>

                        {/* Show data details for non-trivial events */}
                        {event.event_type !== "heartbeat" &&
                          event.event_type !== "log" &&
                          Object.keys(event.data).length > 1 && (
                            <details className="mt-1">
                              <summary className="cursor-pointer text-[11px] text-muted-foreground hover:text-foreground">
                                Details
                              </summary>
                              <pre className="mt-1 max-h-32 overflow-auto rounded bg-muted/70 p-2 text-[10px] leading-relaxed text-foreground/60">
                                {JSON.stringify(event.data, null, 2)}
                              </pre>
                            </details>
                          )}
                      </div>
                    </div>
                  );
                })}
                <div ref={logEndRef} />
              </div>
            )}
          </div>

          {/* Scroll-to-bottom button */}
          {!autoScroll && (
            <button
              onClick={() => {
                logEndRef.current?.scrollIntoView({ behavior: "smooth" });
                setAutoScroll(true);
              }}
              className="absolute bottom-24 right-8 z-10 flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-lg"
            >
              <ArrowDown className="size-3" />
              New events
            </button>
          )}

          {/* Chat input */}
          <form onSubmit={sendCommand} className="flex items-center gap-2 border-t bg-card px-4 py-3">
            <MessageSquare className="size-4 shrink-0 text-muted-foreground" />
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={isRunning ? "Send a command to the agent..." : "Agent is not running"}
              disabled={!isRunning || sending}
              className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground/50 focus:outline-none disabled:opacity-50"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!chatInput.trim() || !isRunning || sending}
              className="shrink-0"
            >
              {sending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Send className="size-3.5" />
              )}
            </Button>
          </form>
        </div>

        {/* Right: Quick stats (tablet+) */}
        <aside className="hidden w-64 shrink-0 flex-col gap-4 overflow-y-auto border-l p-4 lg:flex xl:hidden">
          {/* Condensed version of left panel for lg screens without xl */}
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Quick Stats
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <DollarSign className="mx-auto size-4 text-emerald-500" />
                <p className="mt-1 text-sm font-semibold">{formatCents(agent.total_revenue_cents)}</p>
                <p className="text-[10px] text-muted-foreground">Revenue</p>
              </div>
              <div className="text-center">
                <Clock className="mx-auto size-4 text-blue-500" />
                <p className="mt-1 text-sm font-semibold">{formatUptime(agent.created_at)}</p>
                <p className="text-[10px] text-muted-foreground">Uptime</p>
              </div>
              <div className="text-center">
                <Activity className="mx-auto size-4 text-purple-500" />
                <p className="mt-1 text-sm font-semibold">{events.length}</p>
                <p className="text-[10px] text-muted-foreground">Events</p>
              </div>
              <div className="text-center">
                <Cpu className="mx-auto size-4 text-amber-500" />
                <p className="mt-1 text-sm font-semibold capitalize">{agent.framework.replace("-", " ")}</p>
                <p className="text-[10px] text-muted-foreground">Framework</p>
              </div>
            </div>
          </div>

          {/* Goal */}
          <div className="rounded-lg border bg-card p-4 space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Mission
            </h3>
            <p className="text-xs leading-relaxed text-foreground/70 line-clamp-6">
              {goal}
            </p>
          </div>

          {/* Recent event types */}
          <div className="rounded-lg border bg-card p-4 space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Event Breakdown
            </h3>
            <div className="space-y-1.5">
              {Object.entries(eventCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between text-xs">
                    <span className={`rounded px-1.5 py-0.5 font-medium ${EVENT_COLORS[type] ?? "text-gray-500 bg-gray-500/10"}`}>
                      {type}
                    </span>
                    <span className="font-semibold">{count}</span>
                  </div>
                ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
