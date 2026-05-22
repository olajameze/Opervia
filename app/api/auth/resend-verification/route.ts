import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  createEmailVerificationToken,
  sendEmailVerificationEmail,
} from "@/lib/registration-emails";
import { BRAND } from "@/lib/branding";
import { getAppUrl } from "@/lib/app-url";
import { HONEYPOT_FIELD } from "@/lib/security/honeypot";
import { guardPublicForm } from "@/lib/security/public-form-guard";
import { ipAndIdentifierRateLimit } from "@/lib/security/rate-limit";

const schema = z.object({
  email: z.string().email(),
  [HONEYPOT_FIELD]: z.string().optional(),
  turnstileToken: z.string().optional(),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const blocked = await guardPublicForm({
    req,
    action: "resend-verification",
    body: (body ?? {}) as Record<string, unknown>,
    ipLimit: { limit: 10, windowMs: 60 * 60 * 1000 },
  });
  if (blocked) return blocked;

  let email: string;
  try {
    email = schema.parse(body).email.toLowerCase();
  } catch {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const rateLimited = ipAndIdentifierRateLimit(req, "resend-verification", email, {
    ip: { limit: 10, windowMs: 60 * 60 * 1000 },
    id: { limit: 3, windowMs: 60 * 60 * 1000 },
  });
  if (rateLimited) return rateLimited;

  const user = await prisma.user.findUnique({ where: { email } });

  if (user && !user.emailVerified && !user.frozenAt) {
    const token = await createEmailVerificationToken(email);
    const result = await sendEmailVerificationEmail({
      email,
      name: user.name ?? email,
      token,
    });

    if (!result.ok) {
      console.error(
        `[${BRAND.name}] Resend verification failed for ${email}: ${result.error}`
      );
      return NextResponse.json(
        { error: "Email service is temporarily unavailable. Try again later." },
        { status: 503 }
      );
    }

    if (result.dev) {
      console.log(
        `[${BRAND.name}] Email verification link for ${email}: ${getAppUrl()}/verify-email?token=${token}`
      );
    }
  }

  return NextResponse.json({ ok: true });
}
