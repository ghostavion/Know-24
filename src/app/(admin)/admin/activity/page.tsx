export const dynamic = "force-dynamic";

import { Activity } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/server";
import { AdminSearchForm } from "@/components/admin/AdminSearchForm";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminEventTypeFilter } from "@/components/admin/AdminEventTypeFilter";
import { cn } from "@/lib/utils";

interface AdminActivityPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    eventType?: string;
  }>;
}

interface ActivityRow {
  id: string;
  business_id: string;
  event_type: string;
  title: string;
  description: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  businesses: { name: string } | null;
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  business_created: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  product_created: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  product_updated: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
  sale: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  storefront_published: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  customer_signup: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  subscription_started: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400",
  knowledge_ingested: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  onboarding_completed: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
  blog_published: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  social_post_generated: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400",
  ai_workspace_action: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400",
  scout_scan_completed: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400",
};

const DEFAULT_BADGE_COLOR =
  "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";

export default async function AdminActivityPage({
  searchParams,
}: AdminActivityPageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const limit = 50;
  const offset = (page - 1) * limit;

  const supabase = createServiceClient();

  let query = supabase
    .from("activity_log")
    .select(
      "id, business_id, event_type, title, description, metadata, created_at, businesses(name)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (params.eventType) {
    query = query.eq("event_type", params.eventType);
  }

  if (params.search) {
    query = query.or(
      `title.ilike.%${params.search}%,description.ilike.%${params.search}%`
    );
  }

  const { data: rows, count } = await query;
  const events = ((rows ?? []) as unknown as ActivityRow[]);
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  // Get distinct event types for the filter dropdown
  const { data: eventTypeRows } = await supabase
    .from("activity_log")
    .select("event_type")
    .order("event_type");

  const eventTypes = [
    ...new Set(
      (eventTypeRows ?? []).map(
        (r: { event_type: string }) => r.event_type
      )
    ),
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <Activity className="h-5 w-5 text-[#7C3AED]" />
          <h2 className="text-2xl font-semibold text-foreground">
            Activity Log
          </h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {total} total {total === 1 ? "event" : "events"}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <AdminSearchForm placeholder="Search events..." />
        <AdminEventTypeFilter
          eventTypes={eventTypes}
          currentType={params.eventType}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Time
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Business
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Event Type
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Title
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {events.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    {params.search || params.eventType
                      ? "No events match your filters."
                      : "No activity logged yet."}
                  </td>
                </tr>
              ) : (
                events.map((event) => {
                  const badgeColor =
                    EVENT_TYPE_COLORS[event.event_type] ?? DEFAULT_BADGE_COLOR;
                  return (
                    <tr
                      key={event.id}
                      className="transition-colors hover:bg-muted/30"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {new Date(event.created_at).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {event.businesses?.name ?? "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                            badgeColor
                          )}
                        >
                          {event.event_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {event.title}
                      </td>
                      <td className="max-w-xs truncate px-4 py-3 text-muted-foreground">
                        {event.description ?? "-"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AdminPagination currentPage={page} totalPages={totalPages} />
    </div>
  );
}
