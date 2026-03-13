import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/guard";
import { logAdminAudit } from "@/lib/logging/admin-audit";
import type { ApiResponse } from "@/types/api";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Zod schema
// ---------------------------------------------------------------------------

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  status: z
    .enum(["open", "in_progress", "resolved", "closed"])
    .optional(),
  priority: z
    .enum(["low", "normal", "high", "urgent"])
    .optional(),
  search: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

interface SupportTicket {
  id: string;
  businessId: string;
  businessName: string | null;
  customerEmail: string;
  customerName: string | null;
  subject: string;
  body: string;
  status: string;
  priority: string;
  assignedTo: string | null;
  storefrontSlug: string | null;
  repliesCount: number;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
}

interface SupportSummary {
  open: number;
  inProgress: number;
  resolved: number;
  total: number;
}

interface SupportData {
  tickets: SupportTicket[];
  pagination: { page: number; perPage: number; total: number };
  summary: SupportSummary;
}

// ---------------------------------------------------------------------------
// Row type from Supabase join
// ---------------------------------------------------------------------------

interface TicketRow {
  id: string;
  business_id: string;
  customer_email: string;
  customer_name: string | null;
  subject: string;
  body: string;
  status: string;
  priority: string;
  assigned_to: string | null;
  storefront_slug: string | null;
  replies_count: number;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  businesses: { name: string } | null;
}

// ---------------------------------------------------------------------------
// GET — Admin: list support tickets with filters + summary counts
// ---------------------------------------------------------------------------

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<SupportData>>> {
  let adminUserId: string;
  try {
    adminUserId = await requireAdmin();
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
      status: url.searchParams.get("status") ?? undefined,
      priority: url.searchParams.get("priority") ?? undefined,
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

    logAdminAudit({
      admin_user_id: adminUserId,
      action: "support.list",
      target_resource: "support_tickets",
    });

    const { page, limit, status, priority, search } = parsed.data;
    const offset = (page - 1) * limit;
    const supabase = createServiceClient();

    // Build paginated ticket query with business join
    let query = supabase
      .from("support_tickets")
      .select(
        `id, business_id, customer_email, customer_name, subject, body,
         status, priority, assigned_to, storefront_slug, replies_count,
         created_at, updated_at, closed_at, businesses!left(name)`,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq("status", status);
    }

    if (priority) {
      query = query.eq("priority", priority);
    }

    if (search) {
      query = query.or(
        `subject.ilike.%${search}%,customer_email.ilike.%${search}%,customer_name.ilike.%${search}%`
      );
    }

    // Run ticket query and summary counts in parallel
    const [ticketResult, openCount, inProgressCount, resolvedCount, totalCount] =
      await Promise.all([
        query,
        supabase
          .from("support_tickets")
          .select("*", { count: "exact", head: true })
          .eq("status", "open"),
        supabase
          .from("support_tickets")
          .select("*", { count: "exact", head: true })
          .eq("status", "in_progress"),
        supabase
          .from("support_tickets")
          .select("*", { count: "exact", head: true })
          .eq("status", "resolved"),
        supabase
          .from("support_tickets")
          .select("*", { count: "exact", head: true }),
      ]);

    if (ticketResult.error) {
      return NextResponse.json(
        {
          error: {
            code: "FETCH_FAILED",
            message: "Failed to fetch support tickets",
            details: ticketResult.error.message,
          },
        },
        { status: 500 }
      );
    }

    const tickets: SupportTicket[] = (
      (ticketResult.data ?? []) as unknown as TicketRow[]
    ).map((row) => ({
      id: row.id,
      businessId: row.business_id,
      businessName: row.businesses?.name ?? null,
      customerEmail: row.customer_email,
      customerName: row.customer_name,
      subject: row.subject,
      body: row.body,
      status: row.status,
      priority: row.priority,
      assignedTo: row.assigned_to,
      storefrontSlug: row.storefront_slug,
      repliesCount: row.replies_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      closedAt: row.closed_at,
    }));

    const summary: SupportSummary = {
      open: openCount.count ?? 0,
      inProgress: inProgressCount.count ?? 0,
      resolved: resolvedCount.count ?? 0,
      total: totalCount.count ?? 0,
    };

    return NextResponse.json({
      data: {
        tickets,
        pagination: {
          page,
          perPage: limit,
          total: ticketResult.count ?? 0,
        },
        summary,
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
