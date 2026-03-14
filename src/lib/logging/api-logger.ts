import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { logPlatformEvent, extractRequestMeta } from "./platform-logger";
import type { LogStatus } from "@/types/admin-logs";

/**
 * Wraps a Next.js API route handler with automatic logging to platform_logs.
 *
 * - Records timing, request metadata (IP, user-agent, geo)
 * - Resolves Clerk user ID when available
 * - Manages an `atv_session` cookie (creates one if missing)
 * - Logs success / failure / error status based on response code
 */
export function withApiLogging<T>(
  handler: (req: NextRequest) => Promise<NextResponse<T>>,
  routeName: string,
): (req: NextRequest) => Promise<NextResponse<T>> {
  return async (req: NextRequest): Promise<NextResponse<T>> => {
    const startTime = performance.now();

    // --- Extract request metadata ---
    const meta = extractRequestMeta(req);

    // --- Clerk user (best-effort, don't fail if unauthenticated) ---
    let clerkUserId: string | null = null;
    try {
      const { userId } = await auth();
      clerkUserId = userId ?? null;
    } catch {
      // Not authenticated or auth unavailable — continue
    }

    // --- Session cookie ---
    const existingSession = req.cookies.get("atv_session")?.value ?? null;
    const sessionId = existingSession ?? crypto.randomUUID();
    const isNewSession = !existingSession;

    // --- Call actual handler ---
    let response: NextResponse<T>;
    try {
      response = await handler(req);
    } catch (err) {
      const durationMs = Math.round(performance.now() - startTime);
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error";

      logPlatformEvent({
        event_category: "API",
        event_type: routeName,
        clerk_user_id: clerkUserId,
        session_id: sessionId,
        status: "error",
        duration_ms: durationMs,
        page_url: meta.page_url,
        page_route: routeName,
        ip_address: meta.ip_address,
        user_agent: meta.user_agent,
        geo_country: meta.geo_country,
        geo_city: meta.geo_city,
        payload: { method: req.method, status_code: 500 },
        error_message: errorMessage,
      });

      throw err;
    }

    // --- Compute status & duration ---
    const durationMs = Math.round(performance.now() - startTime);
    const statusCode = response.status;
    let logStatus: LogStatus = "success";
    if (statusCode >= 500) logStatus = "error";
    else if (statusCode >= 400) logStatus = "failure";

    // --- Log event ---
    logPlatformEvent({
      event_category: "API",
      event_type: routeName,
      clerk_user_id: clerkUserId,
      session_id: sessionId,
      status: logStatus,
      duration_ms: durationMs,
      page_url: meta.page_url,
      page_route: routeName,
      ip_address: meta.ip_address,
      user_agent: meta.user_agent,
      geo_country: meta.geo_country,
      geo_city: meta.geo_city,
      payload: { method: req.method, status_code: statusCode },
    });

    // --- Set session cookie on response if new ---
    if (isNewSession) {
      response.cookies.set("atv_session", sessionId, {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365, // 1 year
      });
    }

    return response;
  };
}
