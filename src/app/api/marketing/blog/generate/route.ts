import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { generateText } from "ai";
import { createServiceClient } from "@/lib/supabase/server";
import { resolveUserId } from "@/lib/auth/resolve-user";
import { primaryModel, logLLMCall } from "@/lib/ai/providers";
import { logPlatformEvent } from "@/lib/logging/platform-logger";
import { logActivity } from "@/lib/logging/activity-logger";
import { checkRateLimit } from "@/lib/rate-limit";
import type { ApiResponse } from "@/types/api";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const generateBlogSchema = z.object({
  businessId: z.string().uuid(),
  topic: z.string().min(1),
  tone: z.string().optional().default("professional"),
  wordCount: z.number().int().min(300).max(3000).optional().default(800),
});

interface GeneratedBlogPost {
  id: string;
  title: string;
  slug: string;
  body: string;
  metaDescription: string;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<GeneratedBlogPost>>> {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const rlResult = await checkRateLimit(ip, "ai");
    if (!rlResult.success) {
      return NextResponse.json(
        { error: { code: "RATE_LIMITED", message: "Too many requests" } },
        { status: 429 }
      );
    }

    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const body: unknown = await request.json();
    const parsed = generateBlogSchema.safeParse(body);
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

    const { businessId, topic, tone, wordCount } = parsed.data;
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

    const startTime = Date.now();
    const { text, usage } = await generateText({
      model: primaryModel,
      system: `You are a professional blog writer for ${business.name}, a ${business.niche} business. Write in a ${tone} tone.`,
      prompt: `Write a blog post about: ${topic}. Target word count: ${wordCount}. Format: Start with a compelling title on the first line, then a blank line, then the full article body using markdown formatting (## for headings, **bold**, etc). Include a brief meta description on the last line prefixed with 'META: '.`,
    });

    logLLMCall({
      businessId,
      userId,
      model: "gpt-4o",
      feature: "blog_generate",
      inputTokens: usage.inputTokens ?? 0,
      outputTokens: usage.outputTokens ?? 0,
      durationMs: Date.now() - startTime,
    });

    // Parse the AI response
    const lines = text.trim().split("\n");
    const title = lines[0].trim();

    // Find the META: line (last non-empty line)
    let metaDescription = "";
    let bodyEndIndex = lines.length;
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      if (line.startsWith("META: ")) {
        metaDescription = line.replace("META: ", "").trim();
        bodyEndIndex = i;
        break;
      }
      if (line.length > 0 && i < lines.length - 1) {
        // Non-empty line that isn't META — stop looking
        break;
      }
    }

    // Body is everything between title and meta line, trimmed
    const blogBody = lines
      .slice(1, bodyEndIndex)
      .join("\n")
      .trim();

    const slug = slugify(title);

    // Save to blog_posts
    const { data: post, error: insertError } = await supabase
      .from("blog_posts")
      .insert({
        business_id: businessId,
        title,
        slug,
        body: blogBody,
        meta_description: metaDescription || null,
        is_ai_generated: true,
        status: "draft",
      })
      .select("id")
      .single();

    if (insertError || !post) {
      return NextResponse.json(
        {
          error: {
            code: "CREATE_FAILED",
            message: "Failed to save generated blog post",
            details: insertError?.message,
          },
        },
        { status: 500 }
      );
    }

    logPlatformEvent({
      event_category: "LLM",
      event_type: "marketing.blog.generated",
      clerk_user_id: clerkUserId,
      status: "success",
      business_id: businessId,
      payload: { topic, tone, word_count: wordCount, post_id: post.id },
    });

    logActivity({
      business_id: businessId,
      event_type: "blog_published",
      title: `Blog post generated: ${title}`,
      description: `AI-generated blog post on "${topic}"`,
      metadata: { post_id: post.id, topic, tone },
    });

    return NextResponse.json({
      data: {
        id: post.id as string,
        title,
        slug,
        body: blogBody,
        metaDescription,
      },
    });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}
