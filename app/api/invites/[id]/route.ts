import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiOrganization } from "@/lib/api-auth";
import { canManageTeamInvites } from "@/lib/roles";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const ctx = await requireApiOrganization();
  if ("error" in ctx) return ctx.error;

  if (!canManageTeamInvites(ctx.session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const invite = await prisma.teamInvite.findFirst({
    where: { id: params.id, organizationId: ctx.organizationId, acceptedAt: null },
  });

  if (!invite) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  await prisma.teamInvite.delete({ where: { id: invite.id } });
  return NextResponse.json({ ok: true });
}
