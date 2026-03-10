export const dynamic = "force-dynamic";

import { createServiceClient } from "@/lib/supabase/server";
import { LogsTable } from "@/components/admin/LogsTable";
import { LogsFilters } from "@/components/admin/LogsFilters";
import { AdminPagination } from "@/components/admin/AdminPagination";
import type { PlatformLog } from "@/types/admin-logs";

interface LogsPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

function rangeToDate(range: string): Date {
  const now = new Date();
  switch (range) {
    case "1h":
      return new Date(now.getTime() - 60 * 60 * 1000);
    case "6h":
      return new Date(now.getTime() - 6 * 60 * 60 * 1000);
    case "24h":
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case "7d":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }
}

export default async function PlatformLogsPage({ searchParams }: LogsPageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(params.limit ?? "50", 10)));
  const offset = (page - 1) * limit;

  const supabase = createServiceClient();

  let query = supabase
    .from("platform_logs")
    .select(
      "*, users!platform_logs_user_id_fkey(email), businesses!platform_logs_business_id_fkey(name)",
      { count: "exact" }
    )
    .order("timestamp", { ascending: false })
    .range(offset, offset + limit - 1);

  // Apply filters
  if (params.eventCategory) {
    query = query.eq("event_category", params.eventCategory);
  }
  if (params.status) {
    query = query.eq("status", params.status);
  }
  if (params.search) {
    query = query.or(
      `event_type.ilike.%${params.search}%,error_message.ilike.%${params.search}%`
    );
  }

  // Date range
  if (params.startDate) {
    query = query.gte("timestamp", params.startDate);
  } else if (params.range) {
    query = query.gte("timestamp", rangeToDate(params.range).toISOString());
  } else {
    query = query.gte("timestamp", rangeToDate("24h").toISOString());
  }
  if (params.endDate) {
    query = query.lte("timestamp", params.endDate);
  }

  const { data: rawLogs, count } = await query;

  const logs: PlatformLog[] = ((rawLogs ?? []) as Record<string, unknown>[]).map(
    (row) => {
      const users = row.users as { email: string } | null;
      const businesses = row.businesses as { name: string } | null;
      return {
        id: row.id as string,
        timestamp: row.timestamp as string,
        event_category: row.event_category as PlatformLog["event_category"],
        event_type: row.event_type as string,
        user_id: row.user_id as string | null,
        clerk_user_id: row.clerk_user_id as string | null,
        session_id: row.session_id as string | null,
        ip_address: row.ip_address as string | null,
        user_agent: row.user_agent as string | null,
        geo_country: row.geo_country as string | null,
        geo_city: row.geo_city as string | null,
        page_url: row.page_url as string | null,
        page_route: row.page_route as string | null,
        status: row.status as PlatformLog["status"],
        duration_ms: row.duration_ms as number | null,
        business_id: row.business_id as string | null,
        organization_id: row.organization_id as string | null,
        payload: (row.payload ?? {}) as Record<string, unknown>,
        error_code: row.error_code as string | null,
        error_message: row.error_message as string | null,
        environment: row.environment as string,
        created_at: row.created_at as string,
        user_email: users?.email ?? null,
        business_name: businesses?.name ?? null,
      };
    }
  );

  const total = count ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">
          Platform Logs
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {total.toLocaleString()} events found
        </p>
      </div>

      <LogsFilters basePath="/admin/logs" />

      <LogsTable logs={logs} />

      {total > limit && (
        <AdminPagination
          currentPage={page}
          totalPages={Math.ceil(total / limit)}
        />
      )}
    </div>
  );
}
