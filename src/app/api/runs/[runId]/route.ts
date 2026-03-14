import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import type { ApiResponse } from "@/types/api";

type RouteContext = { params: Promise<{ runId: string }> };

// ---------------------------------------------------------------------------
// GET /api/runs/[runId] — get run status (used by sidecar budget polling)
// Auth: Bearer run_token
// ---------------------------------------------------------------------------

interface RunStatus {
  id: string;
  status: string;
  spend_cents: number;
  revenue_cents: number;
  started_at: string;
  ended_at: string | null;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<RunStatus>>> {
  try {
    // Auth via bearer token (sidecar uses run_token)
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Missing bearer token" } },
        { status: 401 }
      );
    }
    const token = authHeader.slice(7).trim();
    if (!token) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Empty bearer token" } },
        { status: 401 }
      );
    }

    const { runId } = await context.params;
    const supabase = createServiceClient();

    // Fetch run with agent's run_token for validation
    const { data: run, error } = await supabase
      .from("agent_runs")
      .select("id, agent_id, status, spend_cents, revenue_cents, started_at, ended_at")
      .eq("id", runId)
      .single();

    if (error || !run) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Run not found" } },
        { status: 404 }
      );
    }

    const runRow = run as {
      id: string;
      agent_id: string;
      status: string;
      spend_cents: number;
      revenue_cents: number;
      started_at: string;
      ended_at: string | null;
    };

    // Validate token against the agent's run_token
    const { data: agent } = await supabase
      .from("agents")
      .select("run_token")
      .eq("id", runRow.agent_id)
      .single();

    if (!agent || (agent as { run_token: string }).run_token !== token) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Invalid run token" } },
        { status: 401 }
      );
    }

    return NextResponse.json({
      data: {
        id: runRow.id,
        status: runRow.status,
        spend_cents: runRow.spend_cents,
        revenue_cents: runRow.revenue_cents,
        started_at: runRow.started_at,
        ended_at: runRow.ended_at,
      },
    });
  } catch (err) {
    console.error("[runs/get] Error:", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message } },
      { status: 500 }
    );
  }
}
