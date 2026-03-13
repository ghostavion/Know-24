import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * GET /api/research/[runId]
 * Returns the full research run data including blueprint and proof card.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }

  const { runId } = await params;
  const supabase = createServiceClient();

  const { data: run, error } = await supabase
    .from("research_runs")
    .select("*")
    .eq("id", runId)
    .eq("user_id", userId)
    .single();

  if (error || !run) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Research run not found" } },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: run });
}
