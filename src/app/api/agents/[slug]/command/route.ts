import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServiceClient } from "@/lib/supabase/server";
import type { ApiResponse } from "@/types/api";

type RouteContext = { params: Promise<{ slug: string }> };

// ---------------------------------------------------------------------------
// POST /api/agents/[slug]/command — send a command to a running agent
// ---------------------------------------------------------------------------

interface CommandResponse {
  event_id: string;
}

export async function POST(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<CommandResponse>>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not signed in" } },
        { status: 401 }
      );
    }

    const { slug } = await context.params;
    const body = (await request.json()) as { message?: string };

    if (!body.message || typeof body.message !== "string" || body.message.trim().length === 0) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Message is required" } },
        { status: 400 }
      );
    }

    if (body.message.length > 2000) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Message too long (max 2000 chars)" } },
        { status: 400 }
      );
    }

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

    // ---------- Get active run ----------
    const { data: activeRun } = await supabase
      .from("agent_runs")
      .select("id, run_id")
      .eq("agent_id", agentRow.id)
      .eq("status", "running")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const runId = activeRun
      ? (activeRun as { run_id: string }).run_id
      : "manual";

    // ---------- Write command event ----------
    const { data: event, error: insertErr } = await supabase
      .from("events")
      .insert({
        agent_id: agentRow.id,
        run_id: runId,
        event_type: "action",
        event_name: "owner_command",
        data: {
          message: body.message.trim(),
          from: "owner",
          user_id: userId,
        },
      })
      .select("id")
      .single();

    if (insertErr) {
      console.error("[agents/command] Insert error:", insertErr);
      return NextResponse.json(
        { error: { code: "DB_ERROR", message: insertErr.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: { event_id: (event as { id: string }).id },
    });
  } catch (err) {
    console.error("[agents/command] Error:", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message } },
      { status: 500 }
    );
  }
}
