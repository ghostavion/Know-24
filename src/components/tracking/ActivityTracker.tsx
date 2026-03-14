"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { getSessionId } from "@/lib/tracking/session";
import { pushEvent as pushToBuffer } from "@/lib/tracking/event-buffer";

const TRACK_ENDPOINT = "/api/track";
const IDENTIFY_ENDPOINT = "/api/track/identify";
const DEBOUNCE_MS = 300;
const IDENTIFIED_KEY = "atv_identified";
const FLUSH_INTERVAL_MS = 2000;
const FLUSH_BATCH_SIZE = 10;
const CLICK_BATCH_MS = 100;
const RAGE_CLICK_WINDOW_MS = 1000;
const RAGE_CLICK_THRESHOLD = 3;
const RAGE_CLICK_RADIUS = 50;

interface TrackPayload {
  event_type: string;
  page_url: string;
  page_route: string;
  session_id: string;
  timestamp: number;
  payload?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Event queue & flushing
// ---------------------------------------------------------------------------

let eventQueue: TrackPayload[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function enqueueEvent(event: TrackPayload): void {
  eventQueue.push(event);
  pushToBuffer(event);
  if (eventQueue.length >= FLUSH_BATCH_SIZE) {
    flushQueue();
  }
}

function flushQueue(): void {
  if (eventQueue.length === 0) return;
  const batch = eventQueue.splice(0);
  try {
    fetch(TRACK_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(batch),
      keepalive: true,
    }).catch(() => {
      // Silently fail — tracking should never break the app
    });
  } catch {
    // Guard against synchronous errors
  }
}

function flushQueueBeacon(): void {
  if (eventQueue.length === 0) return;
  const batch = eventQueue.splice(0);
  try {
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(batch)], {
        type: "application/json",
      });
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
    // Silently fail
  }
}

function startFlushTimer(): void {
  if (flushTimer) return;
  flushTimer = setInterval(flushQueue, FLUSH_INTERVAL_MS);
}

function stopFlushTimer(): void {
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
}

// ---------------------------------------------------------------------------
// Helper to build a base event
// ---------------------------------------------------------------------------

