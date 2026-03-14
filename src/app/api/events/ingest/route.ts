import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import type { ApiResponse } from "@/types/api";

// ---------------------------------------------------------------------------
// Validation — strict schema for the 4 event types
// ---------------------------------------------------------------------------

const revenueDataSchema = z.object({
  amount: z.number(),
  currency: z.string().default("usd"),
  source: z.string().optional(),
}).passthrough();

const ingestSchema = z.object({
  agent_id: z.string().uuid(),
  run_id: z.string().min(1),
  event_type: z.enum(["action", "revenue", "status", "error"]),
  event_name: z.string().min(1).max(500),
  data: z.record(z.string(), z.unknown()),
});

// ---------------------------------------------------------------------------
// POST /api/events/ingest — sidecar event ingestion
// Auth: Bearer <run_token> (NOT Clerk)
// ---------------------------------------------------------------------------

interface IngestResponse {
  event_id: string;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<IngestResponse>>> {
  try {
    // ---------- Auth via bearer run_token ----------
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Missing or invalid bearer token" } },
        { status: 401 }
      );
    }
    const token = authHeader.slice(7);

    // ---------- Parse & validate body ----------
    const body: unknown = await request.json();
    const parsed = ingestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid event payload",
            details: parsed.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const { agent_id, run_id, event_type, event_name, data } = parsed.data;

    const supabase = createServiceClient();

    // ---------- Verify agent + token ----------
    const { data: agent } = await supabase
      .from("agents")
      .select("id, run_token, total_revenue_cents")
      .eq("id", agent_id)
      .neq("status", "deleted")
      .single();

    if (!agent) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Agent not found" } },
        { status: 404 }
      );
    }

    const agentRow = agent as { id: string; run_token: string; total_revenue_cents: number };

    if (agentRow.run_token !== token) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Invalid run token" } },
        { status: 401 }
      );
    }

    // ---------- Validate revenue data if applicable ----------
    if (event_type === "revenue") {
      const revParsed = revenueDataSchema.safeParse(data);
      if (!revParsed.success) {
        return NextResponse.json(
          {
            error: {
              code: "VALIDATION_ERROR",
              message: "Revenue event requires data.amount (number)",
              details: revParsed.error.flatten().fieldErrors,
            },
          },
          { status: 400 }
        );
      }
    }

    // ---------- Write event ----------
    const { data: event, error: insertErr } = await supabase
      .from("events")
      .insert({
        agent_id,
        run_id,
        event_type,
        event_name,
        data,
      })
      .select("id")
      .single();

    if (insertErr) {
      console.error("[events/ingest] Insert error:", insertErr);
      return NextResponse.json(
        { error: { code: "DB_ERROR", message: insertErr.message } },
        { status: 500 }
      );
    }

    const eventId = (event as { id: string }).id;

    // ---------- Revenue bookkeeping ----------
    if (event_type === "revenue" && typeof data.amount === "number" && data.amount > 0) {
      const amountCents = Math.round(data.amount);

      // Update agent total
      await supabase
        .from("agents")
        .update({
          total_revenue_cents: agentRow.total_revenue_cents + amountCents,
          updated_at: new Date().toISOString(),
        })
        .eq("id", agent_id);

      // Update run revenue (if agent_runs row exists)
      const { data: run } = await supabase
        .from("agent_runs")
        .select("id, revenue_cents")
        .eq("agent_id", agent_id)
        .eq("run_id", run_id)
        .single();

      if (run) {
        const runRow = run as { id: string; revenue_cents: number };
        await supabase
          .from("agent_runs")
          .update({ revenue_cents: runRow.revenue_cents + amountCents })
          .eq("id", runRow.id);
      }
    }

    // ---------- Broadcast on Supabase Realtime ----------
    // Supabase Realtime automatically picks up inserts on tables with
    // Realtime enabled. If using a custom channel, the client subscribes
    // to `agent:{agent_id}` and the insert trigger handles broadcasting.
    // No explicit publish call needed when Realtime is enabled on the
    // `events` table in the Supabase dashboard.

    return NextResponse.json({ data: { event_id: eventId } }, { status: 200 });
  } catch (err) {
    console.error("[events/ingest] Error:", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message } },
      { status: 500 }
    );
  }
}
