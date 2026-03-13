import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { deductCredits } from "@/lib/credits/service";
import { polishChapter } from "@/lib/ai/generators/ebook-pipeline";

/**
 * PUT /api/ebooks/[ebookId]/chapters/[chapterIndex]
 * Update a chapter's content (manual editing or AI rewrite).
 * Body: { content: string } for manual edit
 * Body: { rewrite: true } for AI rewrite (costs 5 credits)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ ebookId: string; chapterIndex: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }

  const { ebookId, chapterIndex: chapterIdxStr } = await params;
  const chapterIdx = parseInt(chapterIdxStr, 10);

  if (isNaN(chapterIdx) || chapterIdx < 0) {
    return NextResponse.json(
      { error: { code: "INVALID_INDEX", message: "Invalid chapter index" } },
      { status: 400 }
    );
  }

  let body: { content?: string; rewrite?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_BODY", message: "Invalid JSON" } },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  const { data: ebook, error: fetchErr } = await supabase
    .from("ebooks")
    .select("chapters")
    .eq("id", ebookId)
    .eq("user_id", userId)
    .single();

  if (fetchErr || !ebook) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Ebook not found" } },
      { status: 404 }
    );
  }

  const chapters = (ebook.chapters ?? []) as Array<{ title: string; content: string; wordCount: number }>;

  if (chapterIdx >= chapters.length) {
    return NextResponse.json(
      { error: { code: "INVALID_INDEX", message: "Chapter index out of range" } },
      { status: 400 }
    );
  }

  if (body.rewrite) {
    // AI rewrite — costs 5 credits
    const creditResult = await deductCredits(userId, "chapter_rewrite", ebookId);
    if (!creditResult.success) {
      return NextResponse.json(
        { error: { code: "INSUFFICIENT_CREDITS", message: creditResult.error } },
        { status: 402 }
      );
    }

    const polished = await polishChapter(chapters[chapterIdx]);
    chapters[chapterIdx] = polished;
  } else if (body.content !== undefined) {
    // Manual edit
    chapters[chapterIdx] = {
      ...chapters[chapterIdx],
      content: body.content,
      wordCount: body.content.split(/\s+/).length,
    };
  } else {
    return NextResponse.json(
      { error: { code: "INVALID_BODY", message: "Provide 'content' or 'rewrite: true'" } },
      { status: 400 }
    );
  }

  // Recalculate totals
  const totalWords = chapters.reduce((sum, ch) => sum + (ch.wordCount ?? ch.content.split(/\s+/).length), 0);
  const totalPages = Math.ceil(totalWords / 250);

  await supabase
    .from("ebooks")
    .update({ chapters, total_words: totalWords, total_pages: totalPages })
    .eq("id", ebookId);

  return NextResponse.json({
    data: {
      chapter: chapters[chapterIdx],
      totalWords,
      totalPages,
    },
  });
}
