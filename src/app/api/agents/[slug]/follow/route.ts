import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServiceClient } from "@/lib/supabase/server";
import type { ApiResponse } from "@/types/api";
import type { FollowResponse } from "@/types/agenttv";

type RouteContext = { params: Promise<{ slug: string }> };

/** Resolve agent by slug, returning id + follower_count or null */
async function resolveAgent(slug: string) {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("agents")
    .select("id, follower_count")
    .eq("slug", slug)
    .neq("status", "deleted")
    .single();
  return data as { id: string; follower_count: number } | null;
}

// ---------------------------------------------------------------------------
// POST /api/agents/[slug]/follow — follow agent
// ---------------------------------------------------------------------------

export async function POST(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<FollowResponse>>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not signed in" } },
        { status: 401 }
      );
    }

    const { slug } = await context.params;
    const agent = await resolveAgent(slug);

    if (!agent) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Agent not found" } },
        { status: 404 }
      );
    }

    const supabase = createServiceClient();

    // Upsert follow (ignore conflict if already following)
    const { error: followErr } = await supabase
      .from("follows")
      .upsert(
        { user_id: userId, agent_id: agent.id },
        { onConflict: "user_id,agent_id" }
      );

    if (followErr) {
      console.error("[follow] Supabase error:", followErr);
      return NextResponse.json(
        { error: { code: "DB_ERROR", message: followErr.message } },
        { status: 500 }
      );
    }

    // Increment follower_count
    const { data: updated, error: updateErr } = await supabase.rpc(
      "increment_follower_count",
      { agent_row_id: agent.id, delta: 1 }
    );

    // Fallback: if RPC doesn't exist, do a manual update
    let newCount = agent.follower_count + 1;
    if (updateErr) {
      const { data: refreshed } = await supabase
        .from("agents")
        .update({ follower_count: agent.follower_count + 1 })
        .eq("id", agent.id)
        .select("follower_count")
        .single();
      if (refreshed) newCount = (refreshed as { follower_count: number }).follower_count;
    } else if (updated !== null && typeof updated === "number") {
      newCount = updated;
    }

    return NextResponse.json({
      data: { following: true, follower_count: newCount },
    });
  } catch (err) {
    console.error("[follow] Error:", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message } },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/agents/[slug]/follow — unfollow agent
// ---------------------------------------------------------------------------

export async function DELETE(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<FollowResponse>>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not signed in" } },
        { status: 401 }
      );
    }

    const { slug } = await context.params;
    const agent = await resolveAgent(slug);

    if (!agent) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Agent not found" } },
        { status: 404 }
      );
    }

    const supabase = createServiceClient();

    const { error: delErr } = await supabase
      .from("follows")
      .delete()
      .eq("user_id", userId)
      .eq("agent_id", agent.id);

    if (delErr) {
      console.error("[unfollow] Supabase error:", delErr);
      return NextResponse.json(
        { error: { code: "DB_ERROR", message: delErr.message } },
        { status: 500 }
      );
    }

    // Decrement follower_count (floor at 0)
    const newCount = Math.max(0, agent.follower_count - 1);
    const { data: refreshed } = await supabase
      .from("agents")
      .update({ follower_count: newCount })
      .eq("id", agent.id)
      .select("follower_count")
      .single();

    return NextResponse.json({
      data: {
        following: false,
        follower_count: refreshed
          ? (refreshed as { follower_count: number }).follower_count
          : newCount,
      },
    });
  } catch (err) {
    console.error("[unfollow] Error:", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message } },
      { status: 500 }
    );
  }
}
