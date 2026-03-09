import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import type { ApiResponse } from "@/types/api";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function verifyBusinessOwnership(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string,
  businessId: string
): Promise<
  | { ok: true; business: { id: string; organization_id: string } }
  | { ok: false; response: NextResponse }
> {
  const { data: business } = await supabase
    .from("businesses")
    .select("id, organization_id")
    .eq("id", businessId)
    .single();

  if (!business) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Business not found" } },
        { status: 404 }
      ),
    };
  }

  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_user_id", userId)
    .single();

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "User not found" } },
        { status: 401 }
      ),
    };
  }

  const { data: membership } = await supabase
    .from("organization_members")
    .select("id")
    .eq("organization_id", business.organization_id)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Not a member of this business" } },
        { status: 403 }
      ),
    };
  }

  return { ok: true, business };
}

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const getQuerySchema = z.object({
  businessId: z.string().uuid("Invalid business ID"),
  status: z
    .enum(["open", "in_progress", "resolved", "closed"])
    .optional(),
});

const createTicketSchema = z.object({
  businessId: z.string().uuid("Invalid business ID"),
  customerEmail: z.string().email("Invalid email"),
  customerName: z.string().max(200).optional(),
  subject: z.string().min(1, "Subject is required").max(500),
  body: z.string().min(1, "Body is required").max(10000),
  storefrontSlug: z.string().max(100).optional(),
});

// ---------------------------------------------------------------------------
// Row / response types
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
}

interface TicketResponse {
  id: string;
  businessId: string;
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

function mapTicket(t: TicketRow): TicketResponse {
  return {
    id: t.id,
    businessId: t.business_id,
    customerEmail: t.customer_email,
    customerName: t.customer_name,
    subject: t.subject,
    body: t.body,
    status: t.status,
    priority: t.priority,
    assignedTo: t.assigned_to,
    storefrontSlug: t.storefront_slug,
    repliesCount: t.replies_count,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
    closedAt: t.closed_at,
  };
}

// ---------------------------------------------------------------------------
// GET — List tickets for a business (auth required)
// ---------------------------------------------------------------------------

export async function GET(
  request: NextRequest
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const parsed = getQuerySchema.safeParse({
      businessId: url.searchParams.get("businessId") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
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

    const { businessId, status } = parsed.data;
    const supabase = createServiceClient();

    const ownership = await verifyBusinessOwnership(supabase, userId, businessId);
    if (!ownership.ok) return ownership.response;

    let query = supabase
      .from("support_tickets")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data: tickets, error: fetchError } = await query;

    if (fetchError) {
      return NextResponse.json(
        { error: { code: "FETCH_FAILED", message: "Failed to fetch tickets" } },
        { status: 500 }
      );
    }

    const mapped = (tickets as TicketRow[]).map(mapTicket);

    return NextResponse.json({ data: mapped });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// POST — Create a ticket (public, from storefront contact form)
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest
) {
  try {
    const rawBody: unknown = await request.json();
    const parsed = createTicketSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input",
            details: parsed.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { businessId, customerEmail, customerName, subject, body, storefrontSlug } =
      parsed.data;

    const supabase = createServiceClient();

    // Verify the business exists (no auth required, but business must exist)
    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("id", businessId)
      .single();

    if (!business) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Business not found" } },
        { status: 404 }
      );
    }

    const { data: ticket, error: insertError } = await supabase
      .from("support_tickets")
      .insert({
        business_id: businessId,
        customer_email: customerEmail,
        customer_name: customerName ?? null,
        subject,
        body,
        storefront_slug: storefrontSlug ?? null,
      })
      .select()
      .single();

    if (insertError || !ticket) {
      return NextResponse.json(
        { error: { code: "CREATE_FAILED", message: "Failed to create ticket" } },
        { status: 500 }
      );
    }

    // Log activity
    await supabase.from("activity_log").insert({
      business_id: businessId,
      event_type: "support_ticket_opened",
      title: `Support ticket opened: ${subject}`,
      description: `From ${customerEmail}`,
      metadata: { ticket_id: ticket.id },
    });

    return NextResponse.json({ data: mapTicket(ticket as TicketRow) }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}
