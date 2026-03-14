import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import type { ApiResponse } from "@/types/api";
import type { Agent } from "@/types/agenttv";

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const updateAgentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(2000).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  status: z.enum(["running", "offline", "error"]).optional(),
});

type RouteContext = { params: Promise<{ slug: string }> };

// ---------------------------------------------------------------------------
// GET /api/agents/[slug] — public agent detail
// ---------------------------------------------------------------------------

export async function GET(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<Agent>>> {
  try {
    const { slug } = await context.params;
    const supabase = createServiceClient();

    const { data: agent, error } = await supabase
      .from("agents")
      .select(
        "id, owner_id, name, slug, description, framework, config, byok_provider, personality_fingerprint, status, tier, total_revenue_cents, follower_count, created_at, updated_at"
      )
      .eq("slug", slug)
      .neq("status", "deleted")
      .single();

    if (error || !agent) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Agent not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: agent as Agent });
  } catch (err) {
    console.error("[agents/get] Error:", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message } },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/agents/[slug] — update (owner only)
// ---------------------------------------------------------------------------

export async function PATCH(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<Agent>>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not signed in" } },
        { status: 401 }
      );
    }

    const { slug } = await context.params;
    const body: unknown = await request.json();
    const parsed = updateAgentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid update data",
            details: parsed.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Verify ownership
    const { data: existing } = await supabase
      .from("agents")
      .select("id, owner_id")
      .eq("slug", slug)
      .neq("status", "deleted")
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Agent not found" } },
        { status: 404 }
      );
    }

    if ((existing as { owner_id: string }).owner_id !== userId) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "You do not own this agent" } },
        { status: 403 }
      );
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    const { name, description, config, status } = parsed.data;
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (config !== undefined) updates.config = config;
    if (status !== undefined) updates.status = status;

    const { data: updated, error } = await supabase
      .from("agents")
      .update(updates)
      .eq("id", (existing as { id: string }).id)
      .select()
      .single();

    if (error) {
      console.error("[agents/update] Supabase error:", error);
      return NextResponse.json(
        { error: { code: "DB_ERROR", message: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: updated as Agent });
  } catch (err) {
    console.error("[agents/update] Error:", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message } },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/agents/[slug] — soft delete (owner only)
// ---------------------------------------------------------------------------

export async function DELETE(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<{ deleted: boolean }>>> {
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

    const { data: existing } = await supabase
      .from("agents")
      .select("id, owner_id")
      .eq("slug", slug)
      .neq("status", "deleted")
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Agent not found" } },
        { status: 404 }
      );
    }

    if ((existing as { owner_id: string }).owner_id !== userId) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "You do not own this agent" } },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from("agents")
      .update({ status: "deleted", updated_at: new Date().toISOString() })
      .eq("id", (existing as { id: string }).id);

    if (error) {
      console.error("[agents/delete] Supabase error:", error);
      return NextResponse.json(
        { error: { code: "DB_ERROR", message: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: { deleted: true } });
  } catch (err) {
    console.error("[agents/delete] Error:", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message } },
      { status: 500 }
    );
  }
}
