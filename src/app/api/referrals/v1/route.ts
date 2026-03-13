import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { addCredits } from "@/lib/credits/service";
import crypto from "crypto";

const REFERRAL_BONUS_CREDITS = 50; // Both sides get 50 credits

/**
 * GET /api/referrals/v1 — Get my referral code + stats
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

  // Get or create user profile with referral code
  let { data: profile } = await supabase
    .from("user_profiles")
    .select("referral_code, total_referrals, subscription_tier, founding_member")
    .eq("user_id", userId)
    .single();

  if (!profile) {
    const referralCode = `k24-${crypto.randomBytes(4).toString("hex")}`;
    const { data: newProfile } = await supabase
      .from("user_profiles")
      .insert({
        user_id: userId,
        referral_code: referralCode,
        subscription_tier: "standard",
      })
      .select("referral_code, total_referrals, subscription_tier, founding_member")
      .single();
    profile = newProfile;
  }

  if (!profile) {
    return NextResponse.json(
      { error: { code: "PROFILE_FAILED", message: "Failed to get profile" } },
      { status: 500 }
    );
  }

  const typedProfile = profile as {
    referral_code: string;
    total_referrals: number;
    subscription_tier: string;
    founding_member: boolean;
  };

  // Get referral history
  const { data: referrals } = await supabase
    .from("referrals")
    .select("id, status, reward_type, created_at, signed_up_at, converted_at")
    .eq("referrer_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  const stats = {
    totalReferrals: typedProfile.total_referrals,
    pendingCount: (referrals ?? []).filter(r => (r as { status: string }).status === "pending" || (r as { status: string }).status === "clicked").length,
    signedUpCount: (referrals ?? []).filter(r => (r as { status: string }).status === "signed_up").length,
    convertedCount: (referrals ?? []).filter(r => (r as { status: string }).status === "converted" || (r as { status: string }).status === "rewarded").length,
    rewardedCount: (referrals ?? []).filter(r => (r as { status: string }).status === "rewarded").length,
  };

  return NextResponse.json({
    data: {
      referralCode: typedProfile.referral_code,
      referralUrl: `https://know24.io/r/${typedProfile.referral_code}`,
      isFounder: typedProfile.founding_member,
      tier: typedProfile.subscription_tier,
      stats,
      referrals: referrals ?? [],
    },
  });
}

/**
 * POST /api/referrals/v1 — Record a referral event
 * Body: { code: string, event: "click" | "signup" | "convert", referredUserId?: string }
 */
export async function POST(request: Request) {
  let body: { code?: string; event?: string; referredUserId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_BODY", message: "Invalid JSON" } },
      { status: 400 }
    );
  }

  const { code, event, referredUserId } = body;

  if (!code || !event) {
    return NextResponse.json(
      { error: { code: "MISSING_FIELDS", message: "code and event are required" } },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  // Find the referrer by code
  const { data: referrerProfile } = await supabase
    .from("user_profiles")
    .select("user_id")
    .eq("referral_code", code)
    .single();

  if (!referrerProfile) {
    return NextResponse.json(
      { error: { code: "INVALID_CODE", message: "Invalid referral code" } },
      { status: 404 }
    );
  }

  const referrerUserId = (referrerProfile as { user_id: string }).user_id;

  if (event === "click") {
    // Create or update referral record
    const { data: existing } = await supabase
      .from("referrals")
      .select("id")
      .eq("referral_code", code)
      .eq("status", "pending")
      .limit(1)
      .single();

    if (!existing) {
      await supabase.from("referrals").insert({
        referrer_user_id: referrerUserId,
        referral_code: code,
        status: "clicked",
        clicked_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({ data: { recorded: true } });
  }

  if (event === "signup" && referredUserId) {
    // Update referral with the new user
    await supabase
      .from("referrals")
      .update({
        referred_user_id: referredUserId,
        status: "signed_up",
        signed_up_at: new Date().toISOString(),
      })
      .eq("referral_code", code)
      .in("status", ["pending", "clicked"])
      .limit(1);

    return NextResponse.json({ data: { recorded: true } });
  }

  if (event === "convert" && referredUserId) {
    // Find the referral
    const { data: referral } = await supabase
      .from("referrals")
      .select("id, status")
      .eq("referral_code", code)
      .eq("referred_user_id", referredUserId)
      .single();

    if (!referral || (referral as { status: string }).status === "rewarded") {
      return NextResponse.json({ data: { recorded: false, reason: "Already rewarded or not found" } });
    }

    // Reward both sides
    await addCredits(referrerUserId, REFERRAL_BONUS_CREDITS, "referral_reward", {
      referred_user_id: referredUserId,
      referral_code: code,
    });

    await addCredits(referredUserId, REFERRAL_BONUS_CREDITS, "referral_reward", {
      referrer_user_id: referrerUserId,
      referral_code: code,
    });

    // Update referral status
    await supabase
      .from("referrals")
      .update({
        status: "rewarded",
        reward_type: "bonus_credits",
        reward_applied_at: new Date().toISOString(),
        converted_at: new Date().toISOString(),
      })
      .eq("id", (referral as { id: string }).id);

    // Increment referrer's total count
    const { error: rpcError } = await supabase.rpc("increment_referrals", { p_user_id: referrerUserId });
    if (rpcError) {
      // RPC may not exist yet — manual increment as fallback
      const { data: prof } = await supabase
        .from("user_profiles")
        .select("total_referrals")
        .eq("user_id", referrerUserId)
        .single();
      if (prof) {
        await supabase
          .from("user_profiles")
          .update({ total_referrals: ((prof as { total_referrals: number }).total_referrals ?? 0) + 1 })
          .eq("user_id", referrerUserId);
      }
    }

    return NextResponse.json({
      data: {
        recorded: true,
        bonusCredits: REFERRAL_BONUS_CREDITS,
        bothSidesRewarded: true,
      },
    });
  }

  return NextResponse.json(
    { error: { code: "INVALID_EVENT", message: "Event must be click, signup, or convert" } },
    { status: 400 }
  );
}
