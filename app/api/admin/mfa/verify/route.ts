import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSuperAdminApi } from "@/lib/super-admin";
import { verifyTotpCode } from "@/lib/mfa/totp";
import { setSuperAdminMfaCookie } from "@/lib/mfa/super-admin-mfa-cookie";
import { ipRateLimit } from "@/lib/security/rate-limit";

const schema = z.object({
  code: z.string().min(6).max(8),
});

export async function POST(req: Request) {
  const limited = await ipRateLimit(req, "mfa-verify", 10, 15 * 60 * 1000);
  if (limited) return limited;

  const ctx = await requireSuperAdminApi({ skipMfa: true });
  if ("error" in ctx) return ctx.error;

  let code: string;
  try {
    code = schema.parse(await req.json()).code;
  } catch {
    return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: ctx.userId },
    select: { totpSecret: true, totpEnabledAt: true },
  });

  if (!user?.totpEnabledAt || !user.totpSecret) {
    return NextResponse.json({ error: "MFA is not enabled" }, { status: 400 });
  }

  if (!verifyTotpCode(user.totpSecret, code)) {
    return NextResponse.json({ error: "Invalid verification code" }, { status: 401 });
  }

  const cookieSet = await setSuperAdminMfaCookie(ctx.userId);
  if (!cookieSet) {
    return NextResponse.json(
      { error: "Could not establish MFA session. Check AUTH_SECRET." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
