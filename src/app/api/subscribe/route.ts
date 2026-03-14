import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { stripe } from "@/lib/stripe/server";
import { createServiceClient } from "@/lib/supabase/server";
import { withApiLogging } from "@/lib/logging/api-logger";
import type { ApiResponse } from "@/types/api";

const STRIPE_PRICE_ID = "price_1TAtQgBiUcig4eGXdPcFxVee";

interface SubscribeData {
  url: string;
}

async function _POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<SubscribeData>>> {
  void request; // consume unused param

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not signed in" } },
        { status: 401 }
      );
    }

    const supabase = createServiceClient();
    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress ?? "";

    // Check if user already has a subscription
    const { data: sub } = await supabase
      .from("agent_subscriptions")
      .select("stripe_subscription_id")
      .eq("user_id", userId)
      .single();

    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .single();

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
    const existingSubId = (sub as { stripe_subscription_id?: string } | null)
      ?.stripe_subscription_id;

    if (existingSubId) {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      });
      return NextResponse.json({ data: { url: portalSession.url } });
    }

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      allow_promotion_codes: true,
      line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
      metadata: {
        clerk_user_id: userId,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscribed=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      subscription_data: {
        metadata: {
          clerk_user_id: userId,
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

export const POST = withApiLogging(_POST, "api.subscribe");
