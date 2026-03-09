// MVP: Simulated results. Replace with real API integration.

import type { PlatformResult, ScoutConfig } from "@/types/scout";

function buildQuoraResults(config: ScoutConfig): PlatformResult[] {
  const { niche, keywords, businessName } = config;
  const primaryKeyword: string = keywords[0] ?? niche;
  const secondaryKeyword: string = keywords[1] ?? niche;

  return [
    {
      platform: "quora",
      type: "hot_thread",
      title: `What is the best way to learn ${primaryKeyword} in 2024?`,
      url: `https://www.quora.com/What-is-the-best-way-to-learn-${primaryKeyword.replace(/\s+/g, "-")}-in-2024`,
      context: `This question has 14K views and 8 answers, but no answer currently links to ${businessName}. The top answer is generic and has only 12 upvotes — a detailed, authoritative response from ${businessName} could claim the top spot and drive ongoing organic traffic.`,
      relevanceHint: "high",
    },
    {
      platform: "quora",
      type: "community_engagement",
      title: `Are there any good ${niche} courses that actually deliver results?`,
      url: `https://www.quora.com/Are-there-any-good-${niche.replace(/\s+/g, "-")}-courses-that-deliver-results`,
      context: `A recently posted question (3 days old) with 2.1K views and only 3 answers. Users in the "${secondaryKeyword}" space are actively looking for recommendations. An honest, value-driven answer mentioning ${businessName} would be well-received.`,
      relevanceHint: "medium",
    },
  ];
}

export async function scanQuora(config: ScoutConfig): Promise<PlatformResult[]> {
  // Simulate API latency
  await new Promise<void>((r) => setTimeout(r, 200));

  return buildQuoraResults(config);
}
