import { createServiceClient } from "@/lib/supabase/server";

interface ReferralLinkRow {
  id: string;
  business_id: string;
  product_id: string | null;
  code: string;
  clicks: number;
  signups: number;
  purchases: number;
  commission_rate: number;
}

// Track a referral click
export async function trackReferralClick(code: string): Promise<{ businessId: string | null }> {
  const supabase = createServiceClient();

  const { data: link } = await supabase
    .from("referral_links")
    .select("id, business_id, clicks")
    .eq("code", code)
    .eq("is_active", true)
    .single();

  if (!link) return { businessId: null };

  const typedLink = link as unknown as { id: string; business_id: string; clicks: number };

  await supabase
    .from("referral_links")
    .update({ clicks: typedLink.clicks + 1 })
    .eq("id", typedLink.id);

  return { businessId: typedLink.business_id };
}

// Track a referral signup (when a referred visitor subscribes)
export async function trackReferralSignup(
  code: string,
  customerId: string
): Promise<void> {
  const supabase = createServiceClient();

  const { data: link } = await supabase
    .from("referral_links")
    .select("id, business_id, signups")
    .eq("code", code)
    .eq("is_active", true)
    .single();

  if (!link) return;

  const typedLink = link as unknown as ReferralLinkRow;

  await supabase
    .from("referral_links")
    .update({ signups: typedLink.signups + 1 })
    .eq("id", typedLink.id);
}

// Track a referral purchase and create commission
export async function trackReferralPurchase(
  code: string,
  customerId: string,
  orderId: string,
  amountCents: number
): Promise<{ commissionCents: number }> {
  const supabase = createServiceClient();

  const { data: link } = await supabase
    .from("referral_links")
    .select("id, business_id, purchases, commission_rate")
    .eq("code", code)
    .eq("is_active", true)
    .single();

  if (!link) return { commissionCents: 0 };

  const typedLink = link as unknown as ReferralLinkRow;
  const commissionCents = Math.round(amountCents * typedLink.commission_rate);

  // Update link stats
  await supabase
    .from("referral_links")
    .update({ purchases: typedLink.purchases + 1 })
    .eq("id", typedLink.id);

  // Create conversion record
  await supabase.from("referral_conversions").insert({
    link_id: typedLink.id,
    business_id: typedLink.business_id,
    customer_id: customerId,
    order_id: orderId,
    commission_cents: commissionCents,
    status: "pending",
  });

  return { commissionCents };
}

// Generate a unique referral code
export function generateReferralCode(businessSlug: string): string {
  const random = crypto.randomUUID().slice(0, 8);
  return `${businessSlug}-${random}`;
}
