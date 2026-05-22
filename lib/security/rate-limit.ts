import { NextResponse } from "next/server";
import { getClientIp } from "@/lib/security/client-ip";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupExpiredBuckets(now: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, bucket] of Array.from(buckets.entries())) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSeconds: number };

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  cleanupExpiredBuckets(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (bucket.count >= limit) {
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  return { ok: true };
}

/** Reset in-memory buckets — for tests only. */
export function resetRateLimits() {
  buckets.clear();
  lastCleanup = Date.now();
}

export function rateLimitResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSeconds) },
    }
  );
}

export function enforceRateLimits(
  req: Request,
  checks: Array<{ key: string; limit: number; windowMs: number }>
): NextResponse | null {
  for (const check of checks) {
    const result = checkRateLimit(check.key, check.limit, check.windowMs);
    if (!result.ok) {
      return rateLimitResponse(result.retryAfterSeconds);
    }
  }

  return null;
}

export function ipRateLimit(req: Request, action: string, limit: number, windowMs: number) {
  const ip = getClientIp(req);
  return enforceRateLimits(req, [{ key: `${action}:ip:${ip}`, limit, windowMs }]);
}

export function ipAndIdentifierRateLimit(
  req: Request,
  action: string,
  identifier: string,
  limits: { ip: { limit: number; windowMs: number }; id: { limit: number; windowMs: number } }
) {
  const ip = getClientIp(req);
  const normalizedId = identifier.trim().toLowerCase();

  return enforceRateLimits(req, [
    { key: `${action}:ip:${ip}`, ...limits.ip },
    { key: `${action}:id:${normalizedId}`, ...limits.id },
  ]);
}
