import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { createServiceClient } from "@/lib/supabase/server";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { requireAdmin } from "@/lib/admin/guard";

const feedbackSchema = z.object({
  message: z.string().min(1).max(2000),
  category: z
    .enum(["bug", "ux", "feature", "general"])
    .optional()
    .default("general"),
  severity: z
    .enum(["low", "medium", "high", "critical"])
    .optional()
    .default("medium"),
  page_url: z.string().min(1).max(2048),
  page_route: z.string().max(500).nullable().optional(),
  element_tag: z.string().max(100).nullable().optional(),
  element_text: z.string().max(500).nullable().optional(),
  element_id: z.string().max(200).nullable().optional(),
  element_class: z.string().max(1000).nullable().optional(),
  session_id: z.string().nullable().optional(),
  context_logs: z
    .array(z.record(z.string(), z.unknown()))
    .max(50)
    .nullable()
    .optional(),
  browser_info: z.record(z.string(), z.unknown()).nullable().optional(),
  screenshot_base64: z.string().max(5_000_000).nullable().optional(),
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

  const parsed = feedbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Get Clerk user ID if authenticated (don't fail if not)
  let clerkUserId: string | null = null;
  try {
    const session = await auth();
    clerkUserId = session?.userId ?? null;
  } catch {
    // Not authenticated — that's fine
  }

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("feedback")
    .insert({
      clerk_user_id: clerkUserId,
      message: parsed.data.message,
      category: parsed.data.category,
      severity: parsed.data.severity,
      page_url: parsed.data.page_url,
      page_route: parsed.data.page_route ?? null,
      element_tag: parsed.data.element_tag ?? null,
      element_text: parsed.data.element_text ?? null,
      element_id: parsed.data.element_id ?? null,
      element_class: parsed.data.element_class ?? null,
      session_id: parsed.data.session_id ?? null,
      context_logs: parsed.data.context_logs ?? null,
      browser_info: parsed.data.browser_info ?? null,
      screenshot_base64: parsed.data.screenshot_base64 ?? null,
      status: "open",
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to submit feedback" },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { data: { id: data.id, created: true } },
    { status: 201, headers: rateLimitHeaders(rateLimitResult) }
  );
}

export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch (err) {
    const message = err instanceof Error ? err.message : "UNAUTHORIZED";
    const status = message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const limit = Math.min(
    Math.max(parseInt(searchParams.get("limit") ?? "50", 10) || 50, 1),
    200
  );

  const supabase = createServiceClient();

  let query = supabase
    .from("feedback")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status) {
    query = query.eq("status", status);
  }

  const [{ data, error }, { count: openCount, error: countError }] =
    await Promise.all([
      query,
      supabase
        .from("feedback")
        .select("*", { count: "exact", head: true })
        .eq("status", "open"),
    ]);

  if (error || countError) {
    return NextResponse.json(
      { error: "Failed to fetch feedback" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    data,
    meta: { total: data?.length ?? 0, open_count: openCount ?? 0 },
  });
}
