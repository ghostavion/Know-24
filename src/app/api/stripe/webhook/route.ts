import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import * as Sentry from "@sentry/nextjs";
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

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice, supabase);

        logPlatformEvent({
          event_category: "DATA",
          event_type: "stripe.invoice.payment_failed",
          status: "success",
          payload: {
            stripe_event_id: event.id,
            subscription_id:
              typeof invoice.subscription === "string"
                ? invoice.subscription
                : invoice.subscription?.id ?? null,
            customer_id:
              typeof invoice.customer === "string"
                ? invoice.customer
                : invoice.customer?.id ?? null,
            amount_due: invoice.amount_due,
            attempt_count: invoice.attempt_count,
          },
        });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription, supabase);

        logPlatformEvent({
          event_category: "DATA",
          event_type: "stripe.subscription.deleted",
          status: "success",
          payload: {
            stripe_event_id: event.id,
            subscription_id: subscription.id,
            customer_id:
              typeof subscription.customer === "string"
                ? subscription.customer
                : subscription.customer.id,
          },
        });
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription, supabase);

        logPlatformEvent({
          event_category: "DATA",
          event_type: "stripe.subscription.updated",
          status: "success",
          payload: {
            stripe_event_id: event.id,
            subscription_id: subscription.id,
            status: subscription.status,
            customer_id:
              typeof subscription.customer === "string"
                ? subscription.customer
                : subscription.customer.id,
          },
        });
        break;
      }

      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleUserSubscriptionCreated(subscription, supabase);

        logPlatformEvent({
          event_category: "DATA",
          event_type: "stripe.subscription.created",
          status: "success",
          payload: {
            stripe_event_id: event.id,
            subscription_id: subscription.id,
            plan: subscription.metadata?.plan,
          },
        });
        break;
      }
    }
  } catch (error) {
    Sentry.captureException(error);
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

  // V1 ebook purchase flow
  if (session.metadata?.type === "ebook_purchase") {
    await handleEbookCheckout(session, supabase);
    return;
  }

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

  // Send purchase confirmation email (fire-and-forget)
  const customerEmail =
    typeof session.customer_details?.email === "string"
      ? session.customer_details.email
      : null;

  if (customerEmail) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://know24.io";
    const internalSecret = process.env.INTERNAL_API_SECRET;

    if (internalSecret) {
      fetch(`${appUrl}/api/email/send-purchase`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${internalSecret}`,
        },
        body: JSON.stringify({
          orderId,
          customerEmail,
          productId,
          businessId,
        }),
      }).catch(() => {
        // Email delivery is best-effort — don't fail the webhook
      });
    }
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

async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice,
  supabase: ReturnType<typeof createServiceClient>
): Promise<void> {
  const subscriptionId =
    typeof invoice.subscription === "string"
      ? invoice.subscription
      : invoice.subscription?.id ?? null;

  if (!subscriptionId) return;

  // Find the organization with this subscription
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select("id, name")
    .eq("stripe_subscription_id", subscriptionId)
    .single();

  if (orgError || !org) return;

  const typedOrg = org as { id: string; name: string };

  // Update subscription status to past_due
  await supabase
    .from("organizations")
    .update({
      subscription_status: "past_due",
    })
    .eq("id", typedOrg.id);

  // Log to activity_log to notify user
  const amountDollars = (invoice.amount_due / 100).toFixed(2);

  await supabase.from("activity_log").insert({
    id: crypto.randomUUID(),
    business_id: typedOrg.id,
    event_type: "payment_failed",
    title: "Payment failed",
    description: `Invoice payment of $${amountDollars} failed (attempt ${invoice.attempt_count}). Please update your payment method.`,
    metadata: {
      subscription_id: subscriptionId,
      amount_due: invoice.amount_due,
      attempt_count: invoice.attempt_count,
    },
  });
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  supabase: ReturnType<typeof createServiceClient>
): Promise<void> {
  // Find the organization with this subscription
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select("id, name")
    .eq("stripe_subscription_id", subscription.id)
    .single();

  if (orgError || !org) return;

  const typedOrg = org as { id: string; name: string };

  // Deactivate subscription
  await supabase
    .from("organizations")
    .update({
      subscription_status: "canceled",
      stripe_subscription_id: null,
    })
    .eq("id", typedOrg.id);

  // Also update the associated business status if applicable
  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("organization_id", typedOrg.id)
    .single();

  if (business) {
    await supabase
      .from("businesses")
      .update({ status: "inactive" })
      .eq("id", (business as { id: string }).id);
  }

  // Log the cancellation
  await supabase.from("activity_log").insert({
    id: crypto.randomUUID(),
    business_id: typedOrg.id,
    event_type: "subscription_canceled",
    title: "Subscription canceled",
    description: `Your subscription has been canceled and access has been deactivated.`,
    metadata: {
      subscription_id: subscription.id,
    },
  });
}

async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
  supabase: ReturnType<typeof createServiceClient>
): Promise<void> {
  // Find the organization with this subscription
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select("id, name, subscription_status")
    .eq("stripe_subscription_id", subscription.id)
    .single();

  if (orgError || !org) return;

  const typedOrg = org as {
    id: string;
    name: string;
    subscription_status: string | null;
  };

  // Map Stripe subscription status to our internal status
  let newStatus: string;

  switch (subscription.status) {
    case "active":
      newStatus = "active";
      break;
    case "past_due":
      newStatus = "past_due";
      break;
    case "unpaid":
      newStatus = "unpaid";
      break;
    case "canceled":
      newStatus = "canceled";
      break;
    case "trialing":
      newStatus = "trialing";
      break;
    case "paused":
      newStatus = "paused";
      break;
    default:
      newStatus = "inactive";
      break;
  }

  // Determine the current plan from subscription items
  const priceId = subscription.items.data[0]?.price?.id ?? null;

  const updatePayload: Record<string, unknown> = {
    subscription_status: newStatus,
  };

  if (priceId) {
    updatePayload.stripe_price_id = priceId;
  }

  await supabase
    .from("organizations")
    .update(updatePayload)
    .eq("id", typedOrg.id);

  // Log upgrade/downgrade if the status actually changed
  const previousStatus = typedOrg.subscription_status;

  if (previousStatus !== newStatus) {
    await supabase.from("activity_log").insert({
      id: crypto.randomUUID(),
      business_id: typedOrg.id,
      event_type: "subscription_updated",
      title: "Subscription updated",
      description: `Subscription status changed from ${previousStatus ?? "none"} to ${newStatus}.`,
      metadata: {
        subscription_id: subscription.id,
        previous_status: previousStatus,
        new_status: newStatus,
        price_id: priceId,
      },
    });
  }
}

// ---------------------------------------------------------------------------
// V1 user-level subscription (Know24 platform subscription)
// ---------------------------------------------------------------------------

async function handleUserSubscriptionCreated(
  subscription: Stripe.Subscription,
  supabase: ReturnType<typeof createServiceClient>
): Promise<void> {
  const clerkUserId = subscription.metadata?.clerk_user_id;
  const plan = subscription.metadata?.plan; // "founder" | "standard"

  if (!clerkUserId) return;

  const updates: Record<string, unknown> = {
    stripe_subscription_id: subscription.id,
    subscription_status: subscription.status === "active" ? "active" : "inactive",
    subscription_tier: plan === "founder" ? "founder" : "standard",
    monthly_price_cents: plan === "founder" ? 7900 : 9900,
  };

  if (plan === "founder") {
    updates.founding_member = true;
  }

  await supabase
    .from("user_profiles")
    .update(updates)
    .eq("user_id", clerkUserId);
}

// ---------------------------------------------------------------------------
// V1 Ebook purchase checkout handler
// ---------------------------------------------------------------------------

async function handleEbookCheckout(
  session: Stripe.Checkout.Session,
  supabase: ReturnType<typeof createServiceClient>
): Promise<void> {
  const ebookId = session.metadata?.ebook_id;
  if (!ebookId) return;

  const amountCents = session.amount_total ?? 0;
  const customerEmail =
    typeof session.customer_details?.email === "string"
      ? session.customer_details.email
      : session.customer_email ?? null;

  // Update the pending order to completed
  const { data: updatedOrder } = await supabase
    .from("orders")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      stripe_payment_intent_id:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id ?? null,
    })
    .eq("stripe_checkout_session_id", session.id)
    .select("id, download_token")
    .single();

  // Send purchase confirmation email with download link
  if (customerEmail && updatedOrder) {
    const typedOrder = updatedOrder as { id: string; download_token: string };
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://know24.io";
    const downloadUrl = `${appUrl}/api/orders/download?token=${typedOrder.download_token}`;

    // Fetch ebook title for email
    const { data: ebook } = await supabase
      .from("ebooks")
      .select("title")
      .eq("id", ebookId)
      .single();

    const ebookTitle = (ebook as { title: string } | null)?.title ?? "Your Ebook";

    // Send email via Resend (reuse existing email infrastructure)
    const internalSecret = process.env.INTERNAL_API_SECRET;
    if (internalSecret) {
      fetch(`${appUrl}/api/email/send-ebook-purchase`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${internalSecret}`,
        },
        body: JSON.stringify({
          orderId: typedOrder.id,
          customerEmail,
          ebookId,
          ebookTitle,
          amountCents,
          downloadUrl,
        }),
      }).catch(() => {
        // Best-effort
      });
    }
  }
}
