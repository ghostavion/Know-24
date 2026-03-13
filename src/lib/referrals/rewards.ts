import { createServiceClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/server";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RewardTier = "none" | "free_month" | "rev_share_20" | "rev_share_30";

interface ApplyRewardResult {
  applied: boolean;
  tier: RewardTier;
  detail?: string;
}

// ---------------------------------------------------------------------------
// Main entry point — apply rewards when a referrer crosses a tier threshold
// ---------------------------------------------------------------------------

export async function applyReferralReward(
  referrerUserId: string,
  currentTier: RewardTier,
  previousConversionCount: number
): Promise<ApplyRewardResult> {
  // Determine the previous tier so we only apply rewards on *new* threshold crossings
  const previousTier = calculateTier(previousConversionCount);
  if (currentTier === previousTier || currentTier === "none") {
    return { applied: false, tier: currentTier, detail: "No new tier reached" };
  }

  const supabase = createServiceClient();

  switch (currentTier) {
    case "free_month":
      return applyFreeMonth(supabase, referrerUserId);
    case "rev_share_20":
      return applyRevShare(supabase, referrerUserId, 20);
    case "rev_share_30":
      return applyRevShare(supabase, referrerUserId, 30);
    default:
      return { applied: false, tier: currentTier };
  }
}

// ---------------------------------------------------------------------------
// Free month — create a 100%-off Stripe coupon and apply to subscription
// ---------------------------------------------------------------------------

async function applyFreeMonth(
  supabase: ReturnType<typeof createServiceClient>,
  referrerUserId: string
): Promise<ApplyRewardResult> {
  const stripe = getStripe();

  // Resolve referrer's organization and Stripe subscription
  const orgInfo = await resolveOrgSubscription(supabase, referrerUserId);
  if (!orgInfo) {
    return {
      applied: false,
      tier: "free_month",
      detail: "Referrer has no active subscription",
    };
  }

  const { orgId, stripeSubscriptionId, stripeCustomerId } = orgInfo;

  try {
    // Create a one-time 100%-off coupon
    const coupon = await stripe.coupons.create({
      percent_off: 100,
      duration: "once",
      name: `Referral reward — 1 free month (user ${referrerUserId.slice(0, 8)})`,
      metadata: {
        know24_referrer_user_id: referrerUserId,
        know24_reward_type: "free_month",
      },
    });

    // Apply the coupon to the customer's subscription
    await stripe.subscriptions.update(stripeSubscriptionId, {
      coupon: coupon.id,
    });

    // Log in activity_log
    await supabase.from("activity_log").insert({
      business_id: await resolveBusinessId(supabase, orgId),
      type: "referral_reward_applied",
      message: `Free month reward applied — Stripe coupon ${coupon.id}`,
      metadata: {
        reward_tier: "free_month",
        referrer_user_id: referrerUserId,
        stripe_coupon_id: coupon.id,
        stripe_customer_id: stripeCustomerId,
      },
    });

    return {
      applied: true,
      tier: "free_month",
      detail: `Stripe coupon ${coupon.id} applied to subscription ${stripeSubscriptionId}`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown Stripe error";
    console.error("[referral-rewards] Failed to apply free month:", message);
    return { applied: false, tier: "free_month", detail: message };
  }
}

// ---------------------------------------------------------------------------
// Rev share — record the percentage in DB for payout tracking
// ---------------------------------------------------------------------------

async function applyRevShare(
  supabase: ReturnType<typeof createServiceClient>,
  referrerUserId: string,
  percentage: number
): Promise<ApplyRewardResult> {
  const tier: RewardTier = percentage === 30 ? "rev_share_30" : "rev_share_20";

  // Upsert into referral_rev_shares table
  const { error } = await supabase.from("referral_rev_shares").upsert(
    {
      user_id: referrerUserId,
      rev_share_percent: percentage,
      tier,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    console.error("[referral-rewards] Failed to record rev share:", error.message);
    return { applied: false, tier, detail: error.message };
  }

  // Resolve org for activity logging
  const orgInfo = await resolveOrgSubscription(supabase, referrerUserId);
  const businessId = orgInfo
    ? await resolveBusinessId(supabase, orgInfo.orgId)
    : null;

  if (businessId) {
    await supabase.from("activity_log").insert({
      business_id: businessId,
      type: "referral_reward_applied",
      message: `Revenue share upgraded to ${percentage}%`,
      metadata: {
        reward_tier: tier,
        referrer_user_id: referrerUserId,
        rev_share_percent: percentage,
      },
    });
  }

  return {
    applied: true,
    tier,
    detail: `${percentage}% revenue share recorded for user ${referrerUserId}`,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function calculateTier(conversionCount: number): RewardTier {
  if (conversionCount >= 25) return "rev_share_30";
  if (conversionCount >= 10) return "rev_share_20";
  if (conversionCount >= 3) return "free_month";
  return "none";
}

async function resolveOrgSubscription(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string
): Promise<{
  orgId: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
} | null> {
  // user_id in referral_links is the Supabase user ID
  // Find their organization through organization_members
  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .limit(1)
    .single();

  if (!membership) return null;

  const orgId = (membership as unknown as { organization_id: string }).organization_id;

  const { data: org } = await supabase
    .from("organizations")
    .select("id, stripe_subscription_id, stripe_customer_id")
    .eq("id", orgId)
    .single();

  if (!org) return null;

  const typedOrg = org as unknown as {
    id: string;
    stripe_subscription_id: string | null;
    stripe_customer_id: string | null;
  };

  if (!typedOrg.stripe_subscription_id || !typedOrg.stripe_customer_id) return null;

  return {
    orgId: typedOrg.id,
    stripeSubscriptionId: typedOrg.stripe_subscription_id,
    stripeCustomerId: typedOrg.stripe_customer_id,
  };
}

async function resolveBusinessId(
  supabase: ReturnType<typeof createServiceClient>,
  orgId: string
): Promise<string | null> {
  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("organization_id", orgId)
    .limit(1)
    .single();

  return business ? (business as unknown as { id: string }).id : null;
}
