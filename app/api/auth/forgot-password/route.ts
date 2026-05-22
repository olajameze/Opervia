import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { sendEmail, requireEmailForTransactional } from "@/lib/email";
import { BRAND } from "@/lib/branding";

const schema = z.object({
  email: z.string().email(),
});

const TOKEN_TTL_MS = 60 * 60 * 1000;

export async function POST(req: Request) {
  let email: string;
  try {
    const body = schema.parse(await req.json());
    email = body.email.toLowerCase();
  } catch {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (user && !user.frozenAt) {
    const emailBlocked = requireEmailForTransactional("Password reset email");
    if (emailBlocked && !emailBlocked.ok) {
      console.error(`[${BRAND.name}] Password reset email not sent — ${emailBlocked.error}`);
      return NextResponse.json(
        { error: "Email service is temporarily unavailable. Contact support." },
        { status: 503 }
      );
    }

    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + TOKEN_TTL_MS);

    await prisma.verificationToken.deleteMany({
      where: { identifier: `password-reset:${email}` },
    });

    await prisma.verificationToken.create({
      data: {
        identifier: `password-reset:${email}`,
        token,
        expires,
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    const result = await sendEmail({
      to: email,
      subject: `Reset your ${BRAND.name} password`,
      text: `Reset your password: ${resetUrl}\n\nThis link expires in 1 hour.`,
      html: `<p>Reset your ${BRAND.name} password:</p><p><a href="${resetUrl}">Set a new password</a></p><p style="color:#64748b;font-size:13px;">This link expires in 1 hour.</p>`,
      idempotencyKey: `password-reset/${email}/${token.slice(0, 8)}`,
    });

    if (!result.ok) {
      console.error(`[${BRAND.name}] Password reset email failed for ${email}: ${result.error}`);
      return NextResponse.json(
        { error: "Email service is temporarily unavailable. Contact support." },
        { status: 503 }
      );
    }

    if (result.dev) {
      console.log(`[${BRAND.name}] Password reset link for ${email}: ${resetUrl}`);
    }
  }

  return NextResponse.json({ ok: true });
}
