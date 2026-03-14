"use client";

import { useEffect, useRef, useCallback } from "react";
import { getSessionId } from "@/lib/tracking/session";

const TRACK_ENDPOINT = "/api/track";
const FLUSH_INTERVAL_MS = 5_000;
const SLOW_REQUEST_THRESHOLD_MS = 1_000;
const LONG_TASK_THRESHOLD_MS = 100;

interface TrackPayload {
  event_type: string;
  page_url: string;
  page_route: string;
  session_id: string;
  payload?: Record<string, unknown>;
}

/** Strip query params from a URL for privacy. */
function stripQueryParams(url: string): string {
  try {
    const u = new URL(url, window.location.origin);
    return u.origin + u.pathname;
  } catch {
    return url.split("?")[0];
  }
}

/** Check if a URL is same-origin. */
function isSameOrigin(url: string): boolean {
  try {
    const u = new URL(url, window.location.origin);
    return u.origin === window.location.origin;
  } catch {
    return true;
  }
}

function buildPayload(
  eventType: string,
  payload: Record<string, unknown>
): TrackPayload {
  return {
    event_type: eventType,
    page_url: window.location.href,
    page_route: window.location.pathname,
    session_id: getSessionId(),
    payload,
  };
}

export function PerformanceTracker() {
  const queue = useRef<TrackPayload[]>([]);
  const flushTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const lcpFired = useRef(false);
  const fidFired = useRef(false);
  const clsFired = useRef(false);

  const enqueue = useCallback((event: TrackPayload) => {
    queue.current.push(event);
  }, []);

  const flush = useCallback(() => {
    if (queue.current.length === 0) return;
    const batch = queue.current.splice(0);
    try {
      const blob = new Blob([JSON.stringify(batch)], {
        type: "application/json",
      });
      if (navigator.sendBeacon) {
        navigator.sendBeacon(TRACK_ENDPOINT, blob);
      } else {
        fetch(TRACK_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(batch),
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      // Silently fail — tracking should never break the app
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || typeof PerformanceObserver === "undefined") return;

    const observers: PerformanceObserver[] = [];

    // ---- Slow network requests ----
    try {
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const res = entry as PerformanceResourceTiming;
          if (
            res.initiatorType !== "fetch" &&
            res.initiatorType !== "xmlhttprequest"
          )
            continue;
          if (res.duration < SLOW_REQUEST_THRESHOLD_MS) continue;
          // Skip tracking endpoint to avoid recursion
          if (res.name.includes("/api/track")) continue;

          enqueue(
            buildPayload("perf.slow_request", {
              url: stripQueryParams(res.name),
              duration_ms: Math.round(res.duration),
              transfer_size: res.transferSize,
              initiator_type: res.initiatorType,
            })
          );
        }
      });
      resourceObserver.observe({ type: "resource", buffered: false });
      observers.push(resourceObserver);
    } catch {
      // Observer not supported
    }

    // ---- Web Vitals: LCP ----
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        if (lcpFired.current) return;
        const entries = list.getEntries();
        const last = entries[entries.length - 1];
        if (!last) return;
        lcpFired.current = true;
        enqueue(
          buildPayload("perf.lcp", {
            value: Math.round(last.startTime),
          })
        );
      });
      lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
      observers.push(lcpObserver);
    } catch {
      // Observer not supported
    }

    // ---- Web Vitals: FID ----
    try {
      const fidObserver = new PerformanceObserver((list) => {
        if (fidFired.current) return;
        const entry = list.getEntries()[0] as PerformanceEventTiming | undefined;
        if (!entry) return;
        fidFired.current = true;
        enqueue(
          buildPayload("perf.fid", {
            value: Math.round(entry.processingStart - entry.startTime),
          })
        );
      });
      fidObserver.observe({ type: "first-input", buffered: true });
      observers.push(fidObserver);
    } catch {
      // Observer not supported
    }

    // ---- Web Vitals: CLS ----
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const layoutShift = entry as any;
          if (!layoutShift.hadRecentInput) {
            clsValue += layoutShift.value;
          }
        }
      });
      clsObserver.observe({ type: "layout-shift", buffered: true });
      observers.push(clsObserver);

      // Report CLS once when the page is about to be hidden
      const reportCLS = () => {
        if (clsFired.current) return;
        clsFired.current = true;
        enqueue(
          buildPayload("perf.cls", {
            value: parseFloat(clsValue.toFixed(4)),
          })
        );
        flush();
      };
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") reportCLS();
      });
      window.addEventListener("beforeunload", reportCLS);
    } catch {
      // Observer not supported
    }

    // ---- Long tasks ----
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration < LONG_TASK_THRESHOLD_MS) continue;
          enqueue(
            buildPayload("perf.long_task", {
              duration_ms: Math.round(entry.duration),
            })
          );
        }
      });
      longTaskObserver.observe({ type: "longtask", buffered: true });
      observers.push(longTaskObserver);
    } catch {
      // Observer not supported
    }

    // ---- Failed fetch requests (monkey-patch) ----
    const originalFetch = window.fetch;
    window.fetch = async function patchedFetch(
      input: RequestInfo | URL,
      init?: RequestInit
    ): Promise<Response> {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.href
            : input.url;

      // Only track same-origin, skip tracking endpoint
      if (!isSameOrigin(url) || url.includes("/api/track")) {
        return originalFetch.call(this, input, init);
      }

      const method = init?.method?.toUpperCase() || "GET";

      try {
        const response = await originalFetch.call(this, input, init);
        if (!response.ok) {
          enqueue(
            buildPayload("fetch.error", {
              url: stripQueryParams(url),
              status: response.status,
              method,
              error: response.statusText,
            })
          );
        }
        return response;
      } catch (err) {
        enqueue(
          buildPayload("fetch.error", {
            url: stripQueryParams(url),
            status: 0,
            method,
            error: err instanceof Error ? err.message : "Network error",
          })
        );
        throw err;
      }
    };

    // ---- Batch flush interval ----
    flushTimer.current = setInterval(flush, FLUSH_INTERVAL_MS);

    // Flush on page hide
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", flush);

    return () => {
      for (const obs of observers) {
        try {
          obs.disconnect();
        } catch {
          // Ignore
        }
      }
      window.fetch = originalFetch;
      if (flushTimer.current) clearInterval(flushTimer.current);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", flush);
      flush();
    };
  }, [enqueue, flush]);

  return null;
}
