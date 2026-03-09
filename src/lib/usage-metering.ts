import { createServiceClient } from "@/lib/supabase/server"
import type { UsageMetrics, UsageEventType } from "@/types/operations"

// Track a usage event — increments the org counter and logs the event
export async function trackUsage(
  businessId: string,
  eventType: UsageEventType,
  quantity: number = 1,
  metadata: Record<string, unknown> = {}
): Promise<{ allowed: boolean; remaining: number }> {
  const supabase = createServiceClient()

  // Get business → organization
  const { data: business } = await supabase
    .from("businesses")
    .select("organization_id")
    .eq("id", businessId)
    .single()

  if (!business) return { allowed: false, remaining: 0 }

  // Get current org usage
  const { data: org } = await supabase
    .from("organizations")
    .select("ai_tokens_used_this_month, ai_tokens_ceiling, social_posts_used_this_month, social_posts_ceiling, scout_scans_used_this_month, scout_scans_ceiling")
    .eq("id", business.organization_id)
    .single()

  if (!org) return { allowed: false, remaining: 0 }

  // Check ceiling based on event type
  let currentUsed: number
  let ceiling: number
  let updateField: string

  switch (eventType) {
    case "ai_chat":
    case "blog_generated":
      currentUsed = Number(org.ai_tokens_used_this_month)
      ceiling = Number(org.ai_tokens_ceiling)
      updateField = "ai_tokens_used_this_month"
      break
    case "social_post":
      currentUsed = org.social_posts_used_this_month
      ceiling = org.social_posts_ceiling
      updateField = "social_posts_used_this_month"
      break
    case "scout_scan":
      currentUsed = org.scout_scans_used_this_month
      ceiling = org.scout_scans_ceiling
      updateField = "scout_scans_used_this_month"
      break
    case "email_sent":
      // No ceiling on emails (for now)
      currentUsed = 0
      ceiling = Infinity
      updateField = ""
      break
    default:
      currentUsed = 0
      ceiling = Infinity
      updateField = ""
  }

  const allowed = currentUsed + quantity <= ceiling
  const remaining = Math.max(0, ceiling - currentUsed - quantity)

  // Always log the event
  await supabase.from("usage_events").insert({
    business_id: businessId,
    event_type: eventType,
    quantity,
    metadata,
  })

  // Increment counter if there's a field to update
  if (updateField && allowed) {
    await supabase
      .from("organizations")
      .update({ [updateField]: currentUsed + quantity })
      .eq("id", business.organization_id)
  }

  return { allowed, remaining }
}

// Get usage metrics for a business
export async function getUsageMetrics(businessId: string): Promise<UsageMetrics | null> {
  const supabase = createServiceClient()

  const { data: business } = await supabase
    .from("businesses")
    .select("organization_id")
    .eq("id", businessId)
    .single()

  if (!business) return null

  const { data: org } = await supabase
    .from("organizations")
    .select("ai_tokens_used_this_month, ai_tokens_ceiling, social_posts_used_this_month, social_posts_ceiling, scout_scans_used_this_month, scout_scans_ceiling, usage_reset_at")
    .eq("id", business.organization_id)
    .single()

  if (!org) return null

  return {
    aiTokensUsed: Number(org.ai_tokens_used_this_month),
    aiTokensCeiling: Number(org.ai_tokens_ceiling),
    socialPostsUsed: org.social_posts_used_this_month,
    socialPostsCeiling: org.social_posts_ceiling,
    scoutScansUsed: org.scout_scans_used_this_month,
    scoutScansCeiling: org.scout_scans_ceiling,
    usageResetAt: org.usage_reset_at,
  }
}

// Check if usage is within ceiling without incrementing
export async function checkUsageCeiling(
  businessId: string,
  eventType: UsageEventType,
  quantity: number = 1
): Promise<{ allowed: boolean; currentUsed: number; ceiling: number }> {
  const supabase = createServiceClient()

  const { data: business } = await supabase
    .from("businesses")
    .select("organization_id")
    .eq("id", businessId)
    .single()

  if (!business) return { allowed: false, currentUsed: 0, ceiling: 0 }

  const { data: org } = await supabase
    .from("organizations")
    .select("ai_tokens_used_this_month, ai_tokens_ceiling, social_posts_used_this_month, social_posts_ceiling, scout_scans_used_this_month, scout_scans_ceiling")
    .eq("id", business.organization_id)
    .single()

  if (!org) return { allowed: false, currentUsed: 0, ceiling: 0 }

  let currentUsed: number
  let ceiling: number

  switch (eventType) {
    case "ai_chat":
    case "blog_generated":
      currentUsed = Number(org.ai_tokens_used_this_month)
      ceiling = Number(org.ai_tokens_ceiling)
      break
    case "social_post":
      currentUsed = org.social_posts_used_this_month
      ceiling = org.social_posts_ceiling
      break
    case "scout_scan":
      currentUsed = org.scout_scans_used_this_month
      ceiling = org.scout_scans_ceiling
      break
    case "email_sent":
      currentUsed = 0
      ceiling = Infinity
      break
    default:
      currentUsed = 0
      ceiling = Infinity
  }

  const allowed = currentUsed + quantity <= ceiling

  return { allowed, currentUsed, ceiling }
}
