import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { z } from "zod";
import { stripe } from "@/lib/stripe/server";
import { createServiceClient } from "@/lib/supabase/server";
import type { ApiResponse } from "@/types/api";

const subscribeSchema = z.object({
  plan: z.enum(["founder", "standard"]),
});

interface SubscribeData {
  url: string;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<SubscribeData>>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not signed in" } },
        { status: 401 }
      );
    }

    const body: unknown = await request.json();
    const parsed = subscribeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Invalid plan" } },
        { status: 400 }
      );
    }

    const { plan } = parsed.data;
    const supabase = createServiceClient();
    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress ?? "";

    // Check founder slot availability
    if (plan === "founder") {
      const { count } = await supabase
        .from("user_profiles")
        .select("id", { count: "exact", head: true })
        .eq("founding_member", true);

      if ((count ?? 0) >= 100) {
        return NextResponse.json(
          {
            error: {
              code: "FOUNDER_FULL",
              message: "All 100 founder spots have been claimed",
            },
          },
          { status: 410 }
        );
      }
    }

    // Check if user already has a subscription
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("stripe_customer_id, stripe_subscription_id")
      .eq("user_id", userId)
      .single();

    // Get or create Stripe customer
    let stripeCustomerId = (profile as { stripe_customer_id?: string } | null)
      ?.stripe_customer_id;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: { clerk_user_id: userId },
      });
      stripeCustomerId = customer.id;

      await supabase
        .from("user_profiles")
        .upsert({
          user_id: userId,
          stripe_customer_id: stripeCustomerId,
        })
        .eq("user_id", userId);
    }

    // If already subscribed, redirect to billing portal
    if (
      (profile as { stripe_subscription_id?: string } | null)
        ?.stripe_subscription_id
    ) {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      });
      return NextResponse.json({ data: { url: portalSession.url } });
    }

    // Create Stripe Checkout session using existing prices
    const priceId =
      plan === "founder"
        ? "price_1TANQ7BiUcig4eGXKNykWbiQ"
        : "price_1TANQ8BiUcig4eGXwqdFhRkV";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      allow_promotion_codes: true,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        clerk_user_id: userId,
        plan,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscribed=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      subscription_data: {
        metadata: {
          clerk_user_id: userId,
          plan,
        },
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: { code: "CHECKOUT_ERROR", message: "Failed to create checkout" } },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: { url: session.url } });
  } catch (err) {
    console.error("[subscribe] Error:", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message } },
      { status: 500 }
    );
  }
}
