"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { getSessionId } from "@/lib/tracking/session";

const TRACK_ENDPOINT = "/api/track";
const DEBOUNCE_MS = 300;

interface TrackPayload {
  event_type: string;
  page_url: string;
  page_route: string;
  session_id: string;
  payload?: Record<string, unknown>;
}

function sendTrackEvent(data: TrackPayload): void {
  try {
    fetch(TRACK_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      keepalive: true,
    }).catch(() => {
      // Silently fail — tracking should never break the app
    });
  } catch {
    // Guard against synchronous errors
  }
}

function sendBeaconEvent(data: TrackPayload): void {
  try {
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(data)], {
        type: "application/json",
      });
      navigator.sendBeacon(TRACK_ENDPOINT, blob);
    } else {
      sendTrackEvent(data);
    }
  } catch {
    // Silently fail
  }
}

export function ActivityTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pageEnteredAt = useRef<number>(Date.now());
  const lastTrackedRoute = useRef<string>("");
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const trackPageView = useCallback(
    (route: string) => {
      const sessionId = getSessionId();
      sendTrackEvent({
        event_type: "page.view",
        page_url: window.location.href,
        page_route: route,
        session_id: sessionId,
        payload: {
          referrer: document.referrer || null,
          search_params: searchParams?.toString() || null,
        },
      });
      pageEnteredAt.current = Date.now();
      lastTrackedRoute.current = route;
    },
    [searchParams]
  );

  const trackPageLeave = useCallback(() => {
    const route = lastTrackedRoute.current;
    if (!route) return;

    const durationMs = Date.now() - pageEnteredAt.current;
    // Only track if user spent at least 500ms on the page
    if (durationMs < 500) return;

    const sessionId = getSessionId();
    sendBeaconEvent({
      event_type: "page.leave",
      page_url: window.location.href,
      page_route: route,
      session_id: sessionId,
      payload: {
        duration_ms: durationMs,
      },
    });
  }, []);

  // Track route changes with debounce
  useEffect(() => {
    if (!pathname) return;

    const fullRoute = searchParams?.toString()
      ? `${pathname}?${searchParams.toString()}`
      : pathname;

    // Skip if same route
    if (fullRoute === lastTrackedRoute.current) return;

    // Send leave event for previous page
    if (lastTrackedRoute.current) {
      trackPageLeave();
    }

    // Debounce the page view to handle rapid SPA navigation
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
  }, [pathname, searchParams, trackPageView, trackPageLeave]);

  // Track page leave on tab close / navigation away
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        trackPageLeave();
      }
    };

    const handleBeforeUnload = () => {
      trackPageLeave();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [trackPageLeave]);

  return null;
}
