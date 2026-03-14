export const dynamic = "force-dynamic";

import Link from "next/link";
import { Bot } from "lucide-react";
import { requireAdmin } from "@/lib/admin/guard";
import { createServiceClient } from "@/lib/supabase/server";

interface AdminAgentsPageProps {
  searchParams: Promise<{ page?: string; status?: string }>;
}

interface AgentRow {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  framework: string | null;
  tier: string | null;
  status: string;
  total_revenue_cents: number;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  running: "bg-green-100 text-green-700",
  stopped: "bg-gray-100 text-gray-500",
  error: "bg-red-100 text-red-700",
  deploying: "bg-yellow-100 text-yellow-700",
};

const FILTER_TABS = ["all", "running", "stopped", "error"] as const;

function formatRevenue(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default async function AdminAgentsPage({
  searchParams,
}: AdminAgentsPageProps) {
  await requireAdmin();

  const params = await searchParams;
  const statusFilter = params.status ?? "all";

  const supabase = createServiceClient();

  let query = supabase
    .from("agents")
    .select(
      "id, name, slug, owner_id, framework, tier, status, total_revenue_cents, created_at",
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data: agentRows, count } = await query;
  const agents = (agentRows ?? []) as AgentRow[];
  const total = count ?? 0;

  // Fetch owner emails for display
  const ownerIds = [...new Set(agents.map((a) => a.owner_id))];
  let ownerMap: Record<string, string> = {};

  if (ownerIds.length > 0) {
    const { data: owners } = await supabase
      .from("users")
      .select("id, email")
      .in("id", ownerIds);

    if (owners) {
      for (const o of owners as { id: string; email: string }[]) {
        ownerMap[o.id] = o.email;
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Bot className="h-5 w-5 text-[#7C3AED]" />
            <h2 className="text-2xl font-semibold text-foreground">Agents</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {total} total {total === 1 ? "agent" : "agents"}
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {FILTER_TABS.map((tab) => (
          <Link
            key={tab}
            href={`/admin/agents${tab === "all" ? "" : `?status=${tab}`}`}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              statusFilter === tab
                ? "bg-[#7C3AED] text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Name
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Owner
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Framework
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Tier
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Revenue
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {agents.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    {statusFilter !== "all"
                      ? `No ${statusFilter} agents found.`
                      : "No agents found."}
                  </td>
                </tr>
              ) : (
                agents.map((agent) => {
                  const statusClass =
                    STATUS_COLORS[agent.status] ?? "bg-gray-100 text-gray-500";

                  return (
                    <tr
                      key={agent.id}
                      className="transition-colors hover:bg-muted/30"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/agent/${agent.slug}`}
                          className="font-medium text-foreground hover:text-[#7C3AED] hover:underline"
                        >
                          {agent.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {ownerMap[agent.owner_id] ?? agent.owner_id}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {agent.framework ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {agent.tier ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass}`}
                        >
                          {agent.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatRevenue(agent.total_revenue_cents)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(agent.created_at).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
