// Firecrawl Agent API client for autonomous web research
// Uses the Agent endpoint to search, navigate, and extract structured data
// API docs: https://docs.firecrawl.dev/features/extract

import { z } from "zod";

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
const FIRECRAWL_BASE_URL = "https://api.firecrawl.dev/v1";

// Schema for niche product research
const NicheProductSchema = z.object({
  title: z.string(),
  platform: z.string(),
  price: z.string().optional(),
  format: z.string().optional(),
  rating: z.string().optional(),
  reviewCount: z.number().optional(),
  url: z.string().optional(),
  description: z.string().optional(),
});

export type NicheProduct = z.infer<typeof NicheProductSchema>;

// Research a niche using Firecrawl's search endpoint
export async function searchNicheProducts(niche: string, subNiches: string[]): Promise<{
  products: NicheProduct[];
  sources: { url: string; title: string }[];
}> {
  if (!FIRECRAWL_API_KEY) {
    console.warn("FIRECRAWL_API_KEY not set, returning empty results");
    return { products: [], sources: [] };
  }

  const queries = [
    `best selling ${niche} digital products ebooks courses 2026`,
    `top ${niche} guides books reviews`,
    ...subNiches.slice(0, 2).map(s => `${s} digital product guide ebook`),
  ];

  const allProducts: NicheProduct[] = [];
  const allSources: { url: string; title: string }[] = [];

  for (const query of queries) {
    try {
      const response = await fetch(`${FIRECRAWL_BASE_URL}/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
        },
        body: JSON.stringify({
          query,
          limit: 5,
          scrapeOptions: { formats: ["markdown"] },
        }),
      });

      if (!response.ok) {
        console.error(`Firecrawl search failed: ${response.status}`);
        continue;
      }

      const data = await response.json();

      if (data.data && Array.isArray(data.data)) {
        for (const result of data.data) {
          allSources.push({
            url: result.url ?? "",
            title: result.metadata?.title ?? result.url ?? "",
          });
          // Products will be extracted from markdown content by the orchestrator
        }
      }
    } catch (error) {
      console.error(`Firecrawl search error for "${query}":`, error);
    }
  }

  return { products: allProducts, sources: allSources };
}

// Scrape a specific URL for structured data
export async function scrapeUrl(url: string): Promise<{
  markdown: string;
  title: string;
  url: string;
} | null> {
  if (!FIRECRAWL_API_KEY) return null;

  try {
    const response = await fetch(`${FIRECRAWL_BASE_URL}/scrape`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    return {
      markdown: data.data?.markdown ?? "",
      title: data.data?.metadata?.title ?? "",
      url,
    };
  } catch {
    return null;
  }
}
