"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Radio, Pause, Play, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeedLog {
  id: string;
  timestamp: string;
  event_category: string;
  event_type: string;
  user_id: string | null;
  status: string | null;
  duration_ms: number | null;
  business_id: string | null;
  payload: Record<string, unknown> | null;
  error_code: string | null;
  error_message: string | null;
  environment: string | null;
}

const CATEGORY_COLORS: Record<string, string> = {
  AUTH: "bg-indigo-500",
  USER_ACTION: "bg-blue-500",
  UI: "bg-slate-500",
  DATA: "bg-cyan-500",
  LLM: "bg-violet-500",
  API: "bg-amber-500",
  ERROR: "bg-red-500",
  SYSTEM: "bg-gray-500",
  SECURITY: "bg-rose-500",
};

const MAX_EVENTS = 200;

export default function LiveFeedPage() {
  const [events, setEvents] = useState<FeedLog[]>([]);
  const [connected, setConnected] = useState(false);
  const [paused, setPaused] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const pausedBufferRef = useRef<FeedLog[]>([]);

  const addEvents = useCallback((newLogs: FeedLog[]) => {
    setEvents((prev) => {
      const combined = [...prev, ...newLogs];
      return combined.length > MAX_EVENTS ? combined.slice(-MAX_EVENTS) : combined;
    });
  }, []);

  useEffect(() => {
    const es = new EventSource("/api/admin/feed");
    eventSourceRef.current = es;

    es.addEventListener("init", (e) => {
      const logs: FeedLog[] = JSON.parse(e.data);
      setEvents(logs);
      setConnected(true);
    });

    es.addEventListener("log", (e) => {
      const log: FeedLog = JSON.parse(e.data);
      if (paused) {
        pausedBufferRef.current.push(log);
      } else {
        addEvents([log]);
      }
    });

    es.addEventListener("error", () => {
      setConnected(false);
    });

    es.onerror = () => {
      setConnected(false);
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle unpause — flush buffer
  useEffect(() => {
    if (!paused && pausedBufferRef.current.length > 0) {
      addEvents(pausedBufferRef.current);
      pausedBufferRef.current = [];
    }
  }, [paused, addEvents]);

  // Auto-scroll
  useEffect(() => {
    if (autoScroll && !paused && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [events, autoScroll, paused]);

  // Detect manual scroll
  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    setAutoScroll(atBottom);
  }, []);

  return (
    <div className="flex h-full flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Live Feed</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Real-time platform event stream.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                connected ? "bg-green-500 animate-pulse" : "bg-red-500"
              )}
            />
            <span className="text-xs text-muted-foreground">
              {connected ? "Connected" : "Disconnected"}
            </span>
          </div>
          <button
            onClick={() => setPaused((p) => !p)}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
            {paused ? "Resume" : "Pause"}
            {paused && pausedBufferRef.current.length > 0 && (
              <span className="ml-1 rounded-full bg-amber-500/20 px-1.5 text-xs text-amber-600">
                +{pausedBufferRef.current.length}
              </span>
            )}
          </button>
          {!autoScroll && (
            <button
              onClick={() => {
                setAutoScroll(true);
                bottomRef.current?.scrollIntoView({ behavior: "smooth" });
              }}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <ArrowDown className="h-3.5 w-3.5" />
              Scroll to bottom
            </button>
          )}
        </div>
      </div>

      {/* Events */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto rounded-xl border border-border bg-card"
        style={{ minHeight: "400px", maxHeight: "calc(100vh - 240px)" }}
      >
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Radio className="mb-3 h-8 w-8 animate-pulse" />
            <p className="text-sm">Waiting for events...</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {events.map((event) => (
              <FeedEventRow key={event.id} event={event} />
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Showing last {events.length} events (max {MAX_EVENTS})
      </p>
    </div>
  );
}

function FeedEventRow({ event }: { event: FeedLog }) {
  const [expanded, setExpanded] = useState(false);
  const time = new Date(event.timestamp).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const isError = event.status === "error" || event.event_category === "ERROR";

  return (
    <div
      className={cn(
        "px-4 py-2 text-sm cursor-pointer hover:bg-muted/50 transition-colors",
        isError && "bg-red-500/5"
      )}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center gap-3">
        <span className="w-[72px] shrink-0 font-mono text-xs text-muted-foreground">
          {time}
        </span>
        <span
          className={cn(
            "h-2 w-2 shrink-0 rounded-full",
            CATEGORY_COLORS[event.event_category] ?? "bg-gray-400"
          )}
        />
        <span className="w-[80px] shrink-0 text-xs font-medium text-muted-foreground uppercase">
          {event.event_category}
        </span>
        <span className={cn("font-medium", isError ? "text-red-600 dark:text-red-400" : "text-foreground")}>
          {event.event_type}
        </span>
        {event.duration_ms != null && (
          <span className="ml-auto text-xs text-muted-foreground">{event.duration_ms}ms</span>
        )}
        {event.status && (
          <span
            className={cn(
              "inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium",
              event.status === "success"
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : event.status === "error"
                  ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
            )}
          >
            {event.status}
          </span>
        )}
      </div>
      {expanded && (
        <div className="mt-2 ml-[100px] space-y-1">
          {event.user_id && (
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">User:</span> {event.user_id}
            </p>
          )}
          {event.business_id && (
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Business:</span> {event.business_id}
            </p>
          )}
          {event.error_message && (
            <p className="text-xs text-red-600 dark:text-red-400">
              <span className="font-medium">Error:</span> {event.error_message}
            </p>
          )}
          {event.payload && Object.keys(event.payload).length > 0 && (
            <pre className="mt-1 rounded-md bg-muted/50 p-2 text-xs text-muted-foreground overflow-x-auto">
              {JSON.stringify(event.payload, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
