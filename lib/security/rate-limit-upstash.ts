import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import {
  checkRateLimit as checkMemoryRateLimit,
  type RateLimitResult,
} from "@/lib/security/rate-limit-memory";

let ratelimitCache: Map<string, Ratelimit> | null = null;

function getUpstashRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  return new Redis({ url, token });
}

function getDistributedLimiter(limit: number, windowMs: number): Ratelimit | null {
  const redis = getUpstashRedis();
  if (!redis) return null;

  const windowSeconds = Math.max(1, Math.ceil(windowMs / 1000));
  const cacheKey = `${limit}:${windowSeconds}`;

  if (!ratelimitCache) ratelimitCache = new Map();
  const cached = ratelimitCache.get(cacheKey);
  if (cached) return cached;

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
    prefix: "opervia:rl",
  });
  ratelimitCache.set(cacheKey, limiter);
  return limiter;
}

export async function checkRateLimitDistributed(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const limiter = getDistributedLimiter(limit, windowMs);
  if (!limiter) {
    return checkMemoryRateLimit(key, limit, windowMs);
  }

  const result = await limiter.limit(key);
  if (result.success) return { ok: true };

  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((result.reset - Date.now()) / 1000)
  );
  return { ok: false, retryAfterSeconds };
}

export function isDistributedRateLimitEnabled() {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL?.trim() &&
      process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  );
}
