import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/guard";
import type { ApiResponse } from "@/types/api";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Zod schema
// ---------------------------------------------------------------------------

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  eventType: z.string().optional(),
  businessId: z.string().uuid("Invalid business ID").optional(),
  search: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

interface ActivityEvent {
  id: string;
  businessId: string;
  businessName: string | null;
  eventType: string;
  title: string;
  description: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

interface ActivityData {
  events: ActivityEvent[];
  pagination: { page: number; limit: number; total: number };
}

// ---------------------------------------------------------------------------
// Row type from Supabase join
// ---------------------------------------------------------------------------

interface ActivityRow {
  id: string;
  business_id: string;
  event_type: string;
  title: string;
  description: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  businesses: { name: string } | null;
}

// ---------------------------------------------------------------------------
// GET — Admin: platform-wide activity log
// ---------------------------------------------------------------------------

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<ActivityData>>> {
  try {
    await requireAdmin();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }
    if (message === "FORBIDDEN") {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Admin access required" } },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }

  try {
    const url = new URL(request.url);
    const parsed = querySchema.safeParse({
      page: url.searchParams.get("page") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined,
      eventType: url.searchParams.get("eventType") ?? undefined,
      businessId: url.searchParams.get("businessId") ?? undefined,
      search: url.searchParams.get("search") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid query parameters",
            details: parsed.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { page, limit, eventType, businessId, search } = parsed.data;
    const offset = (page - 1) * limit;
    const supabase = createServiceClient();

    // Build query with join to businesses for the business name
    let query = supabase
      .from("activity_log")
      .select(
        "id, business_id, event_type, title, description, metadata, created_at, businesses(name)",
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply optional filters
    if (eventType) {
      query = query.eq("event_type", eventType);
    }

    if (businessId) {
      query = query.eq("business_id", businessId);
    }

    if (search) {
      query = query.or(
        `title.ilike.%${search}%,description.ilike.%${search}%`
      );
    }

    const { data: rows, count, error: fetchError } = await query;

    if (fetchError) {
      return NextResponse.json(
        { error: { code: "FETCH_FAILED", message: "Failed to fetch activity log" } },
        { status: 500 }
      );
    }

    const events: ActivityEvent[] = ((rows ?? []) as unknown as ActivityRow[]).map(
      (row) => ({
        id: row.id,
        businessId: row.business_id,
        businessName: row.businesses?.name ?? null,
        eventType: row.event_type,
        title: row.title,
        description: row.description,
        metadata: row.metadata,
        createdAt: row.created_at,
      })
    );

    return NextResponse.json({
      data: {
        events,
        pagination: { page, limit, total: count ?? 0 },
      },
    });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}
