// Tavily Search API client — optimized search results for LLM context windows

const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
const TAVILY_BASE_URL = "https://api.tavily.com";

export interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export async function searchTavily(query: string, options?: {
  maxResults?: number;
  searchDepth?: "basic" | "advanced";
  includeAnswer?: boolean;
}): Promise<{
  answer: string | null;
  results: TavilyResult[];
}> {
  if (!TAVILY_API_KEY) {
    console.warn("TAVILY_API_KEY not set, returning empty results");
    return { answer: null, results: [] };
  }

  try {
    const response = await fetch(`${TAVILY_BASE_URL}/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query,
        max_results: options?.maxResults ?? 5,
        search_depth: options?.searchDepth ?? "advanced",
        include_answer: options?.includeAnswer ?? true,
      }),
    });

    if (!response.ok) {
      console.error(`Tavily search failed: ${response.status}`);
      return { answer: null, results: [] };
    }

    const data = await response.json();
    return {
      answer: data.answer ?? null,
      results: (data.results ?? []).map((r: Record<string, unknown>) => ({
        title: r.title as string ?? "",
        url: r.url as string ?? "",
        content: r.content as string ?? "",
        score: r.score as number ?? 0,
      })),
    };
  } catch (error) {
    console.error("Tavily search error:", error);
    return { answer: null, results: [] };
  }
}

// Search for pricing data in a niche
export async function searchNichePricing(niche: string): Promise<TavilyResult[]> {
  const { results } = await searchTavily(
    `${niche} digital product pricing how much to charge ebook course guide 2025 2026`,
    { maxResults: 5, searchDepth: "advanced" }
  );
  return results;
}

// Search for trending topics in a niche
export async function searchTrendingTopics(niche: string): Promise<TavilyResult[]> {
  const { results } = await searchTavily(
    `trending ${niche} topics 2026 what people are asking about`,
    { maxResults: 5, searchDepth: "basic" }
  );
  return results;
}
