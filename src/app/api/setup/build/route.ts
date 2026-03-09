import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { productGenerationQueue } from "@/lib/queue/queues";
import { PRODUCT_TYPES } from "@/lib/constants/product-types";
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
    const { userId } = await auth();
    if (!userId) {
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

    // Verify business ownership
    const { data: business } = await supabase
      .from("businesses")
      .select("id, name")
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

      await productGenerationQueue.add("generate-product", {
        productId,
        businessId,
        productTypeSlug: slug,
      });

      queuedProducts.push({
        id: productId,
        productTypeSlug: slug,
        status: "queued",
      });
    }

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
