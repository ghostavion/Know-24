import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getPublishedStorefront } from "@/lib/storefront/queries";
import { createServiceClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import type { ApiResponse } from "@/types/api";

const slugSchema = z.string().min(1);

interface ProductRow {
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
  sort_order: number;
  product_types: {
    slug: string;
    display_name: string;
    icon_name: string | null;
  } | null;
}

interface StorefrontProduct {
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
  sortOrder: number;
  productType: {
    slug: string;
    displayName: string;
    iconName: string | null;
  } | null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse<ApiResponse<StorefrontProduct[]>>> {
  try {
    const ip = _request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const rlResult = await checkRateLimit(ip, "storefront");
    if (!rlResult.success) {
      return NextResponse.json(
        { error: { code: "RATE_LIMITED", message: "Too many requests" } },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rlResult.reset - Date.now()) / 1000)) } }
      );
    }

    const { slug } = await params;

    const parsed = slugSchema.safeParse(slug);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid storefront slug",
            details: parsed.error.flatten(),
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

    const { data: products, error } = await supabase
      .from("products")
      .select(
        "id, title, slug, tagline, description, cover_image_url, preview_content, pricing_model, price_cents, compare_price_cents, is_lead_magnet, is_featured, sort_order, product_types(slug, display_name, icon_name)"
      )
      .eq("business_id", storefront.business_id)
      .eq("status", "active")
      .is("deleted_at", null)
      .order("is_featured", { ascending: false })
      .order("sort_order", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: { code: "FETCH_FAILED", message: "Failed to fetch products" } },
        { status: 500 }
      );
    }

    const formatted: StorefrontProduct[] = (
      products as unknown as ProductRow[]
    ).map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      tagline: p.tagline,
      description: p.description,
      coverImageUrl: p.cover_image_url,
      previewContent: p.preview_content,
      pricingModel: p.pricing_model,
      priceCents: p.price_cents,
      comparePriceCents: p.compare_price_cents,
      isLeadMagnet: p.is_lead_magnet,
      isFeatured: p.is_featured,
      sortOrder: p.sort_order,
      productType: p.product_types
        ? {
            slug: p.product_types.slug,
            displayName: p.product_types.display_name,
            iconName: p.product_types.icon_name,
          }
        : null,
    }));

    return NextResponse.json({ data: formatted });
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
