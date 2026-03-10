import { createServiceClient } from "@/lib/supabase/server";
import type { EventCategory, LogStatus } from "@/types/admin-logs";

export interface PlatformLogEntry {
  event_category: EventCategory;
  event_type: string;
  user_id?: string | null;
  clerk_user_id?: string | null;
  session_id?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  geo_country?: string | null;
  geo_city?: string | null;
  page_url?: string | null;
  page_route?: string | null;
  status?: LogStatus;
  duration_ms?: number | null;
  business_id?: string | null;
  organization_id?: string | null;
  payload?: Record<string, unknown>;
  error_code?: string | null;
  error_message?: string | null;
  environment?: string;
  server_id?: string | null;
  app_version?: string | null;
}

/**
 * Fire-and-forget platform event logger.
 * Never awaited in the request path — writes async to platform_logs table.
 */
export function logPlatformEvent(entry: PlatformLogEntry): void {
  const supabase = createServiceClient();

  // Sanitize ip_address: INET column rejects empty strings
  const sanitized = {
    ...entry,
    ip_address: entry.ip_address || null,
    environment: entry.environment ?? process.env.NODE_ENV ?? "production",
    app_version:
      entry.app_version ?? process.env.NEXT_PUBLIC_APP_VERSION ?? "0.1.0",
  };

  supabase
    .from("platform_logs")
    .insert(sanitized)
    .then(({ error }) => {
      if (error) {
        
        process.stderr.write(
          `[PlatformLogger] Insert failed: ${error.message} | code=${error.code}\n`
        );
      }
    });
}

/**
 * Extract common request metadata for server-side logging.
 * Reads Vercel geo headers when available.
 */
export function extractRequestMeta(request: Request): {
  ip_address: string | null;
  user_agent: string | null;
  page_url: string | null;
  geo_country: string | null;
  geo_city: string | null;
} {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    null;

  return {
    ip_address: ip,
    user_agent: request.headers.get("user-agent") ?? null,
    page_url: request.url ?? null,
    geo_country: request.headers.get("x-vercel-ip-country") ?? null,
    geo_city: request.headers.get("x-vercel-ip-city") ?? null,
  };
}
