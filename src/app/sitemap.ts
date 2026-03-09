import type { MetadataRoute } from "next";

const BASE_URL = "https://know24.io";

const blogSlugs = [
  "the-rise-of-knowledge-businesses",
  "5-ways-ai-is-changing-how-experts-monetize",
  "from-expert-to-entrepreneur",
];

const helpSlugs = [
  "getting-started",
  "products",
  "storefront",
  "marketing",
  "billing",
  "expert-engine",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/pricing`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/help`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
  ];

  const blogPages: MetadataRoute.Sitemap = blogSlugs.map((slug) => ({
    url: `${BASE_URL}/blog/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const helpPages: MetadataRoute.Sitemap = helpSlugs.map((slug) => ({
    url: `${BASE_URL}/help/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  return [...staticPages, ...blogPages, ...helpPages];
}
