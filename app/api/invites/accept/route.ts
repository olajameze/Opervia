import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { assertMembershipCapacity } from "@/lib/api-auth";
import { findValidInviteByToken, normalizeInviteEmail } from "@/lib/invites";

const schema = z.object({
  token: z.string().min(1),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Sign in to accept this invite" }, { status: 401 });
  }

  let token: string;
  try {
    token = schema.parse(await req.json()).token;
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  const invite = await findValidInviteByToken(token);
  if (!invite) {
    return NextResponse.json({ error: "Invite expired or not found" }, { status: 404 });
  }

  const userEmail = normalizeInviteEmail(session.user.email);
  if (userEmail !== invite.email) {
    return NextResponse.json(
      {
        error: `Sign in as ${invite.email} to accept this invite`,
      },
      { status: 403 }
    );
  }

  const existingMembership = await prisma.membership.findUnique({
    where: {
      userId_organizationId: {
        userId: session.user.id,
        organizationId: invite.organizationId,
      },
    },
  });

  if (existingMembership) {
    await prisma.teamInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    });
    return NextResponse.json({
      ok: true,
      organizationId: invite.organizationId,
      alreadyMember: true,
    });
  }

  const capacityError = await assertMembershipCapacity(invite.organizationId);
  if (capacityError) return capacityError;

  await prisma.$transaction([
    prisma.membership.create({
      data: {
        userId: session.user.id,
        organizationId: invite.organizationId,
        role: invite.role,
      },
    }),
    prisma.teamInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    }),
    prisma.teamInvite.deleteMany({
      where: {
        organizationId: invite.organizationId,
        email: invite.email,
        id: { not: invite.id },
        acceptedAt: null,
      },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    organizationId: invite.organizationId,
    organizationName: invite.organization.name,
    role: invite.role,
  });
}
