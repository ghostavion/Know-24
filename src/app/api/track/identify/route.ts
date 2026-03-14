import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { createServiceClient } from "@/lib/supabase/server";
import {
  logPlatformEvent,
  extractRequestMeta,
} from "@/lib/logging/platform-logger";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";

const identifySchema = z.object({
  session_id: z.string().uuid(),
});

export async function POST(request: Request) {
  // Authenticate — this endpoint requires a logged-in user
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Rate limit by user ID (auth bucket: 10 req/min)
  const rateLimitResult = await checkRateLimit(userId, "auth");
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

  const parsed = identifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { session_id } = parsed.data;

  // Retroactively link anonymous activity to this user
  const supabase = createServiceClient();
  const { data: updated, error } = await supabase
    .from("platform_logs")
    .update({ clerk_user_id: userId })
    .eq("session_id", session_id)
    .is("clerk_user_id", null)
    .select("id");

  if (error) {
    return NextResponse.json(
      { error: "Failed to link session" },
      { status: 500 }
    );
  }

  const linkedCount = updated?.length ?? 0;

  // Log the identification event
  const meta = extractRequestMeta(request);
  logPlatformEvent({
    event_category: "AUTH",
    event_type: "user.identified",
    clerk_user_id: userId,
    session_id,
    ip_address: meta.ip_address,
    user_agent: meta.user_agent,
    geo_country: meta.geo_country,
    geo_city: meta.geo_city,
    status: "success",
    payload: { linked_events: linkedCount },
  });

  return NextResponse.json(
    { ok: true, linked_events: linkedCount },
    { headers: rateLimitHeaders(rateLimitResult) }
  );
}
