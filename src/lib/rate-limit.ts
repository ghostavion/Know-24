/**
 * Simple in-memory sliding window rate limiter.
 * Works well for single-instance Vercel deployments.
 * For multi-instance production, swap to Upstash or database-backed.
 */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

const LIMITS: Record<string, { requests: number; windowMs: number }> = {
  api: { requests: 60, windowMs: 60_000 },
  auth: { requests: 10, windowMs: 60_000 },
  ai: { requests: 20, windowMs: 60_000 },
  webhook: { requests: 100, windowMs: 60_000 },
  storefront: { requests: 120, windowMs: 60_000 },
};

// Clean up stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    entry.timestamps = entry.timestamps.filter((t) => now - t < 120_000);
    if (entry.timestamps.length === 0) store.delete(key);
  }
}, 300_000);

type RateLimiterType = keyof typeof LIMITS;

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

export async function checkRateLimit(
  identifier: string,
  type: RateLimiterType = "api"
): Promise<RateLimitResult> {
  const config = LIMITS[type] ?? LIMITS.api;
  const key = `${type}:${identifier}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => t > windowStart);

  const remaining = Math.max(0, config.requests - entry.timestamps.length);
  const success = entry.timestamps.length < config.requests;

  if (success) {
    entry.timestamps.push(now);
  }

  return {
    success,
    limit: config.requests,
    remaining: success ? remaining - 1 : 0,
    reset: now + config.windowMs,
  };
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": result.reset.toString(),
  };
}
