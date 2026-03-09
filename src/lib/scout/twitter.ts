// MVP: Simulated results. Replace with real API integration.

import type { PlatformResult, ScoutConfig } from "@/types/scout";

function buildTwitterResults(config: ScoutConfig): PlatformResult[] {
  const { niche, keywords, businessName } = config;
  const primaryKeyword: string = keywords[0] ?? niche;
  const secondaryKeyword: string = keywords[1] ?? niche;

  const results: PlatformResult[] = [
    {
      platform: "twitter",
      type: "trending_topic",
      title: `#${primaryKeyword.replace(/\s+/g, "")} is trending — 2.4K posts in the last hour`,
      url: `https://x.com/search?q=%23${encodeURIComponent(primaryKeyword.replace(/\s+/g, ""))}`,
      context: `The hashtag #${primaryKeyword.replace(/\s+/g, "")} is gaining momentum on X. Multiple creators and educators are sharing takes on the topic. Jumping in now with a thread from ${businessName} could capture significant visibility.`,
      relevanceHint: "high",
    },
    {
      platform: "twitter",
      type: "influencer_match",
      title: `@NicheInfluencer (52K followers) asked: "Who's doing ${niche} right?"`,
      url: "https://x.com/NicheInfluencer/status/1234567890",
      context: `A mid-tier influencer in the ${niche} space posted an open question about who is creating the best ${niche} content. The post has 340 likes and 89 replies. Engaging here or getting a mention could drive qualified traffic to ${businessName}.`,
      relevanceHint: "high",
    },
    {
      platform: "twitter",
      type: "trending_topic",
      title: `Viral thread: "The future of ${secondaryKeyword}" — 1.2K retweets`,
      url: "https://x.com/ThoughtLeader/status/9876543210",
      context: `A thought leader posted a thread about the future of "${secondaryKeyword}" that is going viral. The conversation is active and replies from knowledgeable voices are getting high engagement. An insightful quote-tweet from ${businessName} could ride the wave.`,
      relevanceHint: "medium",
    },
  ];

  return results;
}

export async function scanTwitter(config: ScoutConfig): Promise<PlatformResult[]> {
  // Simulate API latency
  await new Promise<void>((r) => setTimeout(r, 200));

  return buildTwitterResults(config);
}
