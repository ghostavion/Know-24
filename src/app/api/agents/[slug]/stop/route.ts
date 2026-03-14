import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServiceClient } from "@/lib/supabase/server";
import type { ApiResponse } from "@/types/api";

type RouteContext = { params: Promise<{ slug: string }> };

// ---------------------------------------------------------------------------
// Fly.io config
// ---------------------------------------------------------------------------

const FLY_API_BASE = "https://api.machines.dev/v1";
const FLY_API_TOKEN = process.env.FLY_API_TOKEN || "";
const FLY_APP_NAME = process.env.FLY_APP_NAME || "agenttv-agents";

// ---------------------------------------------------------------------------
// POST /api/agents/[slug]/stop — stop a running agent
// ---------------------------------------------------------------------------

interface StopResponse {
  stopped: boolean;
  run_id: string | null;
}

export async function POST(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<StopResponse>>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not signed in" } },
        { status: 401 }
      );
    }

    const { slug } = await context.params;
    const supabase = createServiceClient();

    // ---------- Verify ownership ----------
    const { data: agent } = await supabase
      .from("agents")
      .select("id, owner_id, status, fly_machine_id")
      .eq("slug", slug)
      .neq("status", "deleted")
      .single();

    if (!agent) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Agent not found" } },
        { status: 404 }
      );
    }

    const agentRow = agent as {
      id: string;
      owner_id: string;
      status: string;
      fly_machine_id: string | null;
    };

    if (agentRow.owner_id !== userId) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "You do not own this agent" } },
        { status: 403 }
      );
    }

    if (agentRow.status !== "running" && agentRow.status !== "starting") {
      return NextResponse.json(
        { error: { code: "CONFLICT", message: "Agent is not running" } },
        { status: 409 }
      );
    }

    // ---------- Stop Fly.io machine ----------
    if (agentRow.fly_machine_id && FLY_API_TOKEN) {
      try {
        const flyRes = await fetch(
          `${FLY_API_BASE}/apps/${FLY_APP_NAME}/machines/${agentRow.fly_machine_id}/stop`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${FLY_API_TOKEN}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!flyRes.ok) {
          console.warn(`[agents/stop] Fly.io stop returned ${flyRes.status}, continuing with DB cleanup`);
        }
      } catch (flyErr) {
        console.warn("[agents/stop] Fly.io stop failed, continuing with DB cleanup:", flyErr);
      }
    }

    // ---------- Update agent status ----------
    await supabase
      .from("agents")
      .update({
        status: "offline",
        fly_machine_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", agentRow.id);

    // ---------- Close the active run ----------
    const { data: activeRun } = await supabase
      .from("agent_runs")
      .select("id")
      .eq("agent_id", agentRow.id)
      .eq("status", "running")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let runId: string | null = null;

    if (activeRun) {
      runId = (activeRun as { id: string }).id;
      await supabase
        .from("agent_runs")
        .update({
          status: "stopped",
          ended_at: new Date().toISOString(),
        })
        .eq("id", runId);
    }

    return NextResponse.json({ data: { stopped: true, run_id: runId } });
  } catch (err) {
    console.error("[agents/stop] Error:", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message } },
      { status: 500 }
    );
  }
}
