import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import type { ApiResponse } from "@/types/api";

const businessIdSchema = z.string().uuid();
const postIdSchema = z.string().uuid();

interface SocialPost {
  id: string;
  business_id: string;
  product_id: string | null;
  content: string;
  image_url: string | null;
  platform: string;
  length: string;
  status: string;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<SocialPost[]>>> {
  try {
    const { userId } = await auth();
    if (!userId) {
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
      .from("social_posts")
      .select("*")
      .eq("business_id", parsedId.data)
      .order("created_at", { ascending: false });

    if (fetchError) {
      return NextResponse.json(
        { error: { code: "FETCH_FAILED", message: "Failed to fetch posts" } },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: (posts ?? []) as SocialPost[] });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ deleted: boolean }>>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const postId = request.nextUrl.searchParams.get("postId");
    const parsedId = postIdSchema.safeParse(postId);
    if (!parsedId.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Valid postId query parameter is required",
          },
        },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Verify the post belongs to user's business
    const { data: post, error: postError } = await supabase
      .from("social_posts")
      .select("id, business_id")
      .eq("id", parsedId.data)
      .single();

    if (postError || !post) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Post not found" } },
        { status: 404 }
      );
    }

    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .select("id")
      .eq("id", post.business_id)
      .eq("owner_id", userId)
      .single();

    if (bizError || !business) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "You do not own this post" } },
        { status: 403 }
      );
    }

    const { error: deleteError } = await supabase
      .from("social_posts")
      .delete()
      .eq("id", parsedId.data);

    if (deleteError) {
      return NextResponse.json(
        { error: { code: "DELETE_FAILED", message: "Failed to delete post" } },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: { deleted: true } });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}
