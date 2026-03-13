import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { hasEnoughCredits } from "@/lib/credits/service";
import { inngest } from "@/lib/inngest/client";

/**
 * GET /api/ebooks — List user's ebooks
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
  const { data: ebooks } = await supabase
    .from("ebooks")
    .select("id, title, subtitle, niche, status, total_words, total_pages, cover_url, pdf_url, created_at, updated_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return NextResponse.json({ data: ebooks ?? [] });
}

/**
 * POST /api/ebooks — Start ebook generation
 * Body: { niche: string, personalAngle?: string, researchRunId?: string }
 */
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }

  let body: { niche?: string; personalAngle?: string; researchRunId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_BODY", message: "Invalid JSON" } },
      { status: 400 }
    );
  }

  const { niche, personalAngle, researchRunId } = body;

  if (!niche || typeof niche !== "string" || niche.trim().length < 2) {
    return NextResponse.json(
      { error: { code: "INVALID_NICHE", message: "Niche is required" } },
      { status: 400 }
    );
  }

  const canAfford = await hasEnoughCredits(userId, "ebook_generation");
  if (!canAfford) {
    return NextResponse.json(
      { error: { code: "INSUFFICIENT_CREDITS", message: "Not enough credits (costs 50)" } },
      { status: 402 }
    );
  }

  const supabase = createServiceClient();

  const { data: ebook, error: insertError } = await supabase
    .from("ebooks")
    .insert({
      user_id: userId,
      title: `Generating: ${niche}`,
      niche: niche.trim(),
      personal_angle: personalAngle ?? null,
      research_run_id: researchRunId ?? null,
      status: "draft",
    })
    .select("id")
    .single();

  if (insertError || !ebook) {
    return NextResponse.json(
      { error: { code: "CREATE_FAILED", message: "Failed to create ebook record" } },
      { status: 500 }
    );
  }

  const ebookId = (ebook as { id: string }).id;

  await inngest.send({
    name: "ebook/generation.requested",
    data: {
      ebookId,
      userId,
      niche: niche.trim(),
      personalAngle: personalAngle ?? null,
      researchRunId: researchRunId ?? null,
    },
  });

  return NextResponse.json({ data: { ebookId } });
}
