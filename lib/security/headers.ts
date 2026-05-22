import { SECURITY_HEADERS as SECURITY_HEADERS_VALUE } from "./security-headers.mjs";

/** Security headers applied via Next.js config and middleware. */
export const SECURITY_HEADERS: Record<string, string> = SECURITY_HEADERS_VALUE;

export function applySecurityHeaders(headers: Headers) {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(key, value);
  }
}
