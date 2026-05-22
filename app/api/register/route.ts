import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { normalizeInviteEmail } from "@/lib/invites";
import { sendSignupEmailsForNewUser } from "@/lib/registration-emails";

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password } = registerSchema.parse(body);
    const normalizedEmail = email.trim().toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }

    const pendingInvite = await prisma.teamInvite.findFirst({
      where: {
        email: normalizeInviteEmail(normalizedEmail),
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        passwordHash,
        ...(pendingInvite ? { emailVerified: new Date() } : {}),
      },
    });

    await sendSignupEmailsForNewUser({
      userId: user.id,
      email: normalizedEmail,
      name,
      skipVerification: Boolean(pendingInvite),
    });

    return NextResponse.json({
      id: user.id,
      email: user.email,
      requiresEmailVerification: !pendingInvite,
      emailVerified: Boolean(pendingInvite),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
