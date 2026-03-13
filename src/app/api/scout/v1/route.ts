import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { hasEnoughCredits, deductCredits } from "@/lib/credits/service";
import { inngest } from "@/lib/inngest/client";

/**
 * POST /api/scout/v1 — Start a scout scan (15 credits)
 * Body: { niche: string, ebookId?: string }
 */
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }

  let body: { niche?: string; ebookId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_BODY", message: "Invalid JSON" } },
      { status: 400 }
    );
  }

  const { niche, ebookId } = body;

  if (!niche || typeof niche !== "string" || niche.trim().length < 2) {
    return NextResponse.json(
      { error: { code: "INVALID_NICHE", message: "Niche is required" } },
      { status: 400 }
    );
  }

  const canAfford = await hasEnoughCredits(userId, "scout_scan");
  if (!canAfford) {
    return NextResponse.json(
      { error: { code: "INSUFFICIENT_CREDITS", message: "Not enough credits (costs 15)" } },
      { status: 402 }
    );
  }

  const supabase = createServiceClient();

  // Create scout_scan record
  const { data: scan, error: insertError } = await supabase
    .from("scout_scans")
    .insert({
      user_id: userId,
      ebook_id: ebookId ?? null,
      niche: niche.trim(),
      status: "pending",
    })
    .select("id")
    .single();

  if (insertError || !scan) {
    return NextResponse.json(
      { error: { code: "CREATE_FAILED", message: "Failed to create scan" } },
      { status: 500 }
    );
  }

  const scanId = (scan as { id: string }).id;

  // Deduct credits
  const creditResult = await deductCredits(userId, "scout_scan", scanId);
  if (!creditResult.success) {
    return NextResponse.json(
      { error: { code: "INSUFFICIENT_CREDITS", message: creditResult.error } },
      { status: 402 }
    );
  }

  await supabase
    .from("scout_scans")
    .update({ credits_charged: 15 })
    .eq("id", scanId);

  // Dispatch via Inngest
  await inngest.send({
    name: "scout/scan.requested",
    data: { scanId, userId, niche: niche.trim(), ebookId: ebookId ?? null },
  });

  return NextResponse.json({ data: { scanId } });
}

/**
 * GET /api/scout/v1 — List user's scout scans
 */
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }

  const supabase = createServiceClient();

  const { data: scans } = await supabase
    .from("scout_scans")
    .select("id, niche, status, opportunities_found, results, created_at, completed_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  return NextResponse.json({ data: scans ?? [] });
}
