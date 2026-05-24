import { NextResponse } from "next/server";
import { HONEYPOT_FIELD, isHoneypotTriggered } from "@/lib/security/honeypot";
import { ipRateLimit } from "@/lib/security/rate-limit";
import { verifyTurnstileToken } from "@/lib/security/turnstile";

type PublicFormGuardInput = {
  req: Request;
  action: string;
  body: Record<string, unknown>;
  ipLimit?: { limit: number; windowMs: number };
};

/** Reject bots, rate-limited clients, and failed Turnstile checks on public forms. */
export async function guardPublicForm(input: PublicFormGuardInput): Promise<NextResponse | null> {
  const ipLimit = input.ipLimit ?? { limit: 20, windowMs: 60 * 60 * 1000 };

  const rateLimited = await ipRateLimit(input.req, input.action, ipLimit.limit, ipLimit.windowMs);
  if (rateLimited) return rateLimited;

  if (isHoneypotTriggered(input.body[HONEYPOT_FIELD])) {
    return NextResponse.json({ ok: true });
  }

  const turnstileOk = await verifyTurnstileToken(
    typeof input.body.turnstileToken === "string" ? input.body.turnstileToken : undefined,
    input.req
  );

  if (!turnstileOk) {
    return NextResponse.json(
      { error: "Security verification failed. Please try again." },
      { status: 403 }
    );
  }

  return null;
}
