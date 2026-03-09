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
// Zod schema
// ---------------------------------------------------------------------------

const querySchema = z.object({
  businessId: z.string().uuid("Invalid business ID"),
  search: z.string().max(200).optional(),
  format: z.enum(["json", "csv"]).optional(),
});

// ---------------------------------------------------------------------------
// Row / response types
// ---------------------------------------------------------------------------

interface SubscriberRow {
  id: string;
  business_id: string;
  email: string;
  first_name: string | null;
  source: string;
  subscribed_at: string;
  unsubscribed_at: string | null;
  created_at: string;
}

interface SubscriberResponse {
  id: string;
  businessId: string;
  email: string;
  firstName: string | null;
  source: string;
  subscribedAt: string;
  unsubscribedAt: string | null;
  createdAt: string;
}

function mapSubscriber(s: SubscriberRow): SubscriberResponse {
  return {
    id: s.id,
    businessId: s.business_id,
    email: s.email,
    firstName: s.first_name,
    source: s.source,
    subscribedAt: s.subscribed_at,
    unsubscribedAt: s.unsubscribed_at,
    createdAt: s.created_at,
  };
}

function toCsv(subscribers: SubscriberRow[]): string {
  const header = "id,email,first_name,source,subscribed_at,unsubscribed_at";
  const rows = subscribers.map(
    (s) =>
      `${s.id},${escapeCsvField(s.email)},${escapeCsvField(s.first_name ?? "")},${s.source},${s.subscribed_at},${s.unsubscribed_at ?? ""}`
  );
  return [header, ...rows].join("\n");
}

function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// ---------------------------------------------------------------------------
// GET — List email subscribers
// ---------------------------------------------------------------------------

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<SubscriberResponse[]>> | NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const parsed = querySchema.safeParse({
      businessId: url.searchParams.get("businessId") ?? undefined,
      search: url.searchParams.get("search") ?? undefined,
      format: url.searchParams.get("format") ?? undefined,
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

    const { businessId, search, format } = parsed.data;
    const supabase = createServiceClient();

    const ownership = await verifyBusinessOwnership(supabase, userId, businessId);
    if (!ownership.ok) return ownership.response;

    let query = supabase
      .from("email_subscribers")
      .select("*")
      .eq("business_id", businessId)
      .order("subscribed_at", { ascending: false });

    if (search) {
      query = query.ilike("email", `%${search}%`);
    }

    const { data: subscribers, error: fetchError } = await query;

    if (fetchError) {
      return NextResponse.json(
        { error: { code: "FETCH_FAILED", message: "Failed to fetch subscribers" } },
        { status: 500 }
      );
    }

    const typedSubscribers = subscribers as SubscriberRow[];

    // CSV export
    if (format === "csv") {
      const csv = toCsv(typedSubscribers);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": "attachment; filename=subscribers.csv",
        },
      });
    }

    return NextResponse.json({ data: typedSubscribers.map(mapSubscriber) });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}
