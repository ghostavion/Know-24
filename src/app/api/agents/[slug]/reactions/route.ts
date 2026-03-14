import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import type { ApiResponse } from "@/types/api";
import type { Reaction } from "@/types/agenttv";

const reactionSchema = z.object({
  event_id: z.string().uuid(),
  reaction: z.enum(["fire", "facepalm", "money", "eyes"]),
});

type RouteContext = { params: Promise<{ slug: string }> };

// ---------------------------------------------------------------------------
// POST /api/agents/[slug]/reactions — react to an event
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<Reaction>>> {
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
    const parsed = reactionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid reaction data",
            details: parsed.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const { event_id, reaction } = parsed.data;
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

    const agentId = (agent as { id: string }).id;

    // Verify the event belongs to this agent
    const { data: event } = await supabase
      .from("events")
      .select("id")
      .eq("id", event_id)
      .eq("agent_id", agentId)
      .single();

    if (!event) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Event not found for this agent" } },
        { status: 404 }
      );
    }

    // Upsert reaction (one reaction per user per event)
    const { data: upserted, error } = await supabase
      .from("reactions")
      .upsert(
        {
          user_id: userId,
          event_id,
          agent_id: agentId,
          kind: reaction,
        },
        { onConflict: "user_id,event_id" }
      )
      .select()
      .single();

    if (error) {
      console.error("[reactions/create] Supabase error:", error);
      return NextResponse.json(
        { error: { code: "DB_ERROR", message: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: upserted as Reaction }, { status: 201 });
  } catch (err) {
    console.error("[reactions/create] Error:", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message } },
      { status: 500 }
    );
  }
}
