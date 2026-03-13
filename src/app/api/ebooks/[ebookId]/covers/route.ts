import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { deductCredits } from "@/lib/credits/service";
import { generateProductCover } from "@/lib/images/cover-generator";

/**
 * GET /api/ebooks/[ebookId]/covers — List generated covers
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ebookId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }

  const { ebookId } = await params;
  const supabase = createServiceClient();

  const { data: covers } = await supabase
    .from("covers")
    .select("id, image_url, prompt, selected, created_at")
    .eq("ebook_id", ebookId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return NextResponse.json({ data: covers ?? [] });
}

/**
 * POST /api/ebooks/[ebookId]/covers — Generate a new cover (costs 10 credits)
 * Body: { style?: "minimalist" | "bold" | "photographic" | "illustrated" | "gradient" }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ ebookId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }

  const { ebookId } = await params;

  let body: { style?: string } = {};
  try {
    body = await request.json();
  } catch {
    // OK — style is optional
  }

  const supabase = createServiceClient();

  // Fetch ebook for metadata
  const { data: ebook, error: fetchErr } = await supabase
    .from("ebooks")
    .select("title, subtitle, niche")
    .eq("id", ebookId)
    .eq("user_id", userId)
    .single();

  if (fetchErr || !ebook) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Ebook not found" } },
      { status: 404 }
    );
  }

  const typedEbook = ebook as { title: string; subtitle: string | null; niche: string };

  // Deduct credits
  const creditResult = await deductCredits(userId, "cover_generation", ebookId);
  if (!creditResult.success) {
    return NextResponse.json(
      { error: { code: "INSUFFICIENT_CREDITS", message: creditResult.error } },
      { status: 402 }
    );
  }

  const style = (body.style ?? "minimalist") as "minimalist" | "bold" | "photographic" | "illustrated" | "gradient";

  const coverResult = await generateProductCover({
    title: typedEbook.title,
    subtitle: typedEbook.subtitle ?? undefined,
    niche: typedEbook.niche,
    productType: "ebook",
    style,
  });

  if (!coverResult) {
    return NextResponse.json(
      { error: { code: "GENERATION_FAILED", message: "Cover generation failed" } },
      { status: 500 }
    );
  }

  const storagePath = `${userId}/${ebookId}/cover-${Date.now()}.png`;
  const { error: uploadError } = await supabase.storage
    .from("covers")
    .upload(storagePath, coverResult.imageBuffer, {
      contentType: "image/png",
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: { code: "UPLOAD_FAILED", message: `Upload failed: ${uploadError.message}` } },
      { status: 500 }
    );
  }

  const { data: { publicUrl } } = supabase.storage
    .from("covers")
    .getPublicUrl(storagePath);

  const { data: cover } = await supabase
    .from("covers")
    .insert({
      ebook_id: ebookId,
      user_id: userId,
      prompt: coverResult.prompt,
      image_url: publicUrl,
      storage_path: storagePath,
      selected: false,
    })
    .select("id, image_url, prompt, selected, created_at")
    .single();

  return NextResponse.json({ data: cover });
}

/**
 * PATCH /api/ebooks/[ebookId]/covers — Select a cover
 * Body: { coverId: string }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ ebookId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }

  const { ebookId } = await params;

  let body: { coverId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_BODY", message: "Invalid JSON" } },
      { status: 400 }
    );
  }

  if (!body.coverId) {
    return NextResponse.json(
      { error: { code: "MISSING_COVER_ID", message: "coverId is required" } },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  // Deselect all
  await supabase
    .from("covers")
    .update({ selected: false })
    .eq("ebook_id", ebookId)
    .eq("user_id", userId);

  // Select the chosen one
  const { data: selected } = await supabase
    .from("covers")
    .update({ selected: true })
    .eq("id", body.coverId)
    .eq("ebook_id", ebookId)
    .eq("user_id", userId)
    .select("image_url")
    .single();

  if (selected) {
    // Update ebook cover_url
    await supabase
      .from("ebooks")
      .update({ cover_url: (selected as { image_url: string }).image_url })
      .eq("id", ebookId);
  }

  return NextResponse.json({ data: { selected: true } });
}
