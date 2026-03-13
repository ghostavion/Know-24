import type { MetadataRoute } from "next";
import { createServiceClient } from "@/lib/supabase/server";

const BASE_URL = "https://know24.io";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createServiceClient();

  /* ---- Static pages ---------------------------------------------------- */

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/pricing`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/help`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
  ];

  /* ---- Dynamic storefront pages (/s/[slug]) ---------------------------- */

  const { data: storefronts } = await supabase
    .from("storefronts")
    .select("subdomain, updated_at")
    .eq("is_published", true);

  const storefrontPages: MetadataRoute.Sitemap = (storefronts ?? []).map((sf) => ({
    url: `${BASE_URL}/s/${sf.subdomain}`,
    lastModified: sf.updated_at ? new Date(sf.updated_at) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  /* ---- Dynamic blog posts (/s/[slug]/blog/[postSlug]) ------------------ */

  const { data: blogPosts } = await supabase
    .from("blog_posts")
    .select("slug, published_at, business_id")
    .not("published_at", "is", null);

  // Map business_id → subdomain for URL construction
  const businessIds = [
    ...new Set((blogPosts ?? []).map((p) => p.business_id)),
  ];

  let businessToSubdomain: Record<string, string> = {};

  if (businessIds.length > 0) {
    const { data: sfLookup } = await supabase
      .from("storefronts")
      .select("business_id, subdomain")
      .eq("is_published", true)
      .in("business_id", businessIds);

    businessToSubdomain = Object.fromEntries(
      (sfLookup ?? []).map((sf) => [sf.business_id, sf.subdomain])
    );
  }

  const blogPages: MetadataRoute.Sitemap = (blogPosts ?? [])
    .filter((post) => businessToSubdomain[post.business_id])
    .map((post) => ({
      url: `${BASE_URL}/s/${businessToSubdomain[post.business_id]}/blog/${post.slug}`,
      lastModified: post.published_at ? new Date(post.published_at) : new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

  return [...staticPages, ...storefrontPages, ...blogPages];
}
