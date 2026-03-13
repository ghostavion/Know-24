import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { stripe } from "@/lib/stripe/server";
import { createServiceClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import type { ApiResponse } from "@/types/api";
import type { OrderWithProduct } from "@/types/storefront";

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<OrderWithProduct>>> {
  try {
    // Rate limit — storefront tier (public route)
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";
    const rlResult = await checkRateLimit(ip, "storefront");
    if (!rlResult.success) {
      return NextResponse.json(
        {
          error: {
            code: "RATE_LIMITED",
            message: "Too many requests",
          },
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.ceil((rlResult.reset - Date.now()) / 1000)
            ),
          },
        }
      );
    }

    // Validate session_id query param
    const sessionId = request.nextUrl.searchParams.get("session_id");

    if (!sessionId || typeof sessionId !== "string" || sessionId.length > 200) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Missing or invalid session_id parameter",
          },
        },
        { status: 400 }
      );
    }

    // Verify the session exists and is paid via Stripe
    let stripeSession;
    try {
      stripeSession = await stripe.checkout.sessions.retrieve(sessionId);
    } catch {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_SESSION",
            message: "Checkout session not found",
          },
        },
        { status: 404 }
      );
    }

    if (stripeSession.payment_status !== "paid") {
      return NextResponse.json(
        {
          error: {
            code: "PAYMENT_INCOMPLETE",
            message: "Payment has not been completed",
          },
        },
        { status: 402 }
      );
    }

    // Look up the order by stripe_payment_intent_id
    const paymentIntentId =
      typeof stripeSession.payment_intent === "string"
        ? stripeSession.payment_intent
        : stripeSession.payment_intent?.id ?? null;

    if (!paymentIntentId) {
      // Session is paid but has no payment intent — return success without order details
      return NextResponse.json({ data: undefined });
    }

    const supabase = createServiceClient();

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(
        "id, status, amount_cents, currency, access_granted_at, product_id, products!inner(id, title, slug, product_type_id, product_types!inner(slug))"
      )
      .eq("stripe_payment_intent_id", paymentIntentId)
      .single();

    if (orderError || !order) {
      // The webhook may not have processed yet — return success without details
      // The frontend handles this gracefully (shows generic success)
      return NextResponse.json({ data: undefined });
    }

    // Shape the response to match OrderWithProduct
    const product = order.products as unknown as {
      id: string;
      title: string;
      slug: string;
      product_types: { slug: string };
    };

    const result: OrderWithProduct = {
      id: order.id as string,
      status: order.status as string,
      amountCents: order.amount_cents as number,
      currency: order.currency as string,
      accessGrantedAt: (order.access_granted_at as string) ?? null,
      product: {
        id: product.id,
        title: product.title,
        slug: product.slug,
        productType: product.product_types.slug,
      },
    };

    return NextResponse.json({ data: result });
  } catch (err) {
    Sentry.captureException(err);
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
