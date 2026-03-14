import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import Stripe from "stripe";
import * as Sentry from "@sentry/nextjs";
import { stripe } from "@/lib/stripe/server";
import { createServiceClient } from "@/lib/supabase/server";
import { logPlatformEvent } from "@/lib/logging/platform-logger";
import { checkRateLimit } from "@/lib/rate-limit";
import type { ApiResponse } from "@/types/api";

const checkoutSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  storefrontSlug: z.string().min(1, "Storefront slug is required"),
  customerEmail: z.string().email("Invalid email address"),
});

interface CheckoutSessionData {
  sessionId: string;
  url: string | null;
}

interface StorefrontRow {
  id: string;
  business_id: string;
}

interface ProductRow {
  id: string;
  business_id: string;
  title: string;
  status: string;
  price_cents: number;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
}

interface BusinessRow {
  id: string;
  stripe_account_id: string | null;
  stripe_account_status: string | null;
}

interface CustomerRow {
  id: string;
  email: string;
  stripe_customer_id: string | null;
}

const PLATFORM_FEE_PERCENT = 10;

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<CheckoutSessionData>>> {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const rlResult = await checkRateLimit(ip, "api");
    if (!rlResult.success) {
      return NextResponse.json(
        { error: { code: "RATE_LIMITED", message: "Too many requests" } },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rlResult.reset - Date.now()) / 1000)) } }
      );
    }

    const body: unknown = await request.json();
    const parsed = checkoutSchema.safeParse(body);

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

    const { productId, storefrontSlug, customerEmail } = parsed.data;
    const supabase = createServiceClient();

    // 1. Get storefront by slug to find business_id
    const { data: storefront, error: storefrontError } = await supabase
      .from("storefronts")
      .select("id, business_id")
      .eq("subdomain", storefrontSlug)
      .single();

    if (storefrontError || !storefront) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Storefront not found" } },
        { status: 404 }
      );
    }

    const { business_id: businessId } = storefront as StorefrontRow;

    // 2. Get product and verify it belongs to this business and is active
    const { data: product, error: productError } = await supabase
      .from("products")
      .select(
        "id, business_id, title, status, price_cents, stripe_product_id, stripe_price_id"
      )
      .eq("id", productId)
      .eq("business_id", businessId)
      .is("deleted_at", null)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Product not found" } },
        { status: 404 }
      );
    }

    const typedProduct = product as unknown as ProductRow;

    if (typedProduct.status !== "active") {
      return NextResponse.json(
        {
          error: {
            code: "PRODUCT_UNAVAILABLE",
            message: "This product is not currently available for purchase",
          },
        },
        { status: 400 }
      );
    }

    // 3. Get business to check stripe_account_id
    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select("id, stripe_account_id, stripe_account_status")
      .eq("id", businessId)
      .single();

    if (businessError || !business) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Business not found" } },
        { status: 404 }
      );
    }

    const typedBusiness = business as unknown as BusinessRow;

    // 4. Get or create customer by email
    const { data: existingCustomer } = await supabase
      .from("customers")
      .select("id, email, stripe_customer_id")
      .eq("email", customerEmail)
      .single();

    let customer: CustomerRow;

    if (existingCustomer) {
      customer = existingCustomer as unknown as CustomerRow;
    } else {
      const customerId = crypto.randomUUID();
      const { data: newCustomer, error: customerError } = await supabase
        .from("customers")
        .insert({
          id: customerId,
          email: customerEmail,
        })
        .select("id, email, stripe_customer_id")
        .single();

      if (customerError || !newCustomer) {
        return NextResponse.json(
          {
            error: {
              code: "CUSTOMER_CREATE_FAILED",
              message: "Failed to create customer record",
            },
          },
          { status: 500 }
        );
      }

      customer = newCustomer as unknown as CustomerRow;
    }

    // 5. Get or create Stripe customer
    let stripeCustomerId = customer.stripe_customer_id;

    if (!stripeCustomerId) {
      const stripeCustomer = await stripe.customers.create({
        email: customerEmail,
        metadata: { agenttv_customer_id: customer.id },
      });

      stripeCustomerId = stripeCustomer.id;

      await supabase
        .from("customers")
        .update({ stripe_customer_id: stripeCustomerId })
        .eq("id", customer.id);
    }

    // 6. Create or get Stripe Product + Price if not yet synced
    let stripePriceId = typedProduct.stripe_price_id;

    if (!typedProduct.stripe_product_id || !typedProduct.stripe_price_id) {
      const stripeProduct = await stripe.products.create({
        name: typedProduct.title,
        metadata: { agenttv_product_id: typedProduct.id },
      });

      const stripePrice = await stripe.prices.create({
        product: stripeProduct.id,
        unit_amount: typedProduct.price_cents,
        currency: "usd",
      });

      stripePriceId = stripePrice.id;

      await supabase
        .from("products")
        .update({
          stripe_product_id: stripeProduct.id,
          stripe_price_id: stripePrice.id,
        })
        .eq("id", typedProduct.id);
    }

    // 7. Calculate platform fee (10% of price)
    const platformFeeCents = Math.round(
      (typedProduct.price_cents * PLATFORM_FEE_PERCENT) / 100
    );

    // 8. Build Checkout Session params
    const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
    const hasConnectAccount =
      typedBusiness.stripe_account_id &&
      typedBusiness.stripe_account_status === "active";

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      customer: stripeCustomerId,
      line_items: [{ price: stripePriceId!, quantity: 1 }],
      success_url: `${appUrl}/s/${storefrontSlug}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/s/${storefrontSlug}`,
      metadata: {
        product_id: typedProduct.id,
        business_id: businessId,
        customer_id: customer.id,
        platform_fee_cents: platformFeeCents.toString(),
      },
    };

    // Only include payment_intent_data with Connect if business has an active Stripe account
    if (hasConnectAccount) {
      sessionParams.payment_intent_data = {
        application_fee_amount: platformFeeCents,
        transfer_data: {
          destination: typedBusiness.stripe_account_id!,
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    logPlatformEvent({
      event_category: "DATA",
      event_type: "checkout.created",
      status: "success",
      business_id: businessId,
      payload: {
        session_id: session.id,
        product_id: typedProduct.id,
        customer_email: customerEmail,
        amount_cents: typedProduct.price_cents,
        platform_fee_cents: platformFeeCents,
      },
    });

    // 9. Return session data
    return NextResponse.json({
      data: {
        sessionId: session.id,
        url: session.url,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input",
            details: err.flatten(),
          },
        },
        { status: 400 }
      );
    }

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
