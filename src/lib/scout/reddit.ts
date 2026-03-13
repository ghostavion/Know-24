import type { PlatformResult, ScoutConfig } from "@/types/scout";

const REDDIT_TIMEOUT_MS = 5000;
const USER_AGENT = "Know24-Scout/1.0 (server-side research)";

interface RedditPost {
  title: string;
  selftext?: string;
  permalink: string;
  score: number;
  num_comments: number;
  subreddit: string;
}

interface RedditListingChild {
  data: RedditPost;
}

interface RedditListingResponse {
  data: {
    children: RedditListingChild[];
  };
}

async function fetchRedditJson(url: string): Promise<RedditListingResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REDDIT_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Reddit API returned ${response.status}`);
    }

    return (await response.json()) as RedditListingResponse;
  } finally {
    clearTimeout(timeout);
  }
}

function mapPostToResult(post: RedditPost): PlatformResult {
  return {
    platform: "reddit",
    type: "hot_thread",
    title: post.title,
    url: `https://reddit.com${post.permalink}`,
    context: post.selftext?.slice(0, 500) ?? "",
    relevanceHint:
      post.score > 50 ? "high" : post.score > 10 ? "medium" : "low",
  };
}

export async function scanReddit(
  config: ScoutConfig,
): Promise<PlatformResult[]> {
  const { niche, keywords } = config;
  const query = [niche, ...keywords].join(" ");
  const encodedQuery = encodeURIComponent(query);

  const results: PlatformResult[] = [];
  const seenUrls = new Set<string>();

  // General search across all of Reddit
  try {
    const generalUrl = `https://www.reddit.com/search.json?q=${encodedQuery}&sort=relevance&t=week&limit=10`;
    const generalData = await fetchRedditJson(generalUrl);

    for (const child of generalData.data.children) {
      const mapped = mapPostToResult(child.data);
      if (!seenUrls.has(mapped.url)) {
        seenUrls.add(mapped.url);
        results.push(mapped);
      }
    }
  } catch {
    // General search failed — continue with subreddit searches
  }

  // Search niche-specific subreddits
  const subreddits = [
    niche.replace(/\s+/g, ""),
    "Entrepreneur",
    "passive_income",
  ];

  for (const subreddit of subreddits) {
    try {
      const subUrl = `https://www.reddit.com/r/${encodeURIComponent(subreddit)}/search.json?q=${encodedQuery}&sort=new&t=week&limit=5&restrict_sr=on`;
      const subData = await fetchRedditJson(subUrl);

      for (const child of subData.data.children) {
        const mapped = mapPostToResult(child.data);
        if (!seenUrls.has(mapped.url)) {
          seenUrls.add(mapped.url);
          results.push(mapped);
        }
      }
    } catch {
      // Subreddit search failed — continue with remaining subreddits
    }
  }

  return results;
}