function makeEvent(
  eventType: string,
  route: string,
  payload?: Record<string, unknown>
): TrackPayload {
  return {
    event_type: eventType,
    page_url: typeof window !== "undefined" ? window.location.href : "",
    page_route: route,
    session_id: getSessionId(),
    timestamp: Date.now(),
    payload,
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ActivityTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { userId, isLoaded } = useAuth();
  const pageEnteredAt = useRef<number>(Date.now());
  const lastTrackedRoute = useRef<string>("");
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Scroll depth tracking — which thresholds have fired
  const scrollThresholdsFired = useRef<Set<number>>(new Set());

  // Rage click tracking
  const recentClicks = useRef<{ x: number; y: number; t: number }[]>([]);

  // Click debounce batching
  const clickBatchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingClick = useRef<TrackPayload | null>(null);
  const pendingClickCount = useRef<number>(0);

  // Visibility (tab hidden) tracking
  const tabHiddenAt = useRef<number | null>(null);

  const currentRoute = useCallback(() => {
    if (!pathname) return "";
    return searchParams?.toString()
      ? `${pathname}?${searchParams.toString()}`
      : pathname;
  }, [pathname, searchParams]);

  // -----------------------------------------------------------------------
  // Page view / leave (kept from original)
  // -----------------------------------------------------------------------

  const trackPageView = useCallback(
    (route: string) => {
      enqueueEvent(
        makeEvent("page.view", route, {
          referrer: document.referrer || null,
          search_params: searchParams?.toString() || null,
        })
      );
      pageEnteredAt.current = Date.now();
      lastTrackedRoute.current = route;
      // Reset scroll thresholds for new page
      scrollThresholdsFired.current.clear();
    },
    [searchParams]
  );

  const trackPageLeave = useCallback(() => {
    const route = lastTrackedRoute.current;
    if (!route) return;
    const durationMs = Date.now() - pageEnteredAt.current;
    if (durationMs < 500) return;
    enqueueEvent(
      makeEvent("page.leave", route, { duration_ms: durationMs })
    );
  }, []);

  // -----------------------------------------------------------------------
  // Session stitching — link anonymous activity on sign-in/sign-up
  // -----------------------------------------------------------------------

  useEffect(() => {
    if (!isLoaded || !userId) return;

    // Only identify once per session to avoid redundant calls
    const alreadyIdentified = sessionStorage.getItem(IDENTIFIED_KEY);
    if (alreadyIdentified === userId) return;

    const sessionId = getSessionId();
    sessionStorage.setItem(IDENTIFIED_KEY, userId);

    fetch(IDENTIFY_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId }),
      keepalive: true,
    }).catch(() => {
      // If the identify call fails, clear the flag so it retries next navigation
      sessionStorage.removeItem(IDENTIFIED_KEY);
    });
  }, [isLoaded, userId]);

  // -----------------------------------------------------------------------
  // Route change tracking (debounced)
  // -----------------------------------------------------------------------

  useEffect(() => {
    if (!pathname) return;

    const fullRoute = currentRoute();
    if (fullRoute === lastTrackedRoute.current) return;

    if (lastTrackedRoute.current) {
      trackPageLeave();
    }

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      trackPageView(fullRoute);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [pathname, searchParams, trackPageView, trackPageLeave, currentRoute]);

  // -----------------------------------------------------------------------
  // All event listeners
  // -----------------------------------------------------------------------

  useEffect(() => {
    const route = () => lastTrackedRoute.current || currentRoute();

    // Start the periodic flush timer
    startFlushTimer();

    // --- 1. Click tracking (with debounce + rage click detection) ---------

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const now = Date.now();
      const x = e.clientX;
      const y = e.clientY;

      // --- Rage click detection ---
      recentClicks.current.push({ x, y, t: now });
      // Prune old clicks outside window
      recentClicks.current = recentClicks.current.filter(
        (c) => now - c.t < RAGE_CLICK_WINDOW_MS
      );
      // Check if 3+ clicks in same area
      const nearby = recentClicks.current.filter(
        (c) =>
          Math.abs(c.x - x) < RAGE_CLICK_RADIUS &&
          Math.abs(c.y - y) < RAGE_CLICK_RADIUS
      );
      if (nearby.length >= RAGE_CLICK_THRESHOLD) {
        enqueueEvent(
          makeEvent("rage_click", route(), {
            click_count: nearby.length,
            element_text: (target.innerText || "").slice(0, 100),
            element_tag: target.tagName.toLowerCase(),
          })
        );
        // Reset to avoid repeated rage_click events for same burst
        recentClicks.current = [];
      }

      // --- Click batching (100ms debounce for double-clicks) ---
      const clickPayload: Record<string, unknown> = {
        element_tag: target.tagName.toLowerCase(),
        element_text: (target.innerText || "").slice(0, 100),
        element_id: target.id || null,
        element_class: (target.className || "").toString().slice(0, 200),
        element_href:
          target instanceof HTMLAnchorElement ? target.href : null,
        element_data: target.getAttribute("data-track") || null,
        x,
        y,
      };

      pendingClickCount.current += 1;

      // Keep updating the pending click payload (last click wins for coordinates)
      pendingClick.current = makeEvent("click", route(), clickPayload);

      if (clickBatchTimer.current) {
        clearTimeout(clickBatchTimer.current);
      }
      clickBatchTimer.current = setTimeout(() => {
        if (pendingClick.current) {
          if (pendingClickCount.current > 1 && pendingClick.current.payload) {
            pendingClick.current.payload.batched_clicks =
              pendingClickCount.current;
          }
          enqueueEvent(pendingClick.current);
          pendingClick.current = null;
          pendingClickCount.current = 0;
        }
      }, CLICK_BATCH_MS);
    };

    // --- 2. Form submissions -----------------------------------------------

    const handleSubmit = (e: Event) => {
      const form = e.target as HTMLFormElement | null;
      if (!form) return;
      enqueueEvent(
        makeEvent("form.submit", route(), {
          form_id: form.id || null,
          form_action: form.action || null,
          field_count: form.elements.length,
        })
      );
    };

    // --- 3. Input focus / blur ---------------------------------------------

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        !target ||
        !(
          target instanceof HTMLInputElement ||
          target instanceof HTMLTextAreaElement ||
          target instanceof HTMLSelectElement
        )
      )
        return;
      enqueueEvent(
        makeEvent("input.focus", route(), {
          input_name: target.name || null,
          input_type:
            target instanceof HTMLInputElement ? target.type : target.tagName.toLowerCase(),
          input_id: target.id || null,
        })
      );
    };

    const handleFocusOut = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        !target ||
        !(
          target instanceof HTMLInputElement ||
          target instanceof HTMLTextAreaElement ||
          target instanceof HTMLSelectElement
        )
      )
        return;
      enqueueEvent(
        makeEvent("input.blur", route(), {
          input_name: target.name || null,
          input_type:
            target instanceof HTMLInputElement ? target.type : target.tagName.toLowerCase(),
          input_id: target.id || null,
          had_value: target.value.length > 0,
        })
      );
    };

    // --- 4. Scroll depth ---------------------------------------------------

    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const pageHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      if (pageHeight <= 0) return;

      const pct = (scrollTop / pageHeight) * 100;
      const thresholds = [25, 50, 75, 100];
      for (const t of thresholds) {
        if (pct >= t && !scrollThresholdsFired.current.has(t)) {
          scrollThresholdsFired.current.add(t);
          enqueueEvent(
            makeEvent("scroll.depth", route(), {
              depth_percent: t,
              page_height: document.documentElement.scrollHeight,
            })
          );
        }
      }
    };

    // --- 5. JS errors & unhandled promise rejections -----------------------

    const handleError = (e: ErrorEvent) => {
      enqueueEvent(
        makeEvent("error.js", route(), {
          message: e.message || null,
          source: e.filename || null,
          line: e.lineno || null,
          col: e.colno || null,
          stack: e.error?.stack ? e.error.stack.slice(0, 500) : null,
        })
      );
    };

    const handleUnhandledRejection = (e: PromiseRejectionEvent) => {
      const reason = e.reason;
      const message =
        reason instanceof Error
          ? reason.message
          : typeof reason === "string"
            ? reason
            : "Unknown promise rejection";
      const stack =
        reason instanceof Error ? (reason.stack || "").slice(0, 500) : null;
      enqueueEvent(
        makeEvent("error.promise", route(), {
          message,
          source: null,
          line: null,
          col: null,
          stack,
        })
      );
    };

    // --- 6. Copy / paste ---------------------------------------------------

    const handleCopy = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      enqueueEvent(
        makeEvent("clipboard.copy", route(), {
          target_tag: target ? target.tagName.toLowerCase() : null,
        })
      );
    };

    const handlePaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      enqueueEvent(
        makeEvent("clipboard.paste", route(), {
          target_tag: target ? target.tagName.toLowerCase() : null,
        })
      );
    };

    // --- 7. Tab visibility changes -----------------------------------------

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        tabHiddenAt.current = Date.now();
        enqueueEvent(makeEvent("tab.hidden", route()));
        // Also track page leave
        trackPageLeave();
      } else {
        const hiddenDuration =
          tabHiddenAt.current !== null
            ? Date.now() - tabHiddenAt.current
            : null;
        tabHiddenAt.current = null;
        enqueueEvent(
          makeEvent("tab.visible", route(), {
            hidden_duration_ms: hiddenDuration,
          })
        );
      }
    };

    // --- Before unload (flush remaining events) ----------------------------

    const handleBeforeUnload = () => {
      trackPageLeave();
      flushQueueBeacon();
    };

    // --- Register all listeners -------------------------------------------

    document.addEventListener("click", handleClick, { passive: true });
    document.addEventListener("submit", handleSubmit, { passive: true });
    document.addEventListener("focusin", handleFocusIn, { passive: true });
    document.addEventListener("focusout", handleFocusOut, { passive: true });
    document.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("copy", handleCopy, { passive: true });
    document.addEventListener("paste", handlePaste, { passive: true });
    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );
    window.addEventListener("error", handleError);
    window.addEventListener(
      "unhandledrejection",
      handleUnhandledRejection
    );
    window.addEventListener("beforeunload", handleBeforeUnload);

    // --- Cleanup -----------------------------------------------------------

    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("submit", handleSubmit);
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", handleFocusOut);
      document.removeEventListener("scroll", handleScroll);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
      window.removeEventListener("error", handleError);
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection
      );
      window.removeEventListener("beforeunload", handleBeforeUnload);

      if (clickBatchTimer.current) {
        clearTimeout(clickBatchTimer.current);
      }

      stopFlushTimer();
      flushQueue();
    };
  }, [trackPageLeave, currentRoute]);

  return null;
}
