import { NextResponse } from "next/server";
import { getClientIp } from "@/lib/security/client-ip";
import {
  checkRateLimit,
  resetRateLimits,
  type RateLimitResult,
} from "@/lib/security/rate-limit-memory";

export { checkRateLimit, resetRateLimits, type RateLimitResult };

export function rateLimitResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSeconds) },
    }
  );
}

export async function enforceRateLimits(
  req: Request,
  checks: Array<{ key: string; limit: number; windowMs: number }>
): Promise<NextResponse | null> {
  const { checkRateLimitDistributed } = await import("@/lib/security/rate-limit-upstash");

  for (const check of checks) {
    const result = await checkRateLimitDistributed(check.key, check.limit, check.windowMs);
    if (!result.ok) {
      return rateLimitResponse(result.retryAfterSeconds);
    }
  }

  return null;
}

export async function ipRateLimit(
  req: Request,
  action: string,
  limit: number,
  windowMs: number
) {
  const ip = getClientIp(req);
  return enforceRateLimits(req, [{ key: `${action}:ip:${ip}`, limit, windowMs }]);
}

export async function ipAndIdentifierRateLimit(
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
