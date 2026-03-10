import { createServiceClient } from "@/lib/supabase/server";

type ActivityEventType =
  | "sale"
  | "subscription_started"
  | "subscription_canceled"
  | "blog_published"
  | "product_created"
  | "product_updated"
  | "scout_scan_completed"
  | "email_sequence_sent"
  | "social_post_generated"
  | "referral_converted"
  | "customer_signup"
  | "knowledge_ingested"
  | "storefront_published"
  | "support_ticket_opened"
  | "support_ticket_closed"
  | "ai_workspace_action"
  | "business_created"
  | "onboarding_completed";

export interface ActivityLogEntry {
  business_id: string;
  event_type: ActivityEventType;
  title: string;
  description?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Fire-and-forget activity logger.
 * Writes to the activity_log table for business-scoped event tracking.
 */
export function logActivity(entry: ActivityLogEntry): void {
  const supabase = createServiceClient();

  supabase
    .from("activity_log")
    .insert({
      business_id: entry.business_id,
      event_type: entry.event_type,
      title: entry.title,
      description: entry.description ?? null,
      metadata: entry.metadata ?? {},
    })
    .then(({ error }) => {
      if (error) {
        process.stderr.write(
          `[ActivityLogger] Insert failed: ${error.message} | code=${error.code}\n`
        );
      }
    });
}
