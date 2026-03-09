// MVP: Simulated results. Replace with real API integration.

import type { PlatformResult, ScoutConfig } from "@/types/scout";

function buildLinkedInResults(config: ScoutConfig): PlatformResult[] {
  const { niche, keywords, businessName } = config;
  const primaryKeyword: string = keywords[0] ?? niche;

  return [
    {
      platform: "linkedin",
      type: "influencer_match",
      title: `Industry leader posted: "We need better ${niche} education"`,
      url: "https://www.linkedin.com/feed/update/urn:li:activity:7100000000000000001",
      context: `A LinkedIn influencer with 28K followers and VP-level title published a post calling for better education in "${primaryKeyword}". The post has 450+ reactions and 67 comments. Several commenters are asking for specific recommendations — a thoughtful comment from ${businessName} linking to relevant content could generate high-quality B2B leads.`,
      relevanceHint: "high",
    },
    {
      platform: "linkedin",
      type: "community_engagement",
      title: `Poll: "What's your biggest challenge with ${primaryKeyword}?" — 1,200 votes`,
      url: "https://www.linkedin.com/feed/update/urn:li:activity:7100000000000000002",
      context: `A poll in the ${niche} professional community is getting strong engagement. The top-voted challenge aligns directly with what ${businessName} solves. Commenting with a brief case study or insight could position ${businessName} as the go-to solution.`,
      relevanceHint: "medium",
    },
  ];
}

export async function scanLinkedIn(config: ScoutConfig): Promise<PlatformResult[]> {
  // Simulate API latency
  await new Promise<void>((r) => setTimeout(r, 200));

  return buildLinkedInResults(config);
}
