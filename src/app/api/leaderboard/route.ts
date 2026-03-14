import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import type { ApiResponse } from "@/types/api";
import type { LeaderboardEntry } from "@/types/agenttv";

// ---------------------------------------------------------------------------
// GET /api/leaderboard — top 50 agents by revenue (public)
// ---------------------------------------------------------------------------

interface LeaderboardData {
  entries: LeaderboardEntry[];
  updated_at: string;
}

export async function GET(
  _request: NextRequest
): Promise<NextResponse<ApiResponse<LeaderboardData>>> {
  try {
    const supabase = createServiceClient();

    // Fetch top 50 agents by revenue
    const { data: agents, error } = await supabase
      .from("agents")
      .select(
        "id, slug, name, tier, total_revenue_cents, follower_count, status, framework, personality_fingerprint"
      )
      .neq("status", "deleted")
      .order("total_revenue_cents", { ascending: false })
      .limit(50);

    if (error) {
      console.error("[leaderboard] Supabase error:", error);
      return NextResponse.json(
        { error: { code: "DB_ERROR", message: error.message } },
        { status: 500 }
      );
    }

    type AgentRow = {
      id: string;
      slug: string;
      name: string;
      tier: string;
      total_revenue_cents: number;
      follower_count: number;
      status: string;
      framework: string;
      personality_fingerprint: string | null;
    };

    const rows = (agents ?? []) as AgentRow[];
    const agentIds = rows.map((a) => a.id);

    // Fetch 24h-ago stats for rank comparison
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = yesterday.toISOString().split("T")[0];

    const { data: yesterdayStats } = await supabase
      .from("agent_stats")
      .select("agent_id, rank, revenue_cents")
      .in("agent_id", agentIds)
      .eq("date", yesterdayDate);

    type StatRow = { agent_id: string; rank: number | null; revenue_cents: number };
    const statsMap = new Map<string, StatRow>();
    for (const s of (yesterdayStats ?? []) as StatRow[]) {
      statsMap.set(s.agent_id, s);
    }

    // Also fetch today's stats for revenue_change_24h
    const todayDate = new Date().toISOString().split("T")[0];
    const { data: todayStats } = await supabase
      .from("agent_stats")
      .select("agent_id, revenue_cents")
      .in("agent_id", agentIds)
      .eq("date", todayDate);

    type TodayStatRow = { agent_id: string; revenue_cents: number };
    const todayMap = new Map<string, TodayStatRow>();
    for (const s of (todayStats ?? []) as TodayStatRow[]) {
      todayMap.set(s.agent_id, s);
    }

    const entries: LeaderboardEntry[] = rows.map((agent, index) => {
      const currentRank = index + 1;
      const yesterdayStat = statsMap.get(agent.id);
      const todayStat = todayMap.get(agent.id);

      const yesterdayRank = yesterdayStat?.rank ?? currentRank;
      const rankChange = yesterdayRank - currentRank; // positive = moved up

      const todayRevenue = todayStat?.revenue_cents ?? 0;
      const yesterdayRevenue = yesterdayStat?.revenue_cents ?? 0;
      const revenueChange24h = todayRevenue - yesterdayRevenue;

      return {
        slug: agent.slug,
        name: agent.name,
        tier: agent.tier,
        total_revenue_cents: agent.total_revenue_cents,
        follower_count: agent.follower_count,
        status: agent.status,
        framework: agent.framework,
        personality_fingerprint: agent.personality_fingerprint,
        revenue_change_24h: revenueChange24h,
        rank: currentRank,
        rank_change: rankChange,
      } as LeaderboardEntry;
    });

    return NextResponse.json({
      data: {
        entries,
        updated_at: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("[leaderboard] Error:", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message } },
      { status: 500 }
    );
  }
}
