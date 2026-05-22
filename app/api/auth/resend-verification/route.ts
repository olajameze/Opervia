import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  createEmailVerificationToken,
  sendEmailVerificationEmail,
} from "@/lib/registration-emails";
import { BRAND } from "@/lib/branding";
import { getAppUrl } from "@/lib/app-url";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  let email: string;
  try {
    email = schema.parse(await req.json()).email.toLowerCase();
  } catch {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

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
