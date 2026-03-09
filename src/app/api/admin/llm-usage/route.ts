import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/guard";
import type { ApiResponse } from "@/types/api";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Zod schema
// ---------------------------------------------------------------------------

const querySchema = z.object({
  period: z.enum(["7d", "30d", "90d"]).default("30d"),
});

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

interface LLMSummary {
  totalCalls: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostUsd: number;
  avgLatencyMs: number;
}

interface LLMTopUser {
  userId: string;
  email: string | null;
  totalCalls: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostUsd: number;
}

interface LLMDailyBreakdown {
  date: string;
  calls: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

interface LLMByFeature {
  feature: string;
  calls: number;
  costUsd: number;
}

interface LLMUsageData {
  summary: LLMSummary;
  topUsers: LLMTopUser[];
  dailyBreakdown: LLMDailyBreakdown[];
  byFeature: LLMByFeature[];
}

// ---------------------------------------------------------------------------
// Row types
// ---------------------------------------------------------------------------

interface LLMLogRow {
  user_id: string | null;
  payload: {
    input_tokens?: number;
    output_tokens?: number;
    cost_usd?: number;
    latency_ms?: number;
    feature?: string;
  };
  timestamp: string;
  users: { email: string } | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function periodToDays(period: string): number {
  switch (period) {
    case "7d":
      return 7;
    case "90d":
      return 90;
    default:
      return 30;
  }
}

// ---------------------------------------------------------------------------
// GET — Admin: LLM usage analytics
// ---------------------------------------------------------------------------

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<LLMUsageData>>> {
  try {
    await requireAdmin();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }
    if (message === "FORBIDDEN") {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Admin access required" } },
        { status: 403 }
      );
    }
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
        },
      },
      { status: 500 }
    );
  }

  try {
    const url = new URL(request.url);
    const parsed = querySchema.safeParse({
      period: url.searchParams.get("period") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid query parameters",
            details: parsed.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { period } = parsed.data;
    const days = periodToDays(period);
    const startDate = new Date(
      Date.now() - days * 24 * 60 * 60 * 1000
    ).toISOString();

    const supabase = createServiceClient();

    // Fetch all LLM call completed logs within the period
    const { data: rows, error: fetchError } = await supabase
      .from("platform_logs")
      .select("user_id, payload, timestamp, users!left(email)")
      .eq("event_category", "LLM")
      .eq("event_type", "llm.call.completed")
      .gte("timestamp", startDate)
      .order("timestamp", { ascending: true });

    if (fetchError) {
      return NextResponse.json(
        {
          error: {
            code: "FETCH_FAILED",
            message: "Failed to fetch LLM usage data",
            details: fetchError.message,
          },
        },
        { status: 500 }
      );
    }

    const logs = (rows ?? []) as unknown as LLMLogRow[];

    // ---- Compute summary ----
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCostUsd = 0;
    let totalLatencyMs = 0;
    let latencyCount = 0;

    for (const log of logs) {
      const p = log.payload;
      totalInputTokens += p.input_tokens ?? 0;
      totalOutputTokens += p.output_tokens ?? 0;
      totalCostUsd += p.cost_usd ?? 0;
      if (p.latency_ms != null) {
        totalLatencyMs += p.latency_ms;
        latencyCount++;
      }
    }

    const summary: LLMSummary = {
      totalCalls: logs.length,
      totalInputTokens,
      totalOutputTokens,
      totalCostUsd: Math.round(totalCostUsd * 1_000_000) / 1_000_000,
      avgLatencyMs:
        latencyCount > 0
          ? Math.round(totalLatencyMs / latencyCount)
          : 0,
    };

    // ---- Top users (top 10 by total cost) ----
    const userMap = new Map<
      string,
      {
        userId: string;
        email: string | null;
        totalCalls: number;
        totalInputTokens: number;
        totalOutputTokens: number;
        totalCostUsd: number;
      }
    >();

    for (const log of logs) {
      const uid = log.user_id ?? "unknown";
      const existing = userMap.get(uid);
      if (existing) {
        existing.totalCalls++;
        existing.totalInputTokens += log.payload.input_tokens ?? 0;
        existing.totalOutputTokens += log.payload.output_tokens ?? 0;
        existing.totalCostUsd += log.payload.cost_usd ?? 0;
      } else {
        userMap.set(uid, {
          userId: uid,
          email: log.users?.email ?? null,
          totalCalls: 1,
          totalInputTokens: log.payload.input_tokens ?? 0,
          totalOutputTokens: log.payload.output_tokens ?? 0,
          totalCostUsd: log.payload.cost_usd ?? 0,
        });
      }
    }

    const topUsers = Array.from(userMap.values())
      .sort((a, b) => b.totalCostUsd - a.totalCostUsd)
      .slice(0, 10)
      .map((u) => ({
        ...u,
        totalCostUsd: Math.round(u.totalCostUsd * 1_000_000) / 1_000_000,
      }));

    // ---- Daily breakdown ----
    const dailyMap = new Map<
      string,
      { calls: number; inputTokens: number; outputTokens: number; costUsd: number }
    >();

    for (const log of logs) {
      const day = log.timestamp.slice(0, 10); // YYYY-MM-DD
      const existing = dailyMap.get(day);
      if (existing) {
        existing.calls++;
        existing.inputTokens += log.payload.input_tokens ?? 0;
        existing.outputTokens += log.payload.output_tokens ?? 0;
        existing.costUsd += log.payload.cost_usd ?? 0;
      } else {
        dailyMap.set(day, {
          calls: 1,
          inputTokens: log.payload.input_tokens ?? 0,
          outputTokens: log.payload.output_tokens ?? 0,
          costUsd: log.payload.cost_usd ?? 0,
        });
      }
    }

    const dailyBreakdown: LLMDailyBreakdown[] = Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, d]) => ({
        date,
        calls: d.calls,
        inputTokens: d.inputTokens,
        outputTokens: d.outputTokens,
        costUsd: Math.round(d.costUsd * 1_000_000) / 1_000_000,
      }));

    // ---- By feature ----
    const featureMap = new Map<string, { calls: number; costUsd: number }>();

    for (const log of logs) {
      const feature = log.payload.feature ?? "unknown";
      const existing = featureMap.get(feature);
      if (existing) {
        existing.calls++;
        existing.costUsd += log.payload.cost_usd ?? 0;
      } else {
        featureMap.set(feature, {
          calls: 1,
          costUsd: log.payload.cost_usd ?? 0,
        });
      }
    }

    const byFeature: LLMByFeature[] = Array.from(featureMap.entries())
      .sort(([, a], [, b]) => b.costUsd - a.costUsd)
      .map(([feature, d]) => ({
        feature,
        calls: d.calls,
        costUsd: Math.round(d.costUsd * 1_000_000) / 1_000_000,
      }));

    return NextResponse.json({
      data: {
        summary,
        topUsers,
        dailyBreakdown,
        byFeature,
      },
    });
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
        },
      },
      { status: 500 }
    );
  }
}
