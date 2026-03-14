import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import {
  logPlatformEvent,
  extractRequestMeta,
} from "@/lib/logging/platform-logger";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";

const trackingSchema = z.object({
  event_type: z.string().min(1).max(100),
  page_url: z.string().max(2048),
  page_route: z.string().max(500),
  session_id: z.string().uuid(),
  payload: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request) {
  // Rate limit by IP
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const rateLimitResult = await checkRateLimit(ip, "api");
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: rateLimitHeaders(rateLimitResult) }
    );
  }

  // Parse body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = trackingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // Get Clerk user ID if authenticated (don't error if not)
  let clerkUserId: string | null = null;
  try {
    const session = await auth();
    clerkUserId = session?.userId ?? null;
  } catch {
    // Not authenticated — that's fine
  }

  // Extract request metadata
  const meta = extractRequestMeta(request);

  // Fire-and-forget log
  logPlatformEvent({
    event_category: "UI",
    event_type: data.event_type,
    clerk_user_id: clerkUserId,
    session_id: data.session_id,
    ip_address: meta.ip_address,
    user_agent: meta.user_agent,
    geo_country: meta.geo_country,
    geo_city: meta.geo_city,
    page_url: data.page_url,
    page_route: data.page_route,
    status: "success",
    payload: data.payload ?? {},
  });

  return NextResponse.json(
    { ok: true },
    { headers: rateLimitHeaders(rateLimitResult) }
  );
}
