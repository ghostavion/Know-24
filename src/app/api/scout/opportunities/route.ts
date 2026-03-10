import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { resolveUserId } from "@/lib/auth/resolve-user";
import type { ApiResponse } from "@/types/api";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const businessIdSchema = z.string().uuid();
const scanIdSchema = z.string().uuid();
const statusSchema = z.enum(["pending", "approved", "dismissed", "acted"]);

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

interface Opportunity {
  id: string;
  scanId: string;
  businessId: string;
  platform: string;
  type: string;
  title: string;
  url: string | null;
  relevanceScore: number;
  context: string | null;
  suggestedMoves: unknown[];
  draftResponse: string | null;
  status: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface OpportunityRow {
  id: string;
  scan_id: string;
  business_id: string;
  platform: string;
  type: string;
  title: string;
  url: string | null;
  relevance_score: number;
  context: string | null;
  suggested_moves: unknown[];
  draft_response: string | null;
  status: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// GET — List opportunities for a scan or business
// ---------------------------------------------------------------------------

export async function GET(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<Opportunity[]>>> {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 },
      );
    }

    const params = request.nextUrl.searchParams;

    // Validate businessId (required)
    const businessId = params.get("businessId");
    const parsedBizId = businessIdSchema.safeParse(businessId);
    if (!parsedBizId.success) {
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

    // Validate optional scanId
    const scanId = params.get("scanId");
    if (scanId !== null) {
      const parsedScanId = scanIdSchema.safeParse(scanId);
      if (!parsedScanId.success) {
        return NextResponse.json(
          {
            error: {
              code: "VALIDATION_ERROR",
              message: "scanId must be a valid UUID",
            },
          },
          { status: 400 },
        );
      }
    }

    // Validate optional status
    const status = params.get("status");
    if (status !== null) {
      const parsedStatus = statusSchema.safeParse(status);
      if (!parsedStatus.success) {
        return NextResponse.json(
          {
            error: {
              code: "VALIDATION_ERROR",
              message: "status must be one of: pending, approved, dismissed, acted",
            },
          },
          { status: 400 },
        );
      }
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
      .eq("id", parsedBizId.data)
      .eq("owner_id", userId)
      .single();

    if (bizError || !business) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Business not found" } },
        { status: 404 },
      );
    }

    // Build query
    let query = supabase
      .from("scout_opportunities")
      .select("*")
      .eq("business_id", parsedBizId.data);

    if (scanId) {
      query = query.eq("scan_id", scanId);
    }

    if (status) {
      query = query.eq("status", status);
    }

    query = query.order("relevance_score", { ascending: false });

    const { data: rows, error: fetchError } = await query;

    if (fetchError) {
      return NextResponse.json(
        { error: { code: "FETCH_FAILED", message: "Failed to fetch opportunities" } },
        { status: 500 },
      );
    }

    // Map to camelCase
    const opportunities: Opportunity[] = ((rows ?? []) as OpportunityRow[]).map((row) => ({
      id: row.id,
      scanId: row.scan_id,
      businessId: row.business_id,
      platform: row.platform,
      type: row.type,
      title: row.title,
      url: row.url,
      relevanceScore: row.relevance_score,
      context: row.context,
      suggestedMoves: row.suggested_moves,
      draftResponse: row.draft_response,
      status: row.status,
      metadata: row.metadata,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return NextResponse.json({ data: opportunities });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 },
    );
  }
}
