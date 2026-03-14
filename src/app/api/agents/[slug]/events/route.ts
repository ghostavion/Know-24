import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import type { ApiResponse } from "@/types/api";
import type { AgentEvent } from "@/types/agenttv";

type RouteContext = { params: Promise<{ slug: string }> };

// ---------------------------------------------------------------------------
// GET /api/agents/[slug]/events — event history (public)
// ---------------------------------------------------------------------------

interface EventListData {
  events: AgentEvent[];
}

export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<EventListData>>> {
  try {
    const { slug } = await context.params;
    const { searchParams } = request.nextUrl;
    const type = searchParams.get("type");
    const limit = Math.min(Number(searchParams.get("limit") ?? 50), 200);
    const before = searchParams.get("before");

    const supabase = createServiceClient();

    // Resolve agent
    const { data: agent } = await supabase
      .from("agents")
      .select("id")
      .eq("slug", slug)
      .neq("status", "deleted")
      .single();

    if (!agent) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Agent not found" } },
        { status: 404 }
      );
    }

    let query = supabase
      .from("events")
      .select("id, agent_id, run_id, event_type, event_name, data, created_at")
      .eq("agent_id", (agent as { id: string }).id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (type) {
      query = query.eq("event_type", type);
    }

    if (before) {
      query = query.lt("created_at", before);
    }

    const { data: events, error } = await query;

    if (error) {
      console.error("[events/list] Supabase error:", error);
      return NextResponse.json(
        { error: { code: "DB_ERROR", message: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: { events: (events ?? []) as AgentEvent[] } });
  } catch (err) {
    console.error("[events/list] Error:", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message } },
      { status: 500 }
    );
  }
}
