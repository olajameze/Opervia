import { randomBytes } from "crypto";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { BRAND } from "@/lib/branding";
import { INVITABLE_ROLES } from "@/lib/roles";

export const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function isInvitableRole(role: Role): boolean {
  return INVITABLE_ROLES.includes(role);
}

export function normalizeInviteEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function findValidInviteByToken(token: string) {
  return prisma.teamInvite.findFirst({
    where: {
      token,
      acceptedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: {
      organization: { select: { id: true, name: true } },
      invitedBy: { select: { name: true, email: true } },
    },
  });
}

export async function sendTeamInviteEmail({
  email,
  token,
  organizationName,
  role,
  inviterName,
}: {
  email: string;
  token: string;
  organizationName: string;
  role: Role;
  inviterName: string | null;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const inviteUrl = `${appUrl}/invite?token=${token}`;
  const roleLabel = role.replace(/_/g, " ").toLowerCase();

  const text = [
    `${inviterName ?? "A teammate"} invited you to join ${organizationName} on ${BRAND.name}.`,
    ``,
    `Role: ${roleLabel}`,
    `Accept your invite: ${inviteUrl}`,
    ``,
    `This link expires in 7 days.`,
  ].join("\n");

  const html = `
    <p>${inviterName ?? "A teammate"} invited you to join <strong>${organizationName}</strong> on ${BRAND.name}.</p>
    <p>Role: <strong>${roleLabel}</strong></p>
    <p><a href="${inviteUrl}">Accept invite</a></p>
    <p style="color:#64748b;font-size:13px;">This link expires in 7 days.</p>
  `;

  return sendEmail({
    to: email,
    subject: `You're invited to ${organizationName} on ${BRAND.name}`,
    text,
    html,
    idempotencyKey: `team-invite/${token}`,
  });
}

export async function createTeamInvite({
  email,
  role,
  organizationId,
  invitedById,
}: {
  email: string;
  role: Role;
  organizationId: string;
  invitedById: string;
}) {
  const normalizedEmail = normalizeInviteEmail(email);
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS);

  await prisma.teamInvite.deleteMany({
    where: {
      organizationId,
      email: normalizedEmail,
      acceptedAt: null,
    },
  });

  return prisma.teamInvite.create({
    data: {
      email: normalizedEmail,
      role,
      token,
      expiresAt,
      organizationId,
      invitedById,
    },
  });
}
