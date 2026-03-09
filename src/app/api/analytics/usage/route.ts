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
});

// ---------------------------------------------------------------------------
// Response type
// ---------------------------------------------------------------------------

interface UsageMetrics {
  aiTokensUsedThisMonth: number;
  aiTokensCeiling: number;
  socialPostsUsedThisMonth: number;
  socialPostsCeiling: number;
  scoutScansUsedThisMonth: number;
  scoutScansCeiling: number;
  usageResetAt: string;
}

// ---------------------------------------------------------------------------
// GET — Usage metrics for a business
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
    const parsed = querySchema.safeParse({
      businessId: url.searchParams.get("businessId") ?? undefined,
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

    const { businessId } = parsed.data;
    const supabase = createServiceClient();

    const ownership = await verifyBusinessOwnership(supabase, userId, businessId);
    if (!ownership.ok) return ownership.response;

    // Fetch the organization's usage fields
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select(
        "ai_tokens_used_this_month, ai_tokens_ceiling, social_posts_used_this_month, social_posts_ceiling, scout_scans_used_this_month, scout_scans_ceiling, usage_reset_at"
      )
      .eq("id", ownership.business.organization_id)
      .single();

    if (orgError || !org) {
      return NextResponse.json(
        { error: { code: "FETCH_FAILED", message: "Failed to fetch usage metrics" } },
        { status: 500 }
      );
    }

    const usage: UsageMetrics = {
      aiTokensUsedThisMonth: org.ai_tokens_used_this_month,
      aiTokensCeiling: org.ai_tokens_ceiling,
      socialPostsUsedThisMonth: org.social_posts_used_this_month,
      socialPostsCeiling: org.social_posts_ceiling,
      scoutScansUsedThisMonth: org.scout_scans_used_this_month,
      scoutScansCeiling: org.scout_scans_ceiling,
      usageResetAt: org.usage_reset_at,
    };

    return NextResponse.json({ data: usage });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}
