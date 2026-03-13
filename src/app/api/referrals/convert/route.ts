import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { applyReferralReward } from "@/lib/referrals/rewards";
import type { ApiResponse } from "@/types/api";

const convertSchema = z.object({
  referralCode: z.string().min(1),
  referredUserId: z.string().uuid(),
});

type RewardTier = "none" | "free_month" | "rev_share_20" | "rev_share_30";

interface ConversionResponse {
  conversionId: string;
  rewardTier: RewardTier;
}

function calculateRewardTier(conversionCount: number): {
  tier: RewardTier;
  rewardGranted: string | null;
} {
  if (conversionCount >= 25) {
    return { tier: "rev_share_30", rewardGranted: "rev_share_30" };
  }
  if (conversionCount >= 10) {
    return { tier: "rev_share_20", rewardGranted: "rev_share_20" };
  }
  if (conversionCount >= 3) {
    return { tier: "free_month", rewardGranted: "free_month" };
  }
  return { tier: "none", rewardGranted: null };
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<ConversionResponse>>> {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const rateLimit = await checkRateLimit(clerkUserId, "api");
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: { code: "RATE_LIMITED", message: "Too many requests" } },
        { status: 429 }
      );
    }

    const body: unknown = await request.json();
    const parsed = convertSchema.safeParse(body);
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

    const { referralCode, referredUserId } = parsed.data;
    const supabase = createServiceClient();

    // Find the referral link by code
    const { data: link } = await supabase
      .from("referral_links")
      .select("id, user_id, signups")
      .eq("code", referralCode)
      .single();

    if (!link) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Referral link not found" } },
        { status: 404 }
      );
    }

    const typedLink = link as unknown as {
      id: string;
      user_id: string;
      signups: number;
    };

    // Prevent self-referral
    if (typedLink.user_id === referredUserId) {
      return NextResponse.json(
        { error: { code: "SELF_REFERRAL", message: "Cannot refer yourself" } },
        { status: 400 }
      );
    }

    // Calculate new conversion count and reward tier
    const newSignups = typedLink.signups + 1;
    const { tier, rewardGranted } = calculateRewardTier(newSignups);

    // Insert conversion record
    const { data: conversion, error: conversionError } = await supabase
      .from("referral_conversions")
      .insert({
        referral_link_id: typedLink.id,
        referrer_user_id: typedLink.user_id,
        referred_user_id: referredUserId,
        status: "signed_up",
        reward_granted: rewardGranted,
      })
      .select("id")
      .single();

    if (conversionError) {
      // Unique constraint violation means this referral already exists
      if (conversionError.code === "23505") {
        return NextResponse.json(
          { error: { code: "DUPLICATE", message: "This referral has already been recorded" } },
          { status: 409 }
        );
      }
      return NextResponse.json(
        {
          error: {
            code: "CREATE_FAILED",
            message: "Failed to record conversion",
            details: conversionError.message,
          },
        },
        { status: 500 }
      );
    }

    // Increment signups on the referral link
    await supabase
      .from("referral_links")
      .update({ signups: newSignups })
      .eq("id", typedLink.id);

    const conversionId = (conversion as unknown as { id: string }).id;

    // Apply reward when crossing a tier threshold
    if (rewardGranted) {
      const previousCount = typedLink.signups; // count before this conversion
      try {
        const rewardResult = await applyReferralReward(
          typedLink.user_id,
          tier,
          previousCount
        );
        if (!rewardResult.applied) {
          console.warn(
            `[referral-convert] Reward not applied for user ${typedLink.user_id}: ${rewardResult.detail}`
          );
        }
      } catch (rewardErr) {
        // Don't fail the conversion if reward application fails
        console.error(
          "[referral-convert] Error applying reward:",
          rewardErr instanceof Error ? rewardErr.message : rewardErr
        );
      }
    }

    return NextResponse.json({
      data: {
        conversionId,
        rewardTier: tier,
      },
    });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}
