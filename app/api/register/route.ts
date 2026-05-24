import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { normalizeInviteEmail } from "@/lib/invites";
import {
  createEmailVerificationToken,
  sendEmailVerificationEmail,
  sendSignupEmailsForNewUser,
} from "@/lib/registration-emails";
import { isDisposableEmail } from "@/lib/security/disposable-email";
import { HONEYPOT_FIELD } from "@/lib/security/honeypot";
import { guardPublicForm } from "@/lib/security/public-form-guard";
import { passwordSchema } from "@/lib/security/password";
import { ipAndIdentifierRateLimit } from "@/lib/security/rate-limit";
import { isReservedSuperAdminEmail } from "@/lib/super-admin";
import { guardPublicAccessDuringMaintenance } from "@/lib/maintenance";

const registerSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  password: passwordSchema,
  [HONEYPOT_FIELD]: z.string().optional(),
  turnstileToken: z.string().optional(),
});

function genericRegisterResponse(requiresEmailVerification = true) {
  return NextResponse.json({ ok: true, requiresEmailVerification });
}

export async function POST(req: Request) {
  const maintenanceBlocked = await guardPublicAccessDuringMaintenance();
  if (maintenanceBlocked) return maintenanceBlocked;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const blocked = await guardPublicForm({
    req,
    action: "register",
    body: (body ?? {}) as Record<string, unknown>,
    ipLimit: { limit: 10, windowMs: 60 * 60 * 1000 },
  });
  if (blocked) return blocked;

  let parsed: z.infer<typeof registerSchema>;
  try {
    parsed = registerSchema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message ?? "Invalid registration" },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Invalid registration" }, { status: 400 });
  }

  const normalizedEmail = parsed.email.trim().toLowerCase();

  const rateLimited = await ipAndIdentifierRateLimit(req, "register", normalizedEmail, {
    ip: { limit: 10, windowMs: 60 * 60 * 1000 },
    id: { limit: 3, windowMs: 60 * 60 * 1000 },
  });
  if (rateLimited) return rateLimited;

  if (isReservedSuperAdminEmail(normalizedEmail)) {
    return genericRegisterResponse(true);
  }

  if (isDisposableEmail(normalizedEmail)) {
    return NextResponse.json(
      { error: "Please use a permanent work email address." },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    if (!existing.emailVerified && !existing.frozenAt) {
      const token = await createEmailVerificationToken(normalizedEmail);
      await sendEmailVerificationEmail({
        email: normalizedEmail,
        name: existing.name ?? parsed.name,
        token,
      });
    }
    return genericRegisterResponse(true);
  }

  const pendingInvite = await prisma.teamInvite.findFirst({
    where: {
      email: normalizeInviteEmail(normalizedEmail),
      acceptedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  const passwordHash = await bcrypt.hash(parsed.password, 12);
  const user = await prisma.user.create({
    data: {
      name: parsed.name,
      email: normalizedEmail,
      passwordHash,
      ...(pendingInvite ? { emailVerified: new Date() } : {}),
    },
  });

  const emailResults = await sendSignupEmailsForNewUser({
    userId: user.id,
    email: normalizedEmail,
    name: parsed.name,
    skipVerification: Boolean(pendingInvite),
  });

  if (!pendingInvite && emailResults.verification && !emailResults.verification.ok) {
    return NextResponse.json(
      {
        error:
          "Account created but verification email could not be sent. Try again later or contact support.",
      },
      { status: 503 }
    );
  }

  return genericRegisterResponse(!pendingInvite);
}
