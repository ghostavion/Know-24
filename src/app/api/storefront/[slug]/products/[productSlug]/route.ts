import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getPublishedStorefront } from "@/lib/storefront/queries";
import { createServiceClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import type { ApiResponse } from "@/types/api";

const slugSchema = z.string().min(1);

interface ProductDetailRow {
  id: string;
  title: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  cover_image_url: string | null;
  preview_content: string | null;
  pricing_model: string;
  price_cents: number;
  compare_price_cents: number | null;
  is_lead_magnet: boolean;
  is_featured: boolean;
  product_types: {
    slug: string;
    display_name: string;
    icon_name: string | null;
  } | null;
}

interface StorefrontProductDetail {
  id: string;
  title: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  coverImageUrl: string | null;
  previewContent: string | null;
  pricingModel: string;
  priceCents: number;
  comparePriceCents: number | null;
  isLeadMagnet: boolean;
  isFeatured: boolean;
  productType: {
    slug: string;
    displayName: string;
    iconName: string | null;
  } | null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string; productSlug: string }> }
): Promise<NextResponse<ApiResponse<StorefrontProductDetail>>> {
  try {
    const ip = _request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const rlResult = await checkRateLimit(ip, "storefront");
    if (!rlResult.success) {
      return NextResponse.json(
        { error: { code: "RATE_LIMITED", message: "Too many requests" } },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rlResult.reset - Date.now()) / 1000)) } }
      );
    }

    const { slug, productSlug } = await params;

    const parsedSlug = slugSchema.safeParse(slug);
    if (!parsedSlug.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid storefront slug",
            details: parsedSlug.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const parsedProductSlug = slugSchema.safeParse(productSlug);
    if (!parsedProductSlug.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid product slug",
            details: parsedProductSlug.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const storefront = await getPublishedStorefront(slug);
    if (!storefront) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Storefront not found" } },
        { status: 404 }
      );
    }

    const supabase = createServiceClient();

    const { data: product, error } = await supabase
      .from("products")
      .select(
        "id, title, slug, tagline, description, cover_image_url, preview_content, pricing_model, price_cents, compare_price_cents, is_lead_magnet, is_featured, product_types(slug, display_name, icon_name)"
      )
      .eq("business_id", storefront.business_id)
      .eq("slug", productSlug)
      .eq("status", "active")
      .is("deleted_at", null)
      .single();

    if (error || !product) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Product not found" } },
        { status: 404 }
      );
    }

    const row = product as unknown as ProductDetailRow;

    const data: StorefrontProductDetail = {
      id: row.id,
      title: row.title,
      slug: row.slug,
      tagline: row.tagline,
      description: row.description,
      coverImageUrl: row.cover_image_url,
      previewContent: row.preview_content,
      pricingModel: row.pricing_model,
      priceCents: row.price_cents,
      comparePriceCents: row.compare_price_cents,
      isLeadMagnet: row.is_lead_magnet,
      isFeatured: row.is_featured,
      productType: row.product_types
        ? {
            slug: row.product_types.slug,
            displayName: row.product_types.display_name,
            iconName: row.product_types.icon_name,
          }
        : null,
    };

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
        },
      },
      { status: 500 }
    );
  }
}
