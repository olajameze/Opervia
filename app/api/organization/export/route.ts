import { NextResponse } from "next/server";
import { denyUnlessApiPermission, requireApiOrganization } from "@/lib/api-auth";
import { canExportWorkspaceData } from "@/lib/plans";
import { buildWorkspaceExport } from "@/lib/exports/workspace-json";

export async function GET() {
  const ctx = await requireApiOrganization(undefined, { allowInactiveSubscription: true });
  if ("error" in ctx) return ctx.error;

  const forbidden = denyUnlessApiPermission(ctx.session.user.role, "organization.manage");
  if (forbidden) return forbidden;

  if (!canExportWorkspaceData(ctx.organization)) {
    return NextResponse.json(
      { error: "Workspace export is unavailable for this account state." },
      { status: 403 }
    );
  }

  const payload = await buildWorkspaceExport(ctx.organizationId);
  const filename = `opervia-${ctx.organization.slug}-export.json`;

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
