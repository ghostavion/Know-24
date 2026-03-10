import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const supabase = createServiceClient();
  const results: Record<string, unknown> = {};

  // Test 1: Direct insert to platform_logs
  const { error: platformError } = await supabase.from("platform_logs").insert({
    event_category: "SYSTEM",
    event_type: "test.diagnostic",
    status: "success",
    environment: "production",
    app_version: "0.1.0",
    payload: { test: true, timestamp: new Date().toISOString() },
  });

  results.platform_logs_insert = platformError
    ? { error: platformError.message, code: platformError.code, details: platformError.details }
    : "OK";

  // Test 2: Direct insert to activity_log (needs a business_id)
  const { data: anyBusiness } = await supabase
    .from("businesses")
    .select("id")
    .limit(1)
    .single();

  if (anyBusiness) {
    const { error: activityError } = await supabase.from("activity_log").insert({
      business_id: anyBusiness.id,
      event_type: "business_created",
      title: "Diagnostic test event",
      description: "This event was created by the admin test-log endpoint",
      metadata: { test: true },
    });

    results.activity_log_insert = activityError
      ? { error: activityError.message, code: activityError.code, details: activityError.details }
      : "OK";
  } else {
    results.activity_log_insert = "SKIPPED - no businesses found";
  }

  // Test 3: Count existing rows
  const { count: platformCount } = await supabase
    .from("platform_logs")
    .select("*", { count: "exact", head: true });

  const { count: activityCount } = await supabase
    .from("activity_log")
    .select("*", { count: "exact", head: true });

  results.platform_logs_total_rows = platformCount ?? 0;
  results.activity_log_total_rows = activityCount ?? 0;

  return NextResponse.json({ data: results });
}
