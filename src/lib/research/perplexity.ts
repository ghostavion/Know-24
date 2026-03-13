// Perplexity Sonar API — synthesizes information across dozens of sources with citations

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

export interface PerplexityResponse {
  content: string;
  citations: string[];
}

export async function queryPerplexity(prompt: string, options?: {
  model?: string;
  maxTokens?: number;
}): Promise<PerplexityResponse> {
  if (!PERPLEXITY_API_KEY) {
    console.warn("PERPLEXITY_API_KEY not set, returning empty response");
    return { content: "", citations: [] };
  }

  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
      },
      body: JSON.stringify({
        model: options?.model ?? "sonar",
        messages: [
          {
            role: "system",
            content: "You are a market research analyst specializing in digital products. Provide detailed, data-driven analysis with specific numbers, prices, and trends. Always cite your sources.",
          },
          { role: "user", content: prompt },
        ],
        max_tokens: options?.maxTokens ?? 4096,
      }),
    });

    if (!response.ok) {
      console.error(`Perplexity API failed: ${response.status}`);
      return { content: "", citations: [] };
    }

    const data = await response.json();
    return {
      content: data.choices?.[0]?.message?.content ?? "",
      citations: data.citations ?? [],
    };
  } catch (error) {
    console.error("Perplexity API error:", error);
    return { content: "", citations: [] };
  }
}

// Research validated products in a niche
export async function researchNicheProducts(niche: string): Promise<PerplexityResponse> {
  return queryPerplexity(
    `Research the top-selling digital products in the "${niche}" niche. ` +
    `Include: 1) The 5 best-selling ebooks, courses, and guides with their prices and estimated sales. ` +
    `2) Content gaps — topics with high search demand but few quality products. ` +
    `3) Price sweet spots — what price ranges convert best. ` +
    `4) Trending sub-topics in the last 3 months. ` +
    `5) The ideal product format (ebook, course, toolkit, etc.) for this niche. ` +
    `Be specific with numbers and examples.`
  );
}

// Research competitor products
export async function researchCompetitors(niche: string, productTitle: string): Promise<PerplexityResponse> {
  return queryPerplexity(
    `Find the top 5 competing products similar to "${productTitle}" in the "${niche}" niche. ` +
    `For each competitor, include: title, price, platform (Amazon, Gumroad, Udemy, etc.), ` +
    `rating/reviews, what makes it successful, and what weaknesses or gaps it has. ` +
    `Be specific — I need real products with real data.`
  );
}
