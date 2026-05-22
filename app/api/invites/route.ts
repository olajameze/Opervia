import { NextResponse } from "next/server";
import { z } from "zod";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireApiOrganization, assertMembershipCapacity } from "@/lib/api-auth";
import { canManageTeamInvites, INVITABLE_ROLES } from "@/lib/roles";
import {
  createTeamInvite,
  normalizeInviteEmail,
  sendTeamInviteEmail,
  isInvitableRole,
} from "@/lib/invites";

const createSchema = z.object({
  email: z.string().email(),
  role: z.enum(INVITABLE_ROLES as [Role, ...Role[]]),
});

export async function GET() {
  const ctx = await requireApiOrganization();
  if ("error" in ctx) return ctx.error;

  if (!canManageTeamInvites(ctx.session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const invites = await prisma.teamInvite.findMany({
    where: {
      organizationId: ctx.organizationId,
      acceptedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      role: true,
      expiresAt: true,
      createdAt: true,
      invitedBy: { select: { name: true, email: true } },
    },
  });

  return NextResponse.json({ invites });
}

export async function POST(req: Request) {
  const ctx = await requireApiOrganization();
  if ("error" in ctx) return ctx.error;

  if (!canManageTeamInvites(ctx.session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: z.infer<typeof createSchema>;
  try {
    body = createSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid invite payload" }, { status: 400 });
  }

  if (!isInvitableRole(body.role)) {
    return NextResponse.json({ error: "Invalid role for invite" }, { status: 400 });
  }

  const email = normalizeInviteEmail(body.email);

  const existingMember = await prisma.membership.findFirst({
    where: {
      organizationId: ctx.organizationId,
      user: { email },
    },
  });
  if (existingMember) {
    return NextResponse.json({ error: "This person is already on your team" }, { status: 409 });
  }

  const capacityError = await assertMembershipCapacity(ctx.organizationId);
  if (capacityError) return capacityError;

  const inviter = await prisma.user.findUnique({
    where: { id: ctx.session.user.id },
    select: { name: true, email: true },
  });

  const invite = await createTeamInvite({
    email,
    role: body.role,
    organizationId: ctx.organizationId,
    invitedById: ctx.session.user.id,
  });

  const emailResult = await sendTeamInviteEmail({
    email,
    token: invite.token,
    organizationName: ctx.organization.name,
    role: body.role,
    inviterName: inviter?.name ?? null,
  });

  if (!emailResult.ok) {
    await prisma.teamInvite.delete({ where: { id: invite.id } });
    return NextResponse.json(
      { error: emailResult.error ?? "Failed to send invite email" },
      { status: 503 }
    );
  }

  return NextResponse.json({
    invite: {
      id: invite.id,
      email: invite.email,
      role: invite.role,
      expiresAt: invite.expiresAt,
    },
    emailSent: !emailResult.dev,
  });
}
