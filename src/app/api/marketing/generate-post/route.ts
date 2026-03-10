import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { generateText } from "ai";
import { createServiceClient } from "@/lib/supabase/server";
import { primaryModel, logLLMCall } from "@/lib/ai/providers";
import { logPlatformEvent } from "@/lib/logging/platform-logger";
import { logActivity } from "@/lib/logging/activity-logger";
import type { ApiResponse } from "@/types/api";

const generatePostSchema = z.object({
  businessId: z.string().uuid(),
  platform: z.enum(["twitter", "linkedin", "facebook", "instagram"]),
  length: z.enum(["short", "medium", "long"]),
  productId: z.string().uuid().optional(),
  topic: z.string().optional(),
});

interface GeneratedPost {
  id: string;
  content: string;
  platform: string;
  length: string;
  characterCount: number;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<GeneratedPost>>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const body: unknown = await request.json();
    const parsed = generatePostSchema.safeParse(body);
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

    const { businessId, platform, length, productId, topic } = parsed.data;
    const supabase = createServiceClient();

    // Verify business ownership
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .select("id, name, niche")
      .eq("id", businessId)
      .eq("owner_id", userId)
      .single();

    if (bizError || !business) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Business not found" } },
        { status: 404 }
      );
    }

    // Optionally get product context
    let productContext = "";
    if (productId) {
      const { data: product } = await supabase
        .from("products")
        .select("title")
        .eq("id", productId)
        .eq("business_id", businessId)
        .single();

      if (product) {
        productContext = `The post should promote the product: "${product.title}".`;
      }
    }

    const topicContext = topic ? `Topic/angle: ${topic}.` : "";

    const llmStart = Date.now();
    const { text, usage } = await generateText({
      model: primaryModel,
      prompt: `You are a social media expert. Generate a ${length} ${platform} post for ${business.name}, a ${business.niche} business. ${productContext} ${topicContext} Length guide: short=under 100 chars, medium=100-250 chars, long=250-500 chars. Return ONLY the post text, no quotes.`,
    });
    const llmDurationMs = Date.now() - llmStart;

    logLLMCall({
      businessId,
      userId,
      model: "gpt-4o",
      feature: "marketing.generate-post",
      inputTokens: usage?.inputTokens ?? 0,
      outputTokens: usage?.outputTokens ?? 0,
      durationMs: llmDurationMs,
      status: "success",
    });

    const content = text.trim();

    // Save to social_posts
    const { data: post, error: insertError } = await supabase
      .from("social_posts")
      .insert({
        business_id: businessId,
        product_id: productId ?? null,
        content,
        platform,
        length,
        status: "draft",
      })
      .select("id")
      .single();

    if (insertError || !post) {
      return NextResponse.json(
        { error: { code: "CREATE_FAILED", message: "Failed to save generated post" } },
        { status: 500 }
      );
    }

    logPlatformEvent({
      event_category: "LLM",
      event_type: "marketing.social_post.generated",
      clerk_user_id: userId,
      status: "success",
      business_id: businessId,
      payload: { platform, length, post_id: post.id },
    });

    logActivity({
      business_id: businessId,
      event_type: "social_post_generated",
      title: `Social post generated for ${platform}`,
      description: `${length} ${platform} post created`,
      metadata: { post_id: post.id, platform, length },
    });

    return NextResponse.json({
      data: {
        id: post.id as string,
        content,
        platform,
        length,
        characterCount: content.length,
      },
    });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}
