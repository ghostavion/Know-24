import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { dispatchEmailSequence } from "@/lib/queue/dispatch";
import { checkRateLimit } from "@/lib/rate-limit";
import type { ApiResponse } from "@/types/api";

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const triggerSchema = z.object({
  sequenceId: z.string().uuid("Invalid sequence ID"),
  subscriberIds: z.array(z.string().uuid()).min(1).max(500),
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TriggerResponse {
  queued: number;
}

// ---------------------------------------------------------------------------
// POST /api/email/sequences/trigger
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<TriggerResponse>>> {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const rateLimit = await checkRateLimit(clerkUserId, "api");
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: { code: "RATE_LIMITED", message: "Too many requests" } },
        { status: 429 }
      );
    }

    const body: unknown = await request.json();
    const parsed = triggerSchema.safeParse(body);
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

    const { sequenceId, subscriberIds } = parsed.data;
    const supabase = createServiceClient();

    // ── Verify user identity ──────────────────────────────────────────

    const { data: userRow } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_user_id", clerkUserId)
      .single();

    if (!userRow) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "User not found" } },
        { status: 401 }
      );
    }

    // ── Verify sequence exists and user owns the business ─────────────

    const { data: sequence } = await supabase
      .from("email_sequences")
      .select("id, business_id, is_active")
      .eq("id", sequenceId)
      .single();

    if (!sequence) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Sequence not found" } },
        { status: 404 }
      );
    }

    const typedSequence = sequence as unknown as {
      id: string;
      business_id: string;
      is_active: boolean;
    };

    if (!typedSequence.is_active) {
      return NextResponse.json(
        { error: { code: "INACTIVE", message: "Sequence is not active" } },
        { status: 400 }
      );
    }

    // Ownership: business → organization → membership
    const { data: business } = await supabase
      .from("businesses")
      .select("id, organization_id")
      .eq("id", typedSequence.business_id)
      .single();

    if (!business) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Business not found" } },
        { status: 404 }
      );
    }

    const typedBusiness = business as unknown as {
      id: string;
      organization_id: string;
    };

    const { data: membership } = await supabase
      .from("organization_members")
      .select("id")
      .eq("organization_id", typedBusiness.organization_id)
      .eq("user_id", (userRow as unknown as { id: string }).id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Not a member of this business" } },
        { status: 403 }
      );
    }

    // ── Fetch subscriber emails ───────────────────────────────────────

    const { data: subscribers } = await supabase
      .from("subscribers")
      .select("id, email, name")
      .in("id", subscriberIds)
      .eq("business_id", typedSequence.business_id);

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "No matching subscribers found" } },
        { status: 404 }
      );
    }

    // ── Queue execution jobs ──────────────────────────────────────────

    const typedSubs = subscribers as unknown as {
      id: string;
      email: string;
      name: string | null;
    }[];

    for (const sub of typedSubs) {
      await dispatchEmailSequence({
        businessId: typedSequence.business_id,
        sequenceId,
        subscriberEmail: sub.email,
        subscriberName: sub.name ?? undefined,
      });
    }

    return NextResponse.json({
      data: { queued: typedSubs.length },
    });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}
