import { getClientIp } from "@/lib/security/client-ip";

export function isTurnstileConfigured() {
  return Boolean(process.env.TURNSTILE_SECRET_KEY?.trim());
}

export async function verifyTurnstileToken(
  token: string | undefined | null,
  req: Request
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) return true;

  if (!token?.trim()) return false;

  const body = new URLSearchParams({
    secret,
    response: token.trim(),
    remoteip: getClientIp(req),
  });

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) return false;

  const data = (await response.json()) as { success?: boolean };
  return Boolean(data.success);
}
