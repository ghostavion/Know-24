import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import type { ApiResponse } from "@/types/api";
import type { AgentSummary, Agent } from "@/types/agenttv";
import crypto from "crypto";

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/;

const createAgentSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(3)
    .max(64)
    .regex(SLUG_RE, "Slug must be lowercase alphanumeric with hyphens, 3-64 chars"),
  description: z.string().max(2000).optional(),
  framework: z.enum([
    "langgraph",
    "crewai",
    "autogen",
    "custom",
    "openai-assistants",
    "langchain",
  ]),
  config: z.record(z.string(), z.unknown()).optional(),
  byok_provider: z.string().max(100).optional(),
});

// ---------------------------------------------------------------------------
// GET /api/agents — list agents (public)
// ---------------------------------------------------------------------------

interface AgentListData {
  agents: AgentSummary[];
  total: number;
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<AgentListData>>> {
  try {
    const { searchParams } = request.nextUrl;
    const sort = searchParams.get("sort") ?? "newest";
    const status = searchParams.get("status");
    const framework = searchParams.get("framework");
    const limit = Math.min(Number(searchParams.get("limit") ?? 20), 100);
    const offset = Math.max(Number(searchParams.get("offset") ?? 0), 0);

    const supabase = createServiceClient();

    let query = supabase
      .from("agents")
      .select(
        "id, name, slug, description, framework, personality_fingerprint, status, tier, total_revenue_cents, follower_count, created_at",
        { count: "exact" }
      )
      .neq("status", "deleted");

    if (status) {
      query = query.eq("status", status);
    }
    if (framework) {
      query = query.eq("framework", framework);
    }

    // Sorting
    switch (sort) {
      case "revenue":
        query = query.order("total_revenue_cents", { ascending: false });
        break;
      case "followers":
        query = query.order("follower_count", { ascending: false });
        break;
      case "newest":
      default:
        query = query.order("created_at", { ascending: false });
        break;
    }

    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) {
      console.error("[agents/list] Supabase error:", error);
      return NextResponse.json(
        { error: { code: "DB_ERROR", message: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: { agents: (data ?? []) as AgentSummary[], total: count ?? 0 },
      meta: { page: Math.floor(offset / limit) + 1, perPage: limit, total: count ?? 0 },
    });
  } catch (err) {
    console.error("[agents/list] Error:", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message } },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/agents — create agent (authenticated)
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<Agent>>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not signed in" } },
        { status: 401 }
      );
    }

    const body: unknown = await request.json();
    const parsed = createAgentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid agent data",
            details: parsed.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const { name, slug, description, framework, config, byok_provider } = parsed.data;
    const supabase = createServiceClient();

    // Check slug uniqueness
    const { data: existing } = await supabase
      .from("agents")
      .select("id")
      .eq("slug", slug)
      .neq("status", "deleted")
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: { code: "SLUG_TAKEN", message: "An agent with this slug already exists" } },
        { status: 409 }
      );
    }

    const run_token = `atv_${crypto.randomBytes(32).toString("hex")}`;

    const { data: agent, error } = await supabase
      .from("agents")
      .insert({
        owner_id: userId,
        name,
        slug,
        description: description ?? null,
        framework,
        config: config ?? {},
        byok_provider: byok_provider ?? null,
        run_token,
        status: "offline",
        tier: "bronze",
        total_revenue_cents: 0,
        follower_count: 0,
      })
      .select()
      .single();

    if (error) {
      console.error("[agents/create] Supabase error:", error);
      return NextResponse.json(
        { error: { code: "DB_ERROR", message: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: agent as Agent }, { status: 201 });
  } catch (err) {
    console.error("[agents/create] Error:", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message } },
      { status: 500 }
    );
  }
}
