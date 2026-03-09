import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// Create a rate limiter backed by Upstash Redis
// Uses sliding window algorithm
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Different rate limiters for different use cases
export const rateLimiters = {
  // General API: 60 requests per minute
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, "1 m"),
    analytics: true,
    prefix: "ratelimit:api",
  }),

  // Auth-sensitive: 10 requests per minute
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "1 m"),
    analytics: true,
    prefix: "ratelimit:auth",
  }),

  // AI endpoints: 20 requests per minute
  ai: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, "1 m"),
    analytics: true,
    prefix: "ratelimit:ai",
  }),

  // Webhook: 100 requests per minute
  webhook: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, "1 m"),
    analytics: true,
    prefix: "ratelimit:webhook",
  }),

  // Public storefront: 120 requests per minute
  storefront: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(120, "1 m"),
    analytics: true,
    prefix: "ratelimit:storefront",
  }),
}

type RateLimiterType = keyof typeof rateLimiters

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

// Check rate limit for a given identifier
export async function checkRateLimit(
  identifier: string,
  type: RateLimiterType = "api"
): Promise<RateLimitResult> {
  const limiter = rateLimiters[type]
  const result = await limiter.limit(identifier)
  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  }
}

// Helper to get rate limit headers for response
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": result.reset.toString(),
  }
}
