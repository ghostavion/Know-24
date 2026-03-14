import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createServiceClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/server";
import type { ApiResponse } from "@/types/api";

type RouteContext = { params: Promise<{ id: string }> };

// ---------------------------------------------------------------------------
// POST /api/marketplace/[id]/purchase — purchase a marketplace item
// ---------------------------------------------------------------------------

interface PurchaseResponse {
  client_secret: string;
  purchase_id: string;
}

export async function POST(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<PurchaseResponse>>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not signed in" } },
        { status: 401 }
      );
    }

    const { id: itemId } = await context.params;
    const supabase = createServiceClient();

    // Fetch item
    const { data: item } = await supabase
      .from("marketplace_items")
      .select("id, seller_id, title, price_cents, status")
      .eq("id", itemId)
      .single();

    if (!item) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Marketplace item not found" } },
        { status: 404 }
      );
    }

    type ItemRow = {
      id: string;
      seller_id: string;
      title: string;
      price_cents: number;
      status: string;
    };
    const itemRow = item as ItemRow;

    if (itemRow.status !== "active") {
      return NextResponse.json(
        { error: { code: "ITEM_UNAVAILABLE", message: "This item is no longer available" } },
        { status: 410 }
      );
    }

    if (itemRow.seller_id === userId) {
      return NextResponse.json(
        { error: { code: "SELF_PURCHASE", message: "You cannot purchase your own listing" } },
        { status: 400 }
      );
    }

    if (itemRow.price_cents <= 0) {
      // Free item — skip Stripe, record purchase directly
      const { data: purchase, error: purchaseErr } = await supabase
        .from("marketplace_purchases")
        .insert({
          buyer_id: userId,
          item_id: itemRow.id,
          price_cents: 0,
          stripe_payment_intent_id: "free",
          status: "completed",
        })
        .select("id")
        .single();

      if (purchaseErr) {
        console.error("[purchase] Free purchase error:", purchaseErr);
        return NextResponse.json(
          { error: { code: "DB_ERROR", message: purchaseErr.message } },
          { status: 500 }
        );
      }

      // Increment purchase count
      await supabase.rpc("increment_purchase_count", { item_row_id: itemRow.id });

      return NextResponse.json({
        data: {
          client_secret: "free",
          purchase_id: (purchase as { id: string }).id,
        },
      });
    }

    // ---------- Stripe PaymentIntent ----------
    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress ?? "";

    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .single();

    let customerId = (profile as { stripe_customer_id?: string } | null)
      ?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: { clerk_user_id: userId },
      });
      customerId = customer.id;

      await supabase
        .from("user_profiles")
        .upsert({ user_id: userId, stripe_customer_id: customerId })
        .eq("user_id", userId);
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: itemRow.price_cents,
      currency: "usd",
      customer: customerId,
      metadata: {
        clerk_user_id: userId,
        marketplace_item_id: itemRow.id,
        item_title: itemRow.title,
      },
      automatic_payment_methods: { enabled: true },
    });

    // Record pending purchase
    const { data: purchase, error: purchaseErr } = await supabase
      .from("marketplace_purchases")
      .insert({
        buyer_id: userId,
        item_id: itemRow.id,
        price_cents: itemRow.price_cents,
        stripe_payment_intent_id: paymentIntent.id,
        status: "pending",
      })
      .select("id")
      .single();

    if (purchaseErr) {
      console.error("[purchase] Insert error:", purchaseErr);
      return NextResponse.json(
        { error: { code: "DB_ERROR", message: purchaseErr.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: {
        client_secret: paymentIntent.client_secret!,
        purchase_id: (purchase as { id: string }).id,
      },
    });
  } catch (err) {
    console.error("[purchase] Error:", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message } },
      { status: 500 }
    );
  }
}
