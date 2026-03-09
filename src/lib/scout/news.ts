// MVP: Simulated results. Replace with real API integration.

import type { PlatformResult, ScoutConfig } from "@/types/scout";

function buildNewsResults(config: ScoutConfig): PlatformResult[] {
  const { niche, keywords, businessName } = config;
  const primaryKeyword: string = keywords[0] ?? niche;
  const secondaryKeyword: string = keywords[1] ?? niche;

  return [
    {
      platform: "news",
      type: "trending_topic",
      title: `TechCrunch: "${primaryKeyword} market expected to grow 40% in 2024"`,
      url: `https://techcrunch.com/2024/01/${primaryKeyword.replace(/\s+/g, "-").toLowerCase()}-market-growth`,
      context: `A major tech publication just covered the growth of the "${primaryKeyword}" market. The article mentions several players but does not reference ${businessName}. Sharing this article with your own commentary or pitching a follow-up piece to the journalist could earn valuable press coverage.`,
      relevanceHint: "high",
    },
    {
      platform: "news",
      type: "competitor_activity",
      title: `Competitor spotlight: New ${niche} platform raises $5M seed round`,
      url: `https://www.businessinsider.com/${niche.replace(/\s+/g, "-").toLowerCase()}-startup-funding-2024`,
      context: `A competitor in the "${secondaryKeyword}" space just announced a funding round, generating buzz in industry publications. This is both a signal of market validation and an opportunity for ${businessName} to differentiate — consider publishing a thought-leadership piece or updating positioning to highlight what sets you apart.`,
      relevanceHint: "medium",
    },
  ];
}

export async function scanNews(config: ScoutConfig): Promise<PlatformResult[]> {
  // Simulate API latency
  await new Promise<void>((r) => setTimeout(r, 200));

  return buildNewsResults(config);
}
