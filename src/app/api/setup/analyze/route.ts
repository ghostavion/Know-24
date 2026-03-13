import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { resolveUserId } from "@/lib/auth/resolve-user";
import { logPlatformEvent } from "@/lib/logging/platform-logger";
import { logActivity } from "@/lib/logging/activity-logger";
import { checkRateLimit } from "@/lib/rate-limit";
import type { ApiResponse } from "@/types/api";

const analyzeSchema = z.object({
  businessId: z.string().uuid("Invalid business ID"),
});

interface RecommendedProduct {
  productTypeSlug: string;
  reason: string;
  suggestedTitle: string;
  suggestedPrice?: number;
}

interface MarketInsights {
  topSellingProducts: unknown[];
  contentGaps: unknown[];
  trendingTopics: unknown[];
  pricingInsights: unknown;
}

interface AnalysisData {
  status: "completed" | "researching";
  knowledgeSummary: string | null;
  topics: string[];
  recommendedProducts: RecommendedProduct[];
  marketInsights?: MarketInsights;
}

export async function POST(req: Request): Promise<NextResponse<ApiResponse<AnalysisData>>> {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const rlResult = await checkRateLimit(ip, "api");
    if (!rlResult.success) {
      return NextResponse.json(
        { error: { code: "RATE_LIMITED", message: "Too many requests" } },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rlResult.reset - Date.now()) / 1000)) } }
      );
    }

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

    // Fetch latest research document for this business
    const { data: research } = await supabase
      .from("research_documents")
      .select("research_data, status")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!research || research.status !== "completed") {
      logPlatformEvent({
        event_category: "DATA",
        event_type: "setup.analysis.pending",
        clerk_user_id: clerkUserId,
        status: "success",
        business_id: businessId,
        payload: { researchStatus: research?.status ?? "not_found" },
      });

      return NextResponse.json({
        data: {
          status: "researching" as const,
          knowledgeSummary: null,
          topics: [],
          recommendedProducts: [],
        },
      });
    }

    const researchData = research.research_data as {
      recommendedProduct: {
        type: string;
        title: string;
        price: number;
        whyThisWillSell: string;
      };
      subNiches: string[];
      topSellingProducts: unknown[];
      contentGaps: Array<{ productType: string; title: string; reason: string }>;
      trendingTopics: unknown[];
      pricingInsights: unknown;
    };

    const recommendedProducts: RecommendedProduct[] = [
      {
        productTypeSlug: researchData.recommendedProduct.type,
        reason: researchData.recommendedProduct.whyThisWillSell,
        suggestedTitle: researchData.recommendedProduct.title,
        suggestedPrice: researchData.recommendedProduct.price,
      },
      ...(researchData.contentGaps ?? []).map((gap) => ({
        productTypeSlug: gap.productType,
        reason: gap.reason,
        suggestedTitle: gap.title,
      })),
    ];

    logPlatformEvent({
      event_category: "DATA",
      event_type: "setup.analysis.completed",
      clerk_user_id: clerkUserId,
      status: "success",
      business_id: businessId,
      payload: { productCount: recommendedProducts.length },
    });

    logActivity({
      business_id: businessId,
      event_type: "knowledge_ingested",
      title: "Knowledge analyzed",
      description: "AI analysis completed — product recommendations generated",
      metadata: { step: 2 },
    });

    return NextResponse.json({
      data: {
        status: "completed" as const,
        knowledgeSummary: researchData.recommendedProduct.whyThisWillSell,
        topics: researchData.subNiches,
        recommendedProducts,
        marketInsights: {
          topSellingProducts: researchData.topSellingProducts,
          contentGaps: researchData.contentGaps,
          trendingTopics: researchData.trendingTopics,
          pricingInsights: researchData.pricingInsights,
        },
      },
    });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}
