import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
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

    console.log(`[${BRAND.name}] Password reset link for ${email}: ${resetUrl}`);
  }

  return NextResponse.json({ ok: true });
}
