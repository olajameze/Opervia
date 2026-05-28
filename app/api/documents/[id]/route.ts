import { NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { prisma } from "@/lib/db";
import { denyUnlessApiPermission, requireApiOrganization } from "@/lib/api-auth";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const ctx = await requireApiOrganization("workforce");
  if ("error" in ctx) return ctx.error;

  const forbidden = denyUnlessApiPermission(ctx.session.user.role, "workforce.write");
  if (forbidden) return forbidden;

  const document = await prisma.workforceDocument.findFirst({
    where: { id: params.id, organizationId: ctx.organizationId },
  });
  if (!document) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      await del(document.blobUrl, { token: process.env.BLOB_READ_WRITE_TOKEN });
    } catch {
      // Blob may already be removed
    }
  }

  await prisma.workforceDocument.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
