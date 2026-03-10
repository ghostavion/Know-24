import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { resolveUserId } from "@/lib/auth/resolve-user";
import { runScan } from "@/lib/scout/orchestrator";
import { logPlatformEvent } from "@/lib/logging/platform-logger";
import type { ApiResponse } from "@/types/api";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const triggerScanSchema = z.object({
  businessId: z.string().uuid(),
});

const businessIdParamSchema = z.string().uuid();

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

interface ScanRecord {
  id: string;
  business_id: string;
  scan_at: string;
  platforms: string[];
  opportunities_found: number;
  status: string;
  error_message: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ---------------------------------------------------------------------------
// POST — Trigger a new Scout scan
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<{ scanId: string; status: string }>>> {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 },
      );
    }

    const body: unknown = await request.json();
    const parsed = triggerScanSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Valid businessId is required",
            details: parsed.error.flatten(),
          },
        },
        { status: 400 },
      );
    }

    const { businessId } = parsed.data;
    const supabase = createServiceClient();

    // Resolve Clerk user ID → internal UUID
    const userId = await resolveUserId(supabase, clerkUserId);
    if (!userId) {
      return NextResponse.json(
        { error: { code: "USER_NOT_FOUND", message: "User not found" } },
        { status: 404 },
      );
    }

    // Verify business ownership
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .select("id, organization_id")
      .eq("id", businessId)
      .eq("owner_id", userId)
      .single();

    if (bizError || !business) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Business not found" } },
        { status: 404 },
      );
    }

    // Check Scout subscription gate
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("id, scout_enabled, scout_scans_used_this_month, scout_scans_ceiling")
      .eq("id", business.organization_id)
      .single();

    if (orgError || !org) {
      return NextResponse.json(
        { error: { code: "ORG_NOT_FOUND", message: "Organization not found" } },
        { status: 404 },
      );
    }

    if (!org.scout_enabled) {
      return NextResponse.json(
        {
          error: {
            code: "SCOUT_NOT_ENABLED",
            message: "Scout is not enabled for this organization. Upgrade to access Scout.",
          },
        },
        { status: 403 },
      );
    }

    if (org.scout_scans_used_this_month >= org.scout_scans_ceiling) {
      return NextResponse.json(
        {
          error: {
            code: "SCAN_LIMIT_REACHED",
            message: "Monthly scan limit reached",
          },
        },
        { status: 429 },
      );
    }

    // Create a scout_scan record
    const platforms = ["reddit", "twitter", "quora", "linkedin", "podcasts", "news"];

    const { data: scan, error: scanError } = await supabase
      .from("scout_scans")
      .insert({
        business_id: businessId,
        platforms,
        status: "pending",
      })
      .select("id")
      .single();

    if (scanError || !scan) {
      return NextResponse.json(
        { error: { code: "CREATE_FAILED", message: "Failed to create scan" } },
        { status: 500 },
      );
    }

    // Increment scout_scans_used_this_month
    const { error: updateError } = await supabase
      .from("organizations")
      .update({
        scout_scans_used_this_month: org.scout_scans_used_this_month + 1,
      })
      .eq("id", org.id);

    if (updateError) {
      return NextResponse.json(
        { error: { code: "UPDATE_FAILED", message: "Failed to update scan usage" } },
        { status: 500 },
      );
    }

    // Fire and forget — async processing
    void runScan(scan.id, businessId).catch(async (err: unknown) => {
      await supabase
        .from("scout_scans")
        .update({
          status: "failed",
          error_message: err instanceof Error ? err.message : "Unknown error",
        })
        .eq("id", scan.id);
    });

    logPlatformEvent({
      event_category: "DATA",
      event_type: "scout.scan.triggered",
      clerk_user_id: clerkUserId,
      status: "success",
      business_id: businessId,
      payload: {
        scan_id: scan.id,
        platforms,
        scans_used: org.scout_scans_used_this_month + 1,
        scans_ceiling: org.scout_scans_ceiling,
      },
    });

    return NextResponse.json({
      data: { scanId: scan.id, status: "pending" },
    });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// GET — List scans for a business
// ---------------------------------------------------------------------------

export async function GET(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<ScanRecord[]>>> {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 },
      );
    }

    const businessId = request.nextUrl.searchParams.get("businessId");
    const parsed = businessIdParamSchema.safeParse(businessId);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Valid businessId query parameter is required",
          },
        },
        { status: 400 },
      );
    }

    const supabase = createServiceClient();

    // Resolve Clerk user ID → internal UUID
    const userId = await resolveUserId(supabase, clerkUserId);
    if (!userId) {
      return NextResponse.json(
        { error: { code: "USER_NOT_FOUND", message: "User not found" } },
        { status: 404 },
      );
    }

    // Verify business ownership
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .select("id")
      .eq("id", parsed.data)
      .eq("owner_id", userId)
      .single();

    if (bizError || !business) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Business not found" } },
        { status: 404 },
      );
    }

    const { data: scans, error: fetchError } = await supabase
      .from("scout_scans")
      .select("*")
      .eq("business_id", parsed.data)
      .order("created_at", { ascending: false })
      .limit(10);

    if (fetchError) {
      return NextResponse.json(
        { error: { code: "FETCH_FAILED", message: "Failed to fetch scans" } },
        { status: 500 },
      );
    }

    return NextResponse.json({ data: (scans ?? []) as ScanRecord[] });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 },
    );
  }
}
