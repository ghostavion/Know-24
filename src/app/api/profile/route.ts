import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import type { ApiResponse } from "@/types/api";

interface ProfileData {
  user_id: string;
  tier: "free" | "paid";
  stripe_customer_id: string | null;
  agent_count: number;
}

/**
 * GET /api/profile — Get user profile with subscription info
 */
export async function GET(): Promise<NextResponse<ApiResponse<ProfileData>>> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }

  const supabase = createServiceClient();

  // Get subscription tier
  const { data: sub } = await supabase
    .from("agent_subscriptions")
    .select("tier")
    .eq("user_id", userId)
    .single();

  const tier = ((sub as { tier?: string } | null)?.tier === "paid" ? "paid" : "free") as "free" | "paid";

  // Get stripe customer ID
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .single();

  const stripeCustomerId = (profile as { stripe_customer_id?: string } | null)?.stripe_customer_id ?? null;

  // Count user's agents
  const { count } = await supabase
    .from("agents")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", userId)
    .neq("status", "deleted");

  return NextResponse.json({
    data: {
      user_id: userId,
      tier,
      stripe_customer_id: stripeCustomerId,
      agent_count: count ?? 0,
    },
  });
}
