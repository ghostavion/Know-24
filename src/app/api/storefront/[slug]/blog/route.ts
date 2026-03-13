import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getPublishedStorefront } from "@/lib/storefront/queries";
import { createServiceClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import type { ApiResponse } from "@/types/api";

const slugSchema = z.string().min(1);

interface BlogPostRow {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string | null;
  cover_image_url: string | null;
  author_name: string | null;
  published_at: string | null;
  view_count: number;
}

interface StorefrontBlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string | null;
  coverImageUrl: string | null;
  authorName: string | null;
  publishedAt: string | null;
  viewCount: number;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse<ApiResponse<StorefrontBlogPost[]>>> {
  try {
    const ip = _request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const rlResult = await checkRateLimit(ip, "storefront");
    if (!rlResult.success) {
      return NextResponse.json(
        { error: { code: "RATE_LIMITED", message: "Too many requests" } },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rlResult.reset - Date.now()) / 1000)) } }
      );
    }

    const { slug } = await params;

    const parsed = slugSchema.safeParse(slug);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid storefront slug",
            details: parsed.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const storefront = await getPublishedStorefront(slug);
    if (!storefront) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Storefront not found" } },
        { status: 404 }
      );
    }

    const supabase = createServiceClient();

    const { data: posts, error } = await supabase
      .from("blog_posts")
      .select(
        "id, title, slug, excerpt, body, cover_image_url, author_name, published_at, view_count"
      )
      .eq("business_id", storefront.business_id)
      .eq("status", "published")
      .is("deleted_at", null)
      .order("published_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        {
          error: {
            code: "FETCH_FAILED",
            message: "Failed to fetch blog posts",
          },
        },
        { status: 500 }
      );
    }

    const formatted: StorefrontBlogPost[] = (
      posts as unknown as BlogPostRow[]
    ).map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
      body: p.body,
      coverImageUrl: p.cover_image_url,
      authorName: p.author_name,
      publishedAt: p.published_at,
      viewCount: p.view_count,
    }));

    return NextResponse.json({ data: formatted });
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
        },
      },
      { status: 500 }
    );
  }
}
