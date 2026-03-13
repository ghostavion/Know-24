import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import type { ApiResponse } from "@/types/api";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ ebookId: string }> }
): Promise<NextResponse<ApiResponse<Record<string, unknown>>>> {
  const { ebookId } = await params;
  const supabase = createServiceClient();

  const { data: ebook, error } = await supabase
    .from("ebooks")
    .select(
      "id, title, subtitle, author_name, description, total_pages, total_words, target_price, niche, cover_url, published_at, chapters"
    )
    .eq("id", ebookId)
    .eq("status", "published")
    .single();

  if (error || !ebook) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Ebook not found" } },
      { status: 404 }
    );
  }

  const chapters = ebook.chapters as unknown as unknown[];

  return NextResponse.json({
    data: {
      id: ebook.id,
      title: ebook.title,
      subtitle: ebook.subtitle,
      author_name: ebook.author_name,
      description: ebook.description,
      total_pages: ebook.total_pages,
      total_words: ebook.total_words,
      target_price: ebook.target_price,
      niche: ebook.niche,
      cover_url: ebook.cover_url,
      published_at: ebook.published_at,
      chapter_count: chapters?.length ?? 0,
    },
  });
}
