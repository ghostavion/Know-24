import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServiceClient } from "@/lib/supabase/server";
import { resolveUserId } from "@/lib/auth/resolve-user";
import { checkRateLimit } from "@/lib/rate-limit";
import type { ApiResponse } from "@/types/api";

type RewardTier = "none" | "free_month" | "rev_share_20" | "rev_share_30";

interface TierInfo {
  current: RewardTier;
  next: RewardTier | null;
  conversionsToNext: number;
}

interface ReferralConversion {
  id: string;
  referred_user_id: string;
  status: string;
  reward_granted: string | null;
  created_at: string;
}

interface ReferralStatsResponse {
  link: {
    code: string;
    url: string;
  } | null;
  stats: {
    totalClicks: number;
    totalConversions: number;
    currentTier: RewardTier;
    nextTier: RewardTier | null;
    conversionsToNextTier: number;
  };
  recentConversions: ReferralConversion[];
}

function calculateTierInfo(conversions: number): TierInfo {
  if (conversions >= 25) {
    return { current: "rev_share_30", next: null, conversionsToNext: 0 };
  }
  if (conversions >= 10) {
    return { current: "rev_share_20", next: "rev_share_30", conversionsToNext: 25 - conversions };
  }
  if (conversions >= 3) {
    return { current: "free_month", next: "rev_share_20", conversionsToNext: 10 - conversions };
  }
  return { current: "none", next: "free_month", conversionsToNext: 3 - conversions };
}

export async function GET(): Promise<NextResponse<ApiResponse<ReferralStatsResponse>>> {
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

    const supabase = createServiceClient();

    const userId = await resolveUserId(supabase, clerkUserId);
    if (!userId) {
      return NextResponse.json(
        { error: { code: "USER_NOT_FOUND", message: "User not found" } },
        { status: 404 }
      );
    }

    // Fetch referral link
    const { data: link } = await supabase
      .from("referral_links")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!link) {
      // No referral link yet — return empty stats
      return NextResponse.json({
        data: {
          link: null,
          stats: {
            totalClicks: 0,
            totalConversions: 0,
            currentTier: "none",
            nextTier: "free_month",
            conversionsToNextTier: 3,
          },
          recentConversions: [],
        },
      });
    }

    const typedLink = link as unknown as {
      id: string;
      code: string;
      clicks: number;
      signups: number;
    };

    // Fetch recent conversions
    const { data: conversions } = await supabase
      .from("referral_conversions")
      .select("id, referred_user_id, status, reward_granted, created_at")
      .eq("referral_link_id", typedLink.id)
      .order("created_at", { ascending: false })
      .limit(20);

    const tierInfo = calculateTierInfo(typedLink.signups);

    return NextResponse.json({
      data: {
        link: {
          code: typedLink.code,
          url: `https://know24.io?ref=${typedLink.code}`,
        },
        stats: {
          totalClicks: typedLink.clicks,
          totalConversions: typedLink.signups,
          currentTier: tierInfo.current,
          nextTier: tierInfo.next,
          conversionsToNextTier: tierInfo.conversionsToNext,
        },
        recentConversions: (conversions ?? []) as unknown as ReferralConversion[],
      },
    });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}
