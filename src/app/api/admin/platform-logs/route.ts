import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/guard";
import type { ApiResponse } from "@/types/api";
import type { PlatformLog, EventCategory, LogStatus } from "@/types/admin-logs";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Zod schema
// ---------------------------------------------------------------------------

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  eventCategory: z
    .enum([
      "AUTH",
      "USER_ACTION",
      "UI",
      "DATA",
      "LLM",
      "API",
      "ERROR",
      "SYSTEM",
      "SECURITY",
    ])
    .optional(),
  eventType: z.string().optional(),
  userId: z.string().uuid("Invalid user ID").optional(),
  businessId: z.string().uuid("Invalid business ID").optional(),
  status: z
    .enum(["success", "failure", "error", "warning", "info"])
    .optional(),
  search: z.string().optional(),
  startDate: z.string().datetime({ offset: true }).optional(),
  endDate: z.string().datetime({ offset: true }).optional(),
});

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

interface PlatformLogsData {
  logs: PlatformLog[];
  pagination: { page: number; perPage: number; total: number };
}

// ---------------------------------------------------------------------------
// Row type from Supabase join
// ---------------------------------------------------------------------------

interface PlatformLogRow {
  id: string;
  timestamp: string;
  event_category: EventCategory;
  event_type: string;
  user_id: string | null;
  clerk_user_id: string | null;
  session_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  geo_country: string | null;
  geo_city: string | null;
  page_url: string | null;
  page_route: string | null;
  status: LogStatus | null;
  duration_ms: number | null;
  business_id: string | null;
  organization_id: string | null;
  payload: Record<string, unknown>;
  error_code: string | null;
  error_message: string | null;
  environment: string;
  created_at: string;
  users: { email: string } | null;
  businesses: { name: string } | null;
}

// ---------------------------------------------------------------------------
// GET — Admin: query platform_logs with filters + pagination
// ---------------------------------------------------------------------------

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<PlatformLogsData>>> {
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
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
        },
      },
      { status: 500 }
    );
  }

  try {
    const url = new URL(request.url);
    const parsed = querySchema.safeParse({
      page: url.searchParams.get("page") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined,
      eventCategory: url.searchParams.get("eventCategory") ?? undefined,
      eventType: url.searchParams.get("eventType") ?? undefined,
      userId: url.searchParams.get("userId") ?? undefined,
      businessId: url.searchParams.get("businessId") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
      search: url.searchParams.get("search") ?? undefined,
      startDate: url.searchParams.get("startDate") ?? undefined,
      endDate: url.searchParams.get("endDate") ?? undefined,
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

    const {
      page,
      limit,
      eventCategory,
      eventType,
      userId,
      businessId,
      status,
      search,
      startDate,
      endDate,
    } = parsed.data;
    const offset = (page - 1) * limit;
    const supabase = createServiceClient();

    // Build query with left joins to users and businesses
    let query = supabase
      .from("platform_logs")
      .select(
        `id, timestamp, event_category, event_type, user_id, clerk_user_id,
         session_id, ip_address, user_agent, geo_country, geo_city,
         page_url, page_route, status, duration_ms, business_id,
         organization_id, payload, error_code, error_message, environment,
         created_at, users!left(email), businesses!left(name)`,
        { count: "exact" }
      )
      .order("timestamp", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply optional filters
    if (eventCategory) {
      query = query.eq("event_category", eventCategory);
    }

    if (eventType) {
      query = query.eq("event_type", eventType);
    }

    if (userId) {
      query = query.eq("user_id", userId);
    }

    if (businessId) {
      query = query.eq("business_id", businessId);
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (startDate) {
      query = query.gte("timestamp", startDate);
    }

    if (endDate) {
      query = query.lte("timestamp", endDate);
    }

    if (search) {
      query = query.or(
        `event_type.ilike.%${search}%,error_message.ilike.%${search}%,page_url.ilike.%${search}%`
      );
    }

    const { data: rows, count, error: fetchError } = await query;

    if (fetchError) {
      return NextResponse.json(
        {
          error: {
            code: "FETCH_FAILED",
            message: "Failed to fetch platform logs",
            details: fetchError.message,
          },
        },
        { status: 500 }
      );
    }

    const logs: PlatformLog[] = (
      (rows ?? []) as unknown as PlatformLogRow[]
    ).map((row) => ({
      id: row.id,
      timestamp: row.timestamp,
      event_category: row.event_category,
      event_type: row.event_type,
      user_id: row.user_id,
      clerk_user_id: row.clerk_user_id,
      session_id: row.session_id,
      ip_address: row.ip_address,
      user_agent: row.user_agent,
      geo_country: row.geo_country,
      geo_city: row.geo_city,
      page_url: row.page_url,
      page_route: row.page_route,
      status: row.status,
      duration_ms: row.duration_ms,
      business_id: row.business_id,
      organization_id: row.organization_id,
      payload: row.payload,
      error_code: row.error_code,
      error_message: row.error_message,
      environment: row.environment,
      created_at: row.created_at,
      user_email: row.users?.email ?? null,
      business_name: row.businesses?.name ?? null,
    }));

    return NextResponse.json({
      data: {
        logs,
        pagination: { page, perPage: limit, total: count ?? 0 },
      },
    });
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
        },
      },
      { status: 500 }
    );
  }
}
