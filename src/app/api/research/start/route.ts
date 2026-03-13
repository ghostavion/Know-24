import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { hasEnoughCredits } from "@/lib/credits/service";
import { hashNiche } from "@/lib/research/orchestrator";
import { inngest } from "@/lib/inngest/client";

/**
 * POST /api/research/start
 * Body: { niche: string, personalAngle?: string, businessId?: string }
 * Returns: { runId: string } — client polls /api/research/[runId]/stream for SSE
 */
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }

  let body: { niche?: string; personalAngle?: string; businessId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_BODY", message: "Invalid JSON" } },
      { status: 400 }
    );
  }

  const { niche, personalAngle, businessId } = body;

  if (!niche || typeof niche !== "string" || niche.trim().length < 2) {
    return NextResponse.json(
      { error: { code: "INVALID_NICHE", message: "Niche must be at least 2 characters" } },
      { status: 400 }
    );
  }

  // Check credits before starting
  const canAfford = await hasEnoughCredits(userId, "research_report");
  if (!canAfford) {
    return NextResponse.json(
      { error: { code: "INSUFFICIENT_CREDITS", message: "Not enough credits for research (costs 10)" } },
      { status: 402 }
    );
  }

  const supabase = createServiceClient();
  const nicheHash = hashNiche(niche.trim());

  // Create research run record
  const { data: run, error: insertError } = await supabase
    .from("research_runs")
    .insert({
      user_id: userId,
      niche_query: niche.trim(),
      niche_hash: nicheHash,
      personal_angle: personalAngle ?? null,
      status: "pending",
      phase: "starting",
    })
    .select("id")
    .single();

  if (insertError || !run) {
    return NextResponse.json(
      { error: { code: "CREATE_FAILED", message: "Failed to create research run" } },
      { status: 500 }
    );
  }

  const runId = (run as { id: string }).id;

  // Dispatch Inngest event
  await inngest.send({
    name: "research/niche.requested",
    data: {
      runId,
      userId,
      niche: niche.trim(),
      subNiches: [],
      personalAngle: personalAngle ?? null,
      businessId: businessId ?? null,
    },
  });

  return NextResponse.json({ data: { runId } });
}
