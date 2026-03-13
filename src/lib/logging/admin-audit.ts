import { createServiceClient } from "@/lib/supabase/server";

export type AdminAuditAction =
  | "user.view"
  | "user.impersonate"
  | "user.note.create"
  | "user.credit.issue"
  | "user.subscription.cancel"
  | "user.subscription.pause"
  | "user.subscription.resume"
  | "user.subscription.change_plan"
  | "support.list"
  | "services.check"
  | "analytics.view"
  | "stats.view"
  | "feed.view"
  | "llm_usage.view"
  | "platform_logs.view"
  | "users.list"
  | "activity.view"
  | "test_log.create";

export interface AdminAuditEntry {
  admin_user_id: string;
  action: AdminAuditAction;
  target_resource?: string | null;
  target_id?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Fire-and-forget admin audit logger.
 * Writes to the platform_logs table with event_category "ADMIN_AUDIT"
 * to track all administrative actions for compliance and security.
 */
export function logAdminAudit(entry: AdminAuditEntry): void {
  const supabase = createServiceClient();

  supabase
    .from("platform_logs")
    .insert({
      event_category: "ADMIN_AUDIT",
      event_type: `admin.${entry.action}`,
      clerk_user_id: entry.admin_user_id,
      status: "success",
      payload: {
        target_resource: entry.target_resource ?? null,
        target_id: entry.target_id ?? null,
        ...(entry.metadata ?? {}),
      },
    })
    .then(({ error }) => {
      if (error) {
        process.stderr.write(
          `[AdminAudit] Insert failed: ${error.message} | code=${error.code}\n`
        );
      }
    });
}
