// MVP: Simulated results. Replace with real API integration.

import type { PlatformResult, ScoutConfig } from "@/types/scout";

function buildPodcastResults(config: ScoutConfig): PlatformResult[] {
  const { niche, keywords, businessName } = config;
  const primaryKeyword: string = keywords[0] ?? niche;

  return [
    {
      platform: "podcasts",
      type: "podcast_opportunity",
      title: `"The ${niche} Hour" is actively seeking guest experts`,
      url: `https://podcasts.apple.com/us/podcast/the-${niche.replace(/\s+/g, "-").toLowerCase()}-hour/id1500000001`,
      context: `A mid-size podcast (estimated 5K downloads/episode) focused on "${primaryKeyword}" recently posted a call for guest experts on their social channels. They are looking for practitioners who can share real-world insights. ${businessName} would be a strong fit — pitch a specific topic tied to your expertise.`,
      relevanceHint: "high",
    },
    {
      platform: "podcasts",
      type: "podcast_opportunity",
      title: `"Creator Economy Weekly" episode gap — ${niche} topic needed`,
      url: "https://podcasts.apple.com/us/podcast/creator-economy-weekly/id1500000002",
      context: `A popular creator-economy podcast (12K downloads/episode) has an open slot in their upcoming schedule. Their recent episodes have not covered ${niche}, and listener requests suggest demand. Reaching out with a concise pitch from ${businessName} about "${primaryKeyword}" trends could land a guest spot.`,
      relevanceHint: "medium",
    },
  ];
}

export async function scanPodcasts(config: ScoutConfig): Promise<PlatformResult[]> {
  // Simulate API latency
  await new Promise<void>((r) => setTimeout(r, 200));

  return buildPodcastResults(config);
}
