import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getCreditBalance } from "@/lib/credits/service";
import crypto from "crypto";

const FOUNDER_PRICE_CENTS = 7900; // $79/mo
const STANDARD_PRICE_CENTS = 9900; // $99/mo
const FOUNDER_CAP = 100;

/**
 * GET /api/profile — Get user profile with credits and subscription info
 */
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }

  const supabase = createServiceClient();

  // Get or create profile
  let { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!profile) {
    const referralCode = `k24-${crypto.randomBytes(4).toString("hex")}`;

    // Check if founder slots available
    const { count } = await supabase
      .from("user_profiles")
      .select("id", { count: "exact", head: true })
      .eq("founding_member", true);

    const isFounder = (count ?? 0) < FOUNDER_CAP;

    const { data: newProfile } = await supabase
      .from("user_profiles")
      .insert({
        user_id: userId,
        referral_code: referralCode,
        subscription_tier: isFounder ? "founder" : "standard",
        founding_member: isFounder,
        monthly_price_cents: isFounder ? FOUNDER_PRICE_CENTS : STANDARD_PRICE_CENTS,
      })
      .select("*")
      .single();
    profile = newProfile;
  }

  const credits = await getCreditBalance(userId);

  // Count founder slots remaining
  const { count: founderCount } = await supabase
    .from("user_profiles")
    .select("id", { count: "exact", head: true })
    .eq("founding_member", true);

  return NextResponse.json({
    data: {
      profile,
      credits,
      founderSlotsRemaining: Math.max(0, FOUNDER_CAP - (founderCount ?? 0)),
      pricing: {
        founder: FOUNDER_PRICE_CENTS,
        standard: STANDARD_PRICE_CENTS,
      },
    },
  });
}
