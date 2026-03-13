import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { resolveUserId } from "@/lib/auth/resolve-user";
import { logPlatformEvent, extractRequestMeta } from "@/lib/logging/platform-logger";
import { logActivity } from "@/lib/logging/activity-logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { dispatchResearchNiche } from "@/lib/queue/dispatch";
import type { ApiResponse } from "@/types/api";

const nicheSelectSchema = z.object({
  nicheSlug: z.string().min(1, "Niche slug is required"),
  customNiche: z.string().optional(),
  personalContext: z.string().optional(),
});

function generateSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") +
    "-" +
    crypto.randomUUID().slice(0, 8)
  );
}

interface NicheSelectResponse {
  businessId: string;
  niche: string;
  status: string;
}

export async function POST(req: Request): Promise<NextResponse<ApiResponse<NicheSelectResponse>>> {
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
    const parsed = nicheSelectSchema.safeParse(body);
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

    const { nicheSlug, customNiche, personalContext } = parsed.data;
    const supabase = createServiceClient();

    const userId = await resolveUserId(supabase, clerkUserId);
    if (!userId) {
      return NextResponse.json(
        { error: { code: "USER_NOT_FOUND", message: "User record not found. Please sign out and sign back in." } },
        { status: 404 }
      );
    }

    // Look up niche category
    let nicheName: string;
    let nicheId: string | null = null;
    let subNiches: string[] = [];

    if (nicheSlug === "custom" && customNiche) {
      nicheName = customNiche;
    } else {
      const { data: niche, error: nicheError } = await supabase
        .from("niche_categories")
        .select("id, name, slug, sub_niches")
        .eq("slug", nicheSlug)
        .single();

      if (nicheError || !niche) {
        return NextResponse.json(
          { error: { code: "NICHE_NOT_FOUND", message: "Niche category not found" } },
          { status: 404 }
        );
      }

      nicheName = niche.name;
      nicheId = niche.id;
      subNiches = (niche.sub_niches as string[]) ?? [];
    }

    // Check if user already has a business
    const { data: existingBusiness } = await supabase
      .from("businesses")
      .select("id")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    let businessId: string;

    if (existingBusiness) {
      businessId = existingBusiness.id;

      // Update the existing business with niche info
      const { error: updateError } = await supabase
        .from("businesses")
        .update({ niche: nicheName, onboarding_step: 1 })
        .eq("id", businessId);

      if (updateError) {
        return NextResponse.json(
          { error: { code: "UPDATE_FAILED", message: "Failed to update business" } },
          { status: 500 }
        );
      }
    } else {
      // Create a new business
      businessId = crypto.randomUUID();
      const { error: createError } = await supabase.from("businesses").insert({
        id: businessId,
        owner_id: userId,
        name: nicheName + " Business",
        niche: nicheName,
        slug: generateSlug(nicheName),
        onboarding_step: 1,
      });

      if (createError) {
        return NextResponse.json(
          { error: { code: "BUSINESS_CREATE_FAILED", message: createError.message } },
          { status: 500 }
        );
      }
    }

    // Create research document (schema column is niche_text, NOT niche_slug)
    const { error: researchError } = await supabase.from("research_documents").insert({
      business_id: businessId,
      niche_category_id: nicheId,
      niche_text: nicheName,
      personal_context: personalContext ?? null,
      status: "researching",
    });

    if (researchError) {
      return NextResponse.json(
        { error: { code: "RESEARCH_CREATE_FAILED", message: researchError.message } },
        { status: 500 }
      );
    }

    // Dispatch niche research via Inngest
    await dispatchResearchNiche({
      businessId,
      niche: nicheName,
      subNiches,
      personalContext: personalContext ?? undefined,
    });

    const meta = extractRequestMeta(req);
    logPlatformEvent({
      event_category: "USER_ACTION",
      event_type: "setup.niche.selected",
      clerk_user_id: clerkUserId,
      user_id: userId,
      status: "success",
      business_id: businessId,
      payload: { nicheSlug, nicheName, customNiche, personalContext },
      ...meta,
    });

    logActivity({
      business_id: businessId,
      event_type: "business_created",
      title: `Niche selected: ${nicheName}`,
      description: `Research started for the ${nicheName} niche`,
      metadata: { nicheSlug, personalContext },
    });

    return NextResponse.json({
      data: { businessId, niche: nicheName, status: "researching" },
    });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}
