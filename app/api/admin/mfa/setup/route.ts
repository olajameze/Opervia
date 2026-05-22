import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSuperAdminApi } from "@/lib/super-admin";
import {
  buildTotpQrDataUrl,
  generateTotpSecret,
  mfaSetupIdentifier,
  verifyTotpCode,
} from "@/lib/mfa/totp";

const MFA_SETUP_TTL_MS = 15 * 60 * 1000;

export async function GET() {
  const ctx = await requireSuperAdminApi({ skipMfa: true });
  if ("error" in ctx) return ctx.error;

  const user = await prisma.user.findUnique({
    where: { id: ctx.userId },
    select: { email: true, totpEnabledAt: true },
  });

  if (!user?.email) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (user.totpEnabledAt) {
    return NextResponse.json({ enabled: true });
  }

  const secret = generateTotpSecret();
  const expires = new Date(Date.now() + MFA_SETUP_TTL_MS);
  const identifier = mfaSetupIdentifier(ctx.userId);

  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.verificationToken.create({
    data: { identifier, token: secret, expires },
  });

  const qrDataUrl = await buildTotpQrDataUrl(user.email, secret);

  return NextResponse.json({
    enabled: false,
    qrDataUrl,
    manualEntryKey: secret,
  });
}

const enableSchema = z.object({
  code: z.string().min(6).max(8),
});

export async function POST(req: Request) {
  const ctx = await requireSuperAdminApi({ skipMfa: true });
  if ("error" in ctx) return ctx.error;

  let code: string;
  try {
    code = enableSchema.parse(await req.json()).code;
  } catch {
    return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
  }

  const identifier = mfaSetupIdentifier(ctx.userId);
  const pending = await prisma.verificationToken.findFirst({
    where: { identifier, expires: { gt: new Date() } },
  });

  if (!pending) {
    return NextResponse.json(
      { error: "MFA setup expired. Start again from security settings." },
      { status: 400 }
    );
  }

  if (!verifyTotpCode(pending.token, code)) {
    return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: ctx.userId },
      data: {
        totpSecret: pending.token,
        totpEnabledAt: new Date(),
      },
    }),
    prisma.verificationToken.deleteMany({ where: { identifier } }),
  ]);

  return NextResponse.json({ ok: true, enabled: true });
}
