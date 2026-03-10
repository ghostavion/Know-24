import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { resolveUserId } from "@/lib/auth/resolve-user";
import { STOREFRONT_PALETTES } from "@/lib/constants/product-types";
import { logPlatformEvent, extractRequestMeta } from "@/lib/logging/platform-logger";
import { logActivity } from "@/lib/logging/activity-logger";
import type { ApiResponse } from "@/types/api";

const goLiveSchema = z.object({
  businessId: z.string().uuid("Invalid business ID"),
  palette: z.enum(["A", "B", "C", "D"]),
});

interface GoLiveData {
  storefrontUrl: string;
  businessId: string;
}

export async function POST(req: Request): Promise<NextResponse<ApiResponse<GoLiveData>>> {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const body: unknown = await req.json();
    const parsed = goLiveSchema.safeParse(body);
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

    const { businessId, palette } = parsed.data;
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

    // Resolve palette colors
    const paletteConfig = STOREFRONT_PALETTES.find((p) => p.id === palette);
    if (!paletteConfig) {
      return NextResponse.json(
        { error: { code: "INVALID_PALETTE", message: "Unknown palette selection" } },
        { status: 400 }
      );
    }

    // Update storefront with palette colors
    const { error: storefrontError } = await supabase
      .from("storefronts")
      .update({
        color_palette: palette,
        primary_color: paletteConfig.headerColor,
        secondary_color: paletteConfig.headerColor,
        accent_color: paletteConfig.accentColor,
      })
      .eq("business_id", businessId);

    if (storefrontError) {
      return NextResponse.json(
        { error: { code: "STOREFRONT_UPDATE_FAILED", message: "Failed to update storefront" } },
        { status: 500 }
      );
    }

    // Update business status to active
    const { error: businessUpdateError } = await supabase
      .from("businesses")
      .update({
        status: "active",
        onboarding_step: 5,
        onboarding_completed: true,
      })
      .eq("id", businessId);

    if (businessUpdateError) {
      return NextResponse.json(
        { error: { code: "BUSINESS_UPDATE_FAILED", message: "Failed to activate business" } },
        { status: 500 }
      );
    }

    // Get storefront subdomain
    const { data: storefront } = await supabase
      .from("storefronts")
      .select("subdomain")
      .eq("business_id", businessId)
      .single();

    if (!storefront) {
      return NextResponse.json(
        { error: { code: "STOREFRONT_NOT_FOUND", message: "Storefront not found" } },
        { status: 500 }
      );
    }

    const meta = extractRequestMeta(req);
    logPlatformEvent({
      event_category: "USER_ACTION",
      event_type: "setup.golive.completed",
      clerk_user_id: clerkUserId,
      status: "success",
      business_id: businessId,
      payload: { palette, subdomain: storefront.subdomain },
      ...meta,
    });

    logActivity({
      business_id: businessId,
      event_type: "storefront_published",
      title: "Storefront published — business is live!",
      description: `Storefront published at ${storefront.subdomain}.know24.io with palette ${palette}`,
      metadata: { palette, subdomain: storefront.subdomain },
    });

    logActivity({
      business_id: businessId,
      event_type: "onboarding_completed",
      title: "Onboarding completed",
      description: "Business setup wizard completed successfully",
    });

    return NextResponse.json({
      data: {
        storefrontUrl: `https://${storefront.subdomain}.know24.io`,
        businessId,
      },
    });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}
