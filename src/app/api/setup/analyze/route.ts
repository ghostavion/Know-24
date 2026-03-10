import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { resolveUserId } from "@/lib/auth/resolve-user";
import { logPlatformEvent } from "@/lib/logging/platform-logger";
import { logActivity } from "@/lib/logging/activity-logger";
import type { ApiResponse } from "@/types/api";

const analyzeSchema = z.object({
  businessId: z.string().uuid("Invalid business ID"),
});

interface RecommendedProduct {
  productTypeSlug: string;
  reason: string;
  suggestedTitle: string;
}

interface AnalysisData {
  knowledgeSummary: string;
  topics: string[];
  recommendedProducts: RecommendedProduct[];
}

export async function POST(req: Request): Promise<NextResponse<ApiResponse<AnalysisData>>> {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const body: unknown = await req.json();
    const parsed = analyzeSchema.safeParse(body);
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

    const { businessId } = parsed.data;
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
    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("id", businessId)
      .eq("owner_id", userId)
      .single();

    if (!business) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Business not found or access denied" } },
        { status: 403 }
      );
    }

    // Update onboarding step
    const { error: updateError } = await supabase
      .from("businesses")
      .update({ onboarding_step: 2 })
      .eq("id", businessId);

    if (updateError) {
      return NextResponse.json(
        { error: { code: "UPDATE_FAILED", message: "Failed to update onboarding step" } },
        { status: 500 }
      );
    }

    logPlatformEvent({
      event_category: "DATA",
      event_type: "setup.analysis.completed",
      clerk_user_id: clerkUserId,
      status: "success",
      business_id: businessId,
      payload: { mock: true },
    });

    logActivity({
      business_id: businessId,
      event_type: "knowledge_ingested",
      title: "Knowledge analyzed",
      description: "AI analysis completed — product recommendations generated",
      metadata: { step: 2 },
    });

    // Mock analysis result — real AI integration comes later
    return NextResponse.json({
      data: {
        knowledgeSummary:
          "Your knowledge base covers a range of expertise topics...",
        topics: [
          "Core Methodology",
          "Best Practices",
          "Implementation Strategies",
          "Case Studies",
        ],
        recommendedProducts: [
          {
            productTypeSlug: "guide_ebook",
            reason: "Your content has enough depth for a comprehensive guide",
            suggestedTitle: "The Complete Guide",
          },
          {
            productTypeSlug: "cheat_sheet",
            reason: "Key concepts can be condensed into a quick reference",
            suggestedTitle: "Quick Reference Card",
          },
          {
            productTypeSlug: "email_course",
            reason: "Your topics naturally break into a learning sequence",
            suggestedTitle: "5-Day Email Masterclass",
          },
        ],
      },
    });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}
