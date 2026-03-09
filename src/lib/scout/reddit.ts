// MVP: Simulated results. Replace with real API integration.

import type { PlatformResult, ScoutConfig } from "@/types/scout";

function buildRedditResults(config: ScoutConfig): PlatformResult[] {
  const { niche, keywords, businessName } = config;
  const primaryKeyword: string = keywords[0] ?? niche;
  const secondaryKeyword: string = keywords[1] ?? niche;

  return [
    {
      platform: "reddit",
      type: "hot_thread",
      title: `Looking for recommendations about ${niche} — any good resources?`,
      url: `https://www.reddit.com/r/${niche.replace(/\s+/g, "")}/comments/abc123/looking_for_recommendations/`,
      context: `A thread in r/${niche.replace(/\s+/g, "")} with 47 upvotes and 23 comments. OP is asking for trusted resources related to "${primaryKeyword}". Several commenters are recommending competitors but no one has mentioned ${businessName} yet. High engagement window — thread is 4 hours old.`,
      relevanceHint: "high",
    },
    {
      platform: "reddit",
      type: "community_engagement",
      title: `Best ${niche} resources 2024? Compiling a list`,
      url: `https://www.reddit.com/r/${niche.replace(/\s+/g, "")}/comments/def456/best_resources_2024/`,
      context: `Community-driven list post gaining traction (89 upvotes, 41 comments). Users are sharing their favorite "${secondaryKeyword}" tools and courses. This is an ideal opportunity to get ${businessName} added to the list organically.`,
      relevanceHint: "high",
    },
    {
      platform: "reddit",
      type: "hot_thread",
      title: `Struggling with ${primaryKeyword} — what am I doing wrong?`,
      url: `https://www.reddit.com/r/Entrepreneur/comments/ghi789/struggling_with_${primaryKeyword.replace(/\s+/g, "_")}/`,
      context: `A frustrated learner in r/Entrepreneur posted about challenges with "${primaryKeyword}". The thread has 15 comments with mixed advice. A thoughtful, expert reply from ${businessName} could establish authority and drive traffic.`,
      relevanceHint: "medium",
    },
  ];
}

export async function scanReddit(config: ScoutConfig): Promise<PlatformResult[]> {
  // Simulate API latency
  await new Promise<void>((r) => setTimeout(r, 200));

  return buildRedditResults(config);
}
