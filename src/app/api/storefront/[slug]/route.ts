import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import type { ApiResponse } from "@/types/api";

const slugSchema = z.string().min(1);

interface StorefrontBusinessRow {
  id: string;
  business_id: string;
  subdomain: string;
  color_palette: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
  font_family: string | null;
  logo_url: string | null;
  hero_title: string | null;
  hero_tagline: string | null;
  hero_credibility: string | null;
  hero_cta_primary: string | null;
  hero_cta_secondary: string | null;
  about_title: string | null;
  about_body: string | null;
  about_photo_url: string | null;
  lead_magnet_product_id: string | null;
  lead_magnet_headline: string | null;
  social_links: Record<string, string> | null;
  meta_title: string | null;
  meta_description: string | null;
  is_published: boolean;
  businesses: {
    name: string;
    niche: string | null;
    tagline: string | null;
    bio: string | null;
    credibility_line: string | null;
    avatar_url: string | null;
  } | null;
}

interface StorefrontData {
  id: string;
  businessId: string;
  businessName: string;
  subdomain: string;
  colorPalette: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  fontFamily: string | null;
  logoUrl: string | null;
  heroTitle: string | null;
  heroTagline: string | null;
  heroCredibility: string | null;
  heroCtaPrimary: string | null;
  heroCtaSecondary: string | null;
  aboutTitle: string | null;
  aboutBody: string | null;
  aboutPhotoUrl: string | null;
  leadMagnetProductId: string | null;
  leadMagnetHeadline: string | null;
  socialLinks: Record<string, string> | null;
  metaTitle: string | null;
  metaDescription: string | null;
  isPublished: boolean;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse<ApiResponse<StorefrontData>>> {
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

    const supabase = createServiceClient();

    const { data: storefront, error } = await supabase
      .from("storefronts")
      .select(
        "*, businesses(name, niche, tagline, bio, credibility_line, avatar_url)"
      )
      .eq("subdomain", slug)
      .eq("is_published", true)
      .single();

    if (error || !storefront) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Storefront not found" } },
        { status: 404 }
      );
    }

    const row = storefront as unknown as StorefrontBusinessRow;

    const data: StorefrontData = {
      id: row.id,
      businessId: row.business_id,
      businessName: row.businesses?.name ?? "",
      subdomain: row.subdomain,
      colorPalette: row.color_palette,
      primaryColor: row.primary_color,
      secondaryColor: row.secondary_color,
      accentColor: row.accent_color,
      fontFamily: row.font_family,
      logoUrl: row.logo_url,
      heroTitle: row.hero_title,
      heroTagline: row.hero_tagline,
      heroCredibility: row.hero_credibility,
      heroCtaPrimary: row.hero_cta_primary,
      heroCtaSecondary: row.hero_cta_secondary,
      aboutTitle: row.about_title,
      aboutBody: row.about_body,
      aboutPhotoUrl: row.about_photo_url,
      leadMagnetProductId: row.lead_magnet_product_id,
      leadMagnetHeadline: row.lead_magnet_headline,
      socialLinks: row.social_links,
      metaTitle: row.meta_title,
      metaDescription: row.meta_description,
      isPublished: row.is_published,
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
