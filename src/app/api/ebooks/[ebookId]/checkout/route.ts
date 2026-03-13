import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { stripe } from "@/lib/stripe/server";
import { createServiceClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import type { ApiResponse } from "@/types/api";

const checkoutSchema = z.object({
  customerEmail: z.string().email("Invalid email address"),
});

interface EbookRow {
  id: string;
  user_id: string;
  title: string;
  subtitle: string | null;
  author_name: string | null;
  target_price: number | null;
  status: string;
  pdf_url: string | null;
  cover_url: string | null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ ebookId: string }> }
): Promise<NextResponse<ApiResponse<{ sessionId: string; url: string | null }>>> {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const rlResult = await checkRateLimit(ip, "api");
    if (!rlResult.success) {
      return NextResponse.json(
        { error: { code: "RATE_LIMITED", message: "Too many requests" } },
        { status: 429 }
      );
    }

    const { ebookId } = await params;
    const body: unknown = await request.json();
    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Invalid email" } },
        { status: 400 }
      );
    }

    const { customerEmail } = parsed.data;
    const supabase = createServiceClient();

    // Fetch ebook
    const { data: ebook, error: ebookError } = await supabase
      .from("ebooks")
      .select(
        "id, user_id, title, subtitle, author_name, target_price, status, pdf_url, cover_url"
      )
      .eq("id", ebookId)
      .eq("status", "published")
      .single();

    if (ebookError || !ebook) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Ebook not found or not published" } },
        { status: 404 }
      );
    }

    const typedEbook = ebook as unknown as EbookRow;
    const priceCents = Math.round((typedEbook.target_price ?? 9.99) * 100);

    // Create Stripe product + price on the fly
    const stripeProduct = await stripe.products.create({
      name: typedEbook.title,
      description: typedEbook.subtitle ?? undefined,
      images: typedEbook.cover_url ? [typedEbook.cover_url] : undefined,
      metadata: { ebook_id: typedEbook.id },
    });

    const stripePrice = await stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: priceCents,
      currency: "usd",
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: customerEmail,
      line_items: [{ price: stripePrice.id, quantity: 1 }],
      success_url: `${appUrl}/ebook/${ebookId}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/ebook/${ebookId}`,
      metadata: {
        ebook_id: typedEbook.id,
        seller_user_id: typedEbook.user_id,
        type: "ebook_purchase",
      },
    });

    // Create pending order
    await supabase.from("orders").insert({
      ebook_id: typedEbook.id,
      buyer_email: customerEmail,
      amount_cents: priceCents,
      platform_fee_cents: Math.round(priceCents * 0.1),
      creator_payout_cents: priceCents - Math.round(priceCents * 0.1),
      stripe_checkout_session_id: session.id,
      status: "pending",
    });

    return NextResponse.json({
      data: { sessionId: session.id, url: session.url },
    });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Checkout failed" } },
      { status: 500 }
    );
  }
}
