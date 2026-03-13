import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import { createServiceClient } from "@/lib/supabase/server";
import { resolveUserId } from "@/lib/auth/resolve-user";
import { logPlatformEvent } from "@/lib/logging/platform-logger";
import type { ApiResponse } from "@/types/api";
import type { DashboardBusiness } from "@/types/workspace";

interface BusinessWithStorefront {
  id: string;
  name: string;
  slug: string;
  niche: string;
  status: string;
  onboarding_completed: boolean;
  created_at: string;
  product_count: number;
  storefronts: { subdomain: string } | null;
}

export async function GET(): Promise<NextResponse<ApiResponse<DashboardBusiness[]>>> {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
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

    // Fetch businesses with storefront subdomain and product count
    const { data: rows, error } = await supabase
      .from("businesses")
      .select(
        `id, name, slug, niche, status, onboarding_completed, created_at,
        storefronts(subdomain)`
      )
      .eq("owner_id", userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: { code: "FETCH_FAILED", message: "Failed to fetch businesses" } },
        { status: 500 }
      );
    }

    // Get product counts for each business
    const businessIds = (rows ?? []).map((r: { id: string }) => r.id);

    let productCounts: Record<string, number> = {};

    if (businessIds.length > 0) {
      const { data: countRows } = await supabase
        .from("products")
        .select("business_id")
        .in("business_id", businessIds)
        .is("deleted_at", null);

      if (countRows) {
        productCounts = countRows.reduce<Record<string, number>>((acc, row: { business_id: string }) => {
          acc[row.business_id] = (acc[row.business_id] ?? 0) + 1;
          return acc;
        }, {});
      }
    }

    const businesses: DashboardBusiness[] = (
      rows as unknown as BusinessWithStorefront[]
    ).map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      niche: b.niche,
      status: b.status,
      onboardingCompleted: b.onboarding_completed ?? false,
      productCount: productCounts[b.id] ?? 0,
      storefrontUrl: b.storefronts?.subdomain
        ? `${b.storefronts.subdomain}.know24.io`
        : null,
      createdAt: b.created_at,
    }));

    logPlatformEvent({
      event_category: "DATA",
      event_type: "businesses.listed",
      clerk_user_id: clerkUserId,
      status: "success",
      payload: { count: businesses.length },
    });

    return NextResponse.json({ data: businesses });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}
