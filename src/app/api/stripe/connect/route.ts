import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { stripe } from "@/lib/stripe/server";
import { createServiceClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import type { ApiResponse } from "@/types/api";

const connectSchema = z.object({
  businessId: z.string().uuid("Invalid business ID"),
});

interface ConnectData {
  url: string;
}

interface BusinessRow {
  id: string;
  owner_id: string;
  stripe_account_id: string | null;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<ConnectData>>> {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const rlResult = await checkRateLimit(ip, "api");
    if (!rlResult.success) {
      return NextResponse.json(
        { error: { code: "RATE_LIMITED", message: "Too many requests" } },
        { status: 429 }
      );
    }

    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const body: unknown = await request.json();
    const parsed = connectSchema.safeParse(body);

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

    const { businessId } = parsed.data;
    const supabase = createServiceClient();

    // 1. Get business and verify ownership
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .select("id, owner_id, stripe_account_id")
      .eq("id", businessId)
      .single();

    if (bizError || !business) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Business not found" } },
        { status: 404 }
      );
    }

    const typedBusiness = business as unknown as BusinessRow;

    if (typedBusiness.owner_id !== userId) {
      return NextResponse.json(
        {
          error: {
            code: "FORBIDDEN",
            message: "Not authorized to manage this business",
          },
        },
        { status: 403 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
    let stripeAccountId = typedBusiness.stripe_account_id;

    // 2. If no existing Stripe account, create one
    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: "express",
        metadata: { business_id: businessId },
      });

      stripeAccountId = account.id;

      // Update business with the new Stripe account
      const { error: updateError } = await supabase
        .from("businesses")
        .update({
          stripe_account_id: stripeAccountId,
          stripe_account_status: "pending",
        })
        .eq("id", businessId);

      if (updateError) {
        return NextResponse.json(
          {
            error: {
              code: "UPDATE_FAILED",
              message: "Failed to save Stripe account to business",
            },
          },
          { status: 500 }
        );
      }
    }

    // 3. Create account link for onboarding (works for both new and existing accounts)
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${appUrl}/dashboard?connect=refresh`,
      return_url: `${appUrl}/dashboard?connect=complete`,
      type: "account_onboarding",
    });

    return NextResponse.json({
      data: { url: accountLink.url },
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
