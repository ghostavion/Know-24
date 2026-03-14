import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import type { ApiResponse } from "@/types/api";
import type { StatsResponse } from "@/types/agenttv";

type RouteContext = { params: Promise<{ slug: string }> };

// ---------------------------------------------------------------------------
// GET /api/agents/[slug]/stats — aggregated stats (public)
// ---------------------------------------------------------------------------

export async function GET(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<StatsResponse>>> {
  try {
    const { slug } = await context.params;
    const supabase = createServiceClient();

    // Resolve agent
    const { data: agent } = await supabase
      .from("agents")
      .select("id, total_revenue_cents")
      .eq("slug", slug)
      .neq("status", "deleted")
      .single();

    if (!agent) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Agent not found" } },
        { status: 404 }
      );
    }

    const agentId = (agent as { id: string; total_revenue_cents: number }).id;
    const totalRevenue = (agent as { total_revenue_cents: number }).total_revenue_cents;

    // Last 30 days of stats
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sinceDate = thirtyDaysAgo.toISOString().split("T")[0];

    const { data: dailyStats, error } = await supabase
      .from("agent_stats")
      .select("date, revenue_cents, follower_count, actions_count")
      .eq("agent_id", agentId)
      .gte("date", sinceDate)
      .order("date", { ascending: true });

    if (error) {
      console.error("[stats] Supabase error:", error);
      return NextResponse.json(
        { error: { code: "DB_ERROR", message: error.message } },
        { status: 500 }
      );
    }

    type DayRow = {
      date: string;
      revenue_cents: number;
      follower_count: number;
      actions_count: number;
    };

    const rows = (dailyStats ?? []) as DayRow[];

    const stats: StatsResponse = {
      total_revenue_cents: totalRevenue,
      daily_revenue: rows.map((r) => ({
        date: r.date,
        revenue_cents: r.revenue_cents,
      })),
      follower_trend: rows.map((r) => ({
        date: r.date,
        follower_count: r.follower_count,
      })),
      actions_per_day: rows.map((r) => ({
        date: r.date,
        count: r.actions_count,
      })),
    };

    return NextResponse.json({ data: stats });
  } catch (err) {
    console.error("[stats] Error:", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message } },
      { status: 500 }
    );
  }
}
