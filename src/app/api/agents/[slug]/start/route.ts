import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import type { ApiResponse } from "@/types/api";

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const FRAMEWORK_IMAGES: Record<string, string> = {
  langgraph: "registry.fly.io/agenttv-langgraph:latest",
  crewai: "registry.fly.io/agenttv-crewai:latest",
  "openai-agents": "registry.fly.io/agenttv-openai-agents:latest",
  "raw-python": "registry.fly.io/agenttv-raw-python:latest",
  nodejs: "registry.fly.io/agenttv-nodejs:latest",
};

const VM_SIZES = [
  "shared-cpu-1x",
  "shared-cpu-2x",
  "shared-cpu-4x",
  "performance-1x",
  "performance-2x",
] as const;

// Reject shell metacharacters that could enable command chaining.
// The command runs inside an isolated Fly.io VM, but we still sanitize
// to prevent accidental shell injection via eval in start.sh.
const SAFE_CMD_RE = /^[a-zA-Z0-9_./ -]+$/;

const startSchema = z.object({
  agent_cmd: z
    .string()
    .min(1)
    .max(2000)
    .regex(SAFE_CMD_RE, "agent_cmd contains invalid characters (no shell metacharacters allowed)"),
  vm_size: z.enum(VM_SIZES).optional().default("shared-cpu-1x"),
  memory_mb: z.number().int().min(256).max(4096).optional().default(256),
  region: z.string().max(10).optional(),
  daily_cap_usd: z.number().min(0).max(10000).optional(),
  env: z.record(z.string(), z.string()).optional(),
});

type RouteContext = { params: Promise<{ slug: string }> };

// ---------------------------------------------------------------------------
// Fly.io config
// ---------------------------------------------------------------------------

const FLY_API_BASE = "https://api.machines.dev/v1";
const FLY_API_TOKEN = process.env.FLY_API_TOKEN || "";
const FLY_APP_NAME = process.env.FLY_APP_NAME || "agenttv-agents";
const INGEST_URL = process.env.NEXT_PUBLIC_APP_URL
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/events/ingest`
  : "https://agenttv.vercel.app/api/events/ingest";

// ---------------------------------------------------------------------------
// POST /api/agents/[slug]/start — start an agent run
// ---------------------------------------------------------------------------

interface StartResponse {
  run_id: string;
  machine_id: string;
  status: string;
}

export async function POST(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<StartResponse>>> {
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
      .select("id, owner_id, framework, run_token, config, status, fly_machine_id")
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
      framework: string;
      run_token: string;
      config: Record<string, unknown>;
      status: string;
      fly_machine_id: string | null;
    };

    if (agentRow.owner_id !== userId) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "You do not own this agent" } },
        { status: 403 }
      );
    }

    if (agentRow.status === "running" || agentRow.status === "starting") {
      return NextResponse.json(
        { error: { code: "CONFLICT", message: "Agent is already running" } },
        { status: 409 }
      );
    }

    // ---------- Parse body ----------
    const body: unknown = await request.json();
    const parsed = startSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid start config",
            details: parsed.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const { agent_cmd, vm_size, memory_mb, region, daily_cap_usd, env: userEnv } = parsed.data;

    // ---------- Create agent_runs record ----------
    const { data: run, error: runErr } = await supabase
      .from("agent_runs")
      .insert({
        agent_id: agentRow.id,
        status: "running",
      })
      .select("id")
      .single();

    if (runErr || !run) {
      console.error("[agents/start] Run insert error:", runErr);
      return NextResponse.json(
        { error: { code: "DB_ERROR", message: runErr?.message ?? "Failed to create run" } },
        { status: 500 }
      );
    }

    const runId = (run as { id: string }).id;

    // ---------- Resolve Docker image ----------
    const image = FRAMEWORK_IMAGES[agentRow.framework] ?? FRAMEWORK_IMAGES["raw-python"];

    // ---------- Create Fly.io machine ----------
    if (!FLY_API_TOKEN) {
      // No Fly.io token — update status for local/dev mode but skip machine creation
      await supabase
        .from("agents")
        .update({ status: "running", updated_at: new Date().toISOString() })
        .eq("id", agentRow.id);

      return NextResponse.json({
        data: { run_id: runId, machine_id: "local-dev", status: "running" },
      });
    }

    const machineEnv: Record<string, string> = {
      AGENT_CMD: agent_cmd,
      AGENTTV_RUN_TOKEN: agentRow.run_token,
      AGENTTV_SIDECAR_URL: "http://localhost:8080",
      AGENTTV_INGEST_URL: INGEST_URL,
      AGENTTV_AGENT_ID: agentRow.id,
      AGENTTV_RUN_ID: runId,
      ...userEnv,
    };

    if (daily_cap_usd) {
      machineEnv.AGENTTV_DAILY_CAP = String(daily_cap_usd);
    }

    // Pass BYOK key from agent config if available
    const byokKey = agentRow.config?.byok_api_key;
    if (typeof byokKey === "string" && byokKey) {
      machineEnv.AGENTTV_LLM_API_KEY = byokKey;
    }

    const machineConfig = {
      name: `agenttv-${runId.slice(0, 8)}`,
      config: {
        image,
        env: machineEnv,
        guest: {
          cpu_kind: vm_size.startsWith("performance") ? "performance" : "shared",
          cpus: vm_size.includes("4x") ? 4 : vm_size.includes("2x") ? 2 : 1,
          memory_mb: memory_mb,
        },
        auto_destroy: true,
        restart: { policy: "no" },
        checks: {
          sidecar: {
            type: "http",
            port: 8080,
            path: "/health",
            interval: "15s",
            timeout: "5s",
          },
        },
      },
      ...(region ? { region } : {}),
    };

    const flyRes = await fetch(`${FLY_API_BASE}/apps/${FLY_APP_NAME}/machines`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FLY_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(machineConfig),
    });

    if (!flyRes.ok) {
      const flyErr = await flyRes.text();
      console.error("[agents/start] Fly.io error:", flyErr);

      // Clean up the run record
      await supabase
        .from("agent_runs")
        .update({ status: "crashed", error_message: `Fly.io: ${flyRes.status}`, ended_at: new Date().toISOString() })
        .eq("id", runId);

      return NextResponse.json(
        { error: { code: "FLY_ERROR", message: `Failed to create machine: ${flyRes.status}` } },
        { status: 502 }
      );
    }

    const flyMachine = (await flyRes.json()) as { id: string };

    // ---------- Update agent status + machine ID ----------
    await supabase
      .from("agents")
      .update({
        status: "running",
        fly_machine_id: flyMachine.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", agentRow.id);

    return NextResponse.json({
      data: { run_id: runId, machine_id: flyMachine.id, status: "running" },
    });
  } catch (err) {
    console.error("[agents/start] Error:", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message } },
      { status: 500 }
    );
  }
}
