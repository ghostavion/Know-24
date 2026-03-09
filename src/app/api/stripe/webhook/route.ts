import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe/server";
import { createServiceClient } from "@/lib/supabase/server";
import { logPlatformEvent } from "@/lib/logging/platform-logger";

export async function POST(
  request: NextRequest
): Promise<NextResponse> {
  let event: Stripe.Event;

  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: { code: "MISSING_SIGNATURE", message: "Missing stripe-signature header" } },
        { status: 400 }
      );
    }

    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_SIGNATURE", message: "Invalid webhook signature" } },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session, supabase);

        logPlatformEvent({
          event_category: "DATA",
          event_type: "stripe.checkout.completed",
          status: "success",
          business_id: session.metadata?.business_id ?? null,
          payload: {
            stripe_event_id: event.id,
            product_id: session.metadata?.product_id,
            amount_total: session.amount_total,
            currency: session.currency,
          },
        });
        break;
      }

      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        await handleAccountUpdated(account, supabase);

        logPlatformEvent({
          event_category: "DATA",
          event_type: "stripe.account.updated",
          status: "success",
          payload: {
            stripe_event_id: event.id,
            stripe_account_id: account.id,
            charges_enabled: account.charges_enabled,
            payouts_enabled: account.payouts_enabled,
          },
        });
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        await handleChargeRefunded(charge, supabase);

        logPlatformEvent({
          event_category: "DATA",
          event_type: "stripe.charge.refunded",
          status: "success",
          payload: {
            stripe_event_id: event.id,
            payment_intent_id:
              typeof charge.payment_intent === "string"
                ? charge.payment_intent
                : charge.payment_intent?.id ?? null,
            amount_refunded: charge.amount_refunded,
          },
        });
        break;
      }
    }
  } catch {
    // Log but don't fail the webhook — Stripe will retry on 5xx
    return NextResponse.json(
      { error: { code: "PROCESSING_ERROR", message: "Error processing webhook event" } },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  supabase: ReturnType<typeof createServiceClient>
): Promise<void> {
  const productId = session.metadata?.product_id;
  const businessId = session.metadata?.business_id;
  const customerId = session.metadata?.customer_id;
  const platformFeeCents = session.metadata?.platform_fee_cents
    ? parseInt(session.metadata.platform_fee_cents, 10)
    : 0;

  if (!productId || !businessId || !customerId) {
    // Not a Know24-originated session — skip silently
    return;
  }

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  const amountCents = session.amount_total ?? 0;

  // Create order
  const orderId = crypto.randomUUID();

  const { error: orderError } = await supabase.from("orders").insert({
    id: orderId,
    business_id: businessId,
    customer_id: customerId,
    product_id: productId,
    stripe_payment_intent_id: paymentIntentId,
    amount_cents: amountCents,
    currency: session.currency ?? "usd",
    platform_fee_cents: platformFeeCents,
    status: "completed",
    access_granted_at: new Date().toISOString(),
  });

  if (orderError) {
    throw new Error(`Failed to create order: ${orderError.message}`);
  }

  // Log to activity_log
  const amountDollars = (amountCents / 100).toFixed(2);

  await supabase.from("activity_log").insert({
    id: crypto.randomUUID(),
    business_id: businessId,
    event_type: "sale",
    title: "New sale",
    description: `Product purchased for $${amountDollars}`,
    metadata: {
      order_id: orderId,
      product_id: productId,
    },
  });
}

async function handleAccountUpdated(
  account: Stripe.Account,
  supabase: ReturnType<typeof createServiceClient>
): Promise<void> {
  if (!account.id) return;

  let newStatus: string;

  if (account.charges_enabled && account.payouts_enabled) {
    newStatus = "active";
  } else if (account.requirements?.disabled_reason) {
    newStatus = "restricted";
  } else {
    // Still onboarding or in a transitional state — keep pending
    newStatus = "pending";
  }

  await supabase
    .from("businesses")
    .update({ stripe_account_status: newStatus })
    .eq("stripe_account_id", account.id);
}

async function handleChargeRefunded(
  charge: Stripe.Charge,
  supabase: ReturnType<typeof createServiceClient>
): Promise<void> {
  const paymentIntentId =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : charge.payment_intent?.id ?? null;

  if (!paymentIntentId) return;

  // Find the order by stripe_payment_intent_id
  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("id, business_id, product_id, amount_cents")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .single();

  if (fetchError || !order) return;

  // Update order status to refunded
  await supabase
    .from("orders")
    .update({
      status: "refunded",
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.id);

  // Log refund to activity_log
  const amountDollars = ((order.amount_cents as number) / 100).toFixed(2);

  await supabase.from("activity_log").insert({
    id: crypto.randomUUID(),
    business_id: order.business_id as string,
    event_type: "refund",
    title: "Order refunded",
    description: `Refund of $${amountDollars} processed`,
    metadata: {
      order_id: order.id,
      product_id: order.product_id,
    },
  });
}
