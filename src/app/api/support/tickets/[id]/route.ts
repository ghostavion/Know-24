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
  organizationId: string
): Promise<
  | { ok: true; userDbId: string }
  | { ok: false; response: NextResponse }
> {
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
    .eq("organization_id", organizationId)
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

  return { ok: true, userDbId: user.id };
}

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const patchSchema = z.object({
  status: z.enum(["open", "in_progress", "resolved", "closed"]).optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  reply: z
    .object({
      body: z.string().min(1, "Reply body is required").max(10000),
    })
    .optional(),
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

interface ReplyRow {
  id: string;
  ticket_id: string;
  sender_type: string;
  sender_name: string | null;
  body: string;
  created_at: string;
}

interface ReplyResponse {
  id: string;
  ticketId: string;
  senderType: string;
  senderName: string | null;
  body: string;
  createdAt: string;
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

function mapReply(r: ReplyRow): ReplyResponse {
  return {
    id: r.id,
    ticketId: r.ticket_id,
    senderType: r.sender_type,
    senderName: r.sender_name,
    body: r.body,
    createdAt: r.created_at,
  };
}

interface TicketWithReplies extends TicketResponse {
  replies: ReplyResponse[];
}

// ---------------------------------------------------------------------------
// GET — Single ticket with replies
// ---------------------------------------------------------------------------

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const { id: ticketId } = await params;
    const supabase = createServiceClient();

    // Fetch the ticket
    const { data: ticket, error: ticketError } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("id", ticketId)
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Ticket not found" } },
        { status: 404 }
      );
    }

    const typedTicket = ticket as TicketRow;

    // Verify business ownership via ticket's business_id
    const { data: business } = await supabase
      .from("businesses")
      .select("id, organization_id")
      .eq("id", typedTicket.business_id)
      .single();

    if (!business) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Business not found" } },
        { status: 404 }
      );
    }

    const ownership = await verifyBusinessOwnership(
      supabase,
      userId,
      business.organization_id
    );
    if (!ownership.ok) return ownership.response;

    // Fetch replies
    const { data: replies, error: repliesError } = await supabase
      .from("support_ticket_replies")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });

    if (repliesError) {
      return NextResponse.json(
        { error: { code: "FETCH_FAILED", message: "Failed to fetch replies" } },
        { status: 500 }
      );
    }

    const result: TicketWithReplies = {
      ...mapTicket(typedTicket),
      replies: (replies as ReplyRow[]).map(mapReply),
    };

    return NextResponse.json({ data: result });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// PATCH — Update ticket status / priority / add reply
// ---------------------------------------------------------------------------

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const rawBody: unknown = await request.json();
    const parsed = patchSchema.safeParse(rawBody);

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

    const { id: ticketId } = await params;
    const { status, priority, reply } = parsed.data;
    const supabase = createServiceClient();

    // Fetch existing ticket
    const { data: existingTicket, error: ticketError } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("id", ticketId)
      .single();

    if (ticketError || !existingTicket) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Ticket not found" } },
        { status: 404 }
      );
    }

    const typedTicket = existingTicket as TicketRow;

    // Verify business ownership via ticket's business_id
    const { data: business } = await supabase
      .from("businesses")
      .select("id, organization_id")
      .eq("id", typedTicket.business_id)
      .single();

    if (!business) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Business not found" } },
        { status: 404 }
      );
    }

    const ownership = await verifyBusinessOwnership(
      supabase,
      userId,
      business.organization_id
    );
    if (!ownership.ok) return ownership.response;

    // Insert reply if provided
    if (reply) {
      const { error: replyError } = await supabase
        .from("support_ticket_replies")
        .insert({
          ticket_id: ticketId,
          sender_type: "business",
          sender_name: null,
          body: reply.body,
        });

      if (replyError) {
        return NextResponse.json(
          { error: { code: "CREATE_FAILED", message: "Failed to create reply" } },
          { status: 500 }
        );
      }
    }

    // Build update payload
    const updatePayload: Record<string, unknown> = {};

    if (status) {
      updatePayload.status = status;
      if (status === "closed" || status === "resolved") {
        updatePayload.closed_at = new Date().toISOString();
      }
    }

    if (priority) {
      updatePayload.priority = priority;
    }

    if (reply) {
      updatePayload.replies_count = typedTicket.replies_count + 1;
    }

    // Only update if there are changes
    if (Object.keys(updatePayload).length > 0) {
      const { data: updatedTicket, error: updateError } = await supabase
        .from("support_tickets")
        .update(updatePayload)
        .eq("id", ticketId)
        .select()
        .single();

      if (updateError || !updatedTicket) {
        return NextResponse.json(
          { error: { code: "UPDATE_FAILED", message: "Failed to update ticket" } },
          { status: 500 }
        );
      }

      return NextResponse.json({ data: mapTicket(updatedTicket as TicketRow) });
    }

    // No changes — return existing ticket as-is
    return NextResponse.json({ data: mapTicket(typedTicket) });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}
