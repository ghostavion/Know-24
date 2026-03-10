import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { resolveUserId } from "@/lib/auth/resolve-user";
import type { ApiResponse } from "@/types/api";

const businessIdSchema = z.string().uuid();

const createReferralSchema = z.object({
  businessId: z.string().uuid(),
  productId: z.string().uuid().optional(),
  commissionRate: z.number().min(0).max(1).default(0.1),
});

interface ReferralLink {
  id: string;
  business_id: string;
  product_id: string | null;
  code: string;
  clicks: number;
  signups: number;
  purchases: number;
  commission_rate: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<ReferralLink[]>>> {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const businessId = request.nextUrl.searchParams.get("businessId");
    const parsedId = businessIdSchema.safeParse(businessId);
    if (!parsedId.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Valid businessId query parameter is required",
          },
        },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Resolve Clerk user ID → internal UUID
    const userId = await resolveUserId(supabase, clerkUserId);
    if (!userId) {
      return NextResponse.json(
        { error: { code: "USER_NOT_FOUND", message: "User not found" } },
        { status: 404 }
      );
    }

    // Verify business ownership
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .select("id")
      .eq("id", parsedId.data)
      .eq("owner_id", userId)
      .single();

    if (bizError || !business) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Business not found" } },
        { status: 404 }
      );
    }

    const { data: links, error: fetchError } = await supabase
      .from("referral_links")
      .select("*")
      .eq("business_id", parsedId.data)
      .order("created_at", { ascending: false });

    if (fetchError) {
      return NextResponse.json(
        { error: { code: "FETCH_FAILED", message: "Failed to fetch referral links" } },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: (links ?? []) as ReferralLink[] });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<ReferralLink>>> {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const body: unknown = await request.json();
    const parsed = createReferralSchema.safeParse(body);
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

    const { businessId, productId, commissionRate } = parsed.data;
    const supabase = createServiceClient();

    // Resolve Clerk user ID → internal UUID
    const userId = await resolveUserId(supabase, clerkUserId);
    if (!userId) {
      return NextResponse.json(
        { error: { code: "USER_NOT_FOUND", message: "User not found" } },
        { status: 404 }
      );
    }

    // Verify business ownership and get slug
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .select("id, slug")
      .eq("id", businessId)
      .eq("owner_id", userId)
      .single();

    if (bizError || !business) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Business not found" } },
        { status: 404 }
      );
    }

    // Generate unique referral code
    const code = `${business.slug}-${crypto.randomUUID().slice(0, 8)}`;

    const { data: link, error: insertError } = await supabase
      .from("referral_links")
      .insert({
        business_id: businessId,
        product_id: productId ?? null,
        code,
        commission_rate: commissionRate,
      })
      .select()
      .single();

    if (insertError || !link) {
      return NextResponse.json(
        {
          error: {
            code: "CREATE_FAILED",
            message: "Failed to create referral link",
            details: insertError?.message,
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: link as ReferralLink });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}
