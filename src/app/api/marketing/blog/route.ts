import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { resolveUserId } from "@/lib/auth/resolve-user";
import type { ApiResponse } from "@/types/api";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const businessIdSchema = z.string().uuid();

const createBlogSchema = z.object({
  businessId: z.string().uuid(),
  title: z.string().min(1),
  body: z.string().min(1),
  excerpt: z.string().optional(),
  status: z.enum(["draft", "published"]).default("draft"),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
});

const updateBlogSchema = z.object({
  postId: z.string().uuid(),
  title: z.string().optional(),
  body: z.string().optional(),
  excerpt: z.string().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
});

interface BlogPost {
  id: string;
  business_id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  cover_image_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  author_name: string | null;
  is_ai_generated: boolean;
  status: string;
  published_at: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<BlogPost[]>>> {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const businessId = request.nextUrl.searchParams.get("businessId");
    const parsedId = businessIdSchema.safeParse(businessId);
    if (!parsedId.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Valid businessId query parameter is required",
          },
        },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Resolve Clerk user ID → internal UUID
    const userId = await resolveUserId(supabase, clerkUserId);
    if (!userId) {
      return NextResponse.json(
        { error: { code: "USER_NOT_FOUND", message: "User not found" } },
        { status: 404 }
      );
    }

    // Verify business ownership
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .select("id")
      .eq("id", parsedId.data)
      .eq("owner_id", userId)
      .single();

    if (bizError || !business) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Business not found" } },
        { status: 404 }
      );
    }

    const { data: posts, error: fetchError } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("business_id", parsedId.data)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (fetchError) {
      return NextResponse.json(
        { error: { code: "FETCH_FAILED", message: "Failed to fetch blog posts" } },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: (posts ?? []) as BlogPost[] });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<BlogPost>>> {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const body: unknown = await request.json();
    const parsed = createBlogSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input",
            details: parsed.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { businessId, title, body: postBody, excerpt, status, metaTitle, metaDescription } =
      parsed.data;
    const supabase = createServiceClient();

    // Resolve Clerk user ID → internal UUID
    const userId = await resolveUserId(supabase, clerkUserId);
    if (!userId) {
      return NextResponse.json(
        { error: { code: "USER_NOT_FOUND", message: "User not found" } },
        { status: 404 }
      );
    }

    // Verify business ownership
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .select("id")
      .eq("id", businessId)
      .eq("owner_id", userId)
      .single();

    if (bizError || !business) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Business not found" } },
        { status: 404 }
      );
    }

    const slug = slugify(title);

    const insertData: Record<string, unknown> = {
      business_id: businessId,
      title,
      slug,
      body: postBody,
      excerpt: excerpt ?? null,
      status,
      meta_title: metaTitle ?? null,
      meta_description: metaDescription ?? null,
      is_ai_generated: false,
    };

    if (status === "published") {
      insertData.published_at = new Date().toISOString();
    }

    const { data: post, error: insertError } = await supabase
      .from("blog_posts")
      .insert(insertData)
      .select()
      .single();

    if (insertError || !post) {
      return NextResponse.json(
        {
          error: {
            code: "CREATE_FAILED",
            message: "Failed to create blog post",
            details: insertError?.message,
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: post as BlogPost });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest
): Promise<NextResponse<ApiResponse<BlogPost>>> {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const body: unknown = await request.json();
    const parsed = updateBlogSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input",
            details: parsed.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { postId, title, body: postBody, excerpt, status, metaTitle, metaDescription } =
      parsed.data;
    const supabase = createServiceClient();

    // Resolve Clerk user ID → internal UUID
    const userId = await resolveUserId(supabase, clerkUserId);
    if (!userId) {
      return NextResponse.json(
        { error: { code: "USER_NOT_FOUND", message: "User not found" } },
        { status: 404 }
      );
    }

    // Fetch existing post and verify ownership
    const { data: existingPost, error: postError } = await supabase
      .from("blog_posts")
      .select("id, business_id, status, published_at")
      .eq("id", postId)
      .is("deleted_at", null)
      .single();

    if (postError || !existingPost) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Blog post not found" } },
        { status: 404 }
      );
    }

    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .select("id")
      .eq("id", existingPost.business_id)
      .eq("owner_id", userId)
      .single();

    if (bizError || !business) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "You do not own this blog post" } },
        { status: 403 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (title !== undefined) {
      updateData.title = title;
      updateData.slug = slugify(title);
    }
    if (postBody !== undefined) updateData.body = postBody;
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (metaTitle !== undefined) updateData.meta_title = metaTitle;
    if (metaDescription !== undefined) updateData.meta_description = metaDescription;
    if (status !== undefined) {
      updateData.status = status;
      // Set published_at only when transitioning to published for the first time
      if (status === "published" && !existingPost.published_at) {
        updateData.published_at = new Date().toISOString();
      }
    }

    updateData.updated_at = new Date().toISOString();

    const { data: updatedPost, error: updateError } = await supabase
      .from("blog_posts")
      .update(updateData)
      .eq("id", postId)
      .select()
      .single();

    if (updateError || !updatedPost) {
      return NextResponse.json(
        { error: { code: "UPDATE_FAILED", message: "Failed to update blog post" } },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: updatedPost as BlogPost });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}
