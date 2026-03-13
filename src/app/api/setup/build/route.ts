import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { resolveUserId } from "@/lib/auth/resolve-user";
import {
  dispatchProductGeneration,
  dispatchCoverGeneration,
  dispatchStorefrontBuild,
} from "@/lib/queue/dispatch";
import { PRODUCT_TYPES } from "@/lib/constants/product-types";
import { logPlatformEvent } from "@/lib/logging/platform-logger";
import { logActivity } from "@/lib/logging/activity-logger";
import { checkRateLimit } from "@/lib/rate-limit";
import type { ApiResponse } from "@/types/api";

const buildSchema = z.object({
  businessId: z.string().uuid("Invalid business ID"),
  productTypes: z
    .array(z.string().min(1))
    .min(1, "At least one product type is required"),
});

interface QueuedProduct {
  id: string;
  productTypeSlug: string;
  status: string;
}

interface BuildData {
  products: QueuedProduct[];
}

export async function POST(req: Request): Promise<NextResponse<ApiResponse<BuildData>>> {
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
    const parsed = buildSchema.safeParse(body);
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

    const { businessId, productTypes } = parsed.data;
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
      .select("id, name, niche")
      .eq("id", businessId)
      .eq("owner_id", userId)
      .single();

    if (!business) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Business not found or access denied" } },
        { status: 403 }
      );
    }

    const queuedProducts: QueuedProduct[] = [];

    for (const slug of productTypes) {
      // Resolve display name from constants
      const typeConfig = PRODUCT_TYPES.find((pt) => pt.slug === slug);
      if (!typeConfig) {
        return NextResponse.json(
          {
            error: {
              code: "INVALID_PRODUCT_TYPE",
              message: `Unknown product type: ${slug}`,
            },
          },
          { status: 400 }
        );
      }

      // Look up product_type_id from the database
      const { data: productType } = await supabase
        .from("product_types")
        .select("id")
        .eq("slug", slug)
        .single();

      if (!productType) {
        return NextResponse.json(
          {
            error: {
              code: "PRODUCT_TYPE_NOT_FOUND",
              message: `Product type not found in database: ${slug}`,
            },
          },
          { status: 400 }
        );
      }

      const productId = crypto.randomUUID();
      const title = `${typeConfig.displayName} \u2014 ${business.name}`;
      const productSlug = `${slug}-${crypto.randomUUID().slice(0, 8)}`;

      const { error: insertError } = await supabase.from("products").insert({
        id: productId,
        business_id: businessId,
        product_type_id: productType.id,
        title,
        slug: productSlug,
        status: "generating",
      });

      if (insertError) {
        return NextResponse.json(
          { error: { code: "INSERT_FAILED", message: "Failed to create product record" } },
          { status: 500 }
        );
      }

      await dispatchProductGeneration({
        productId,
        businessId,
        productTypeSlug: slug,
      });

      await dispatchCoverGeneration({
        productId,
        businessId,
        title,
        niche: business.niche ?? "general",
      });

      queuedProducts.push({
        id: productId,
        productTypeSlug: slug,
        status: "queued",
      });
    }

    // Dispatch storefront build
    await dispatchStorefrontBuild({
      businessId,
      productId: queuedProducts[0]?.id ?? "",
    });

    // Update onboarding step
    const { error: updateError } = await supabase
      .from("businesses")
      .update({ onboarding_step: 4 })
      .eq("id", businessId);

    if (updateError) {
      return NextResponse.json(
        { error: { code: "UPDATE_FAILED", message: "Failed to update onboarding step" } },
        { status: 500 }
      );
    }

    logPlatformEvent({
      event_category: "DATA",
      event_type: "setup.build.queued",
      clerk_user_id: clerkUserId,
      status: "success",
      business_id: businessId,
      payload: {
        product_count: queuedProducts.length,
        product_types: productTypes,
        product_ids: queuedProducts.map((p) => p.id),
      },
    });

    for (const qp of queuedProducts) {
      logActivity({
        business_id: businessId,
        event_type: "product_created",
        title: "Product queued for generation",
        description: `Product type: ${qp.productTypeSlug}`,
        metadata: { product_id: qp.id, product_type: qp.productTypeSlug },
      });
    }

    return NextResponse.json({
      data: { products: queuedProducts },
    });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}
