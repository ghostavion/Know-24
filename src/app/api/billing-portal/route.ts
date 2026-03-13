import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { stripe } from "@/lib/stripe/server";
import { createServiceClient } from "@/lib/supabase/server";
import type { ApiResponse } from "@/types/api";

export async function POST(): Promise<NextResponse<ApiResponse<{ url: string }>>> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Not signed in" } },
      { status: 401 }
    );
  }

  const supabase = createServiceClient();

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .single();

  const customerId = (profile as { stripe_customer_id?: string } | null)
    ?.stripe_customer_id;

  if (!customerId) {
    return NextResponse.json(
      {
        error: {
          code: "NO_SUBSCRIPTION",
          message: "No subscription found. Please subscribe first.",
        },
      },
      { status: 400 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl}/settings`,
  });

  return NextResponse.json({ data: { url: session.url } });
}
