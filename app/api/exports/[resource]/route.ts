import { NextResponse } from "next/server";
import { requireApiOrganization } from "@/lib/api-auth";
import { canExportData } from "@/lib/entitlements";
import {
  buildExportCsv,
  exportFilename,
  EXPORT_RESOURCES,
  type ExportResource,
} from "@/lib/exports/csv";

export async function GET(
  _req: Request,
  { params }: { params: { resource: string } }
) {
  const ctx = await requireApiOrganization();
  if ("error" in ctx) return ctx.error;

  if (!canExportData(ctx.organization)) {
    return NextResponse.json(
      { error: "Bulk data export requires an active Enterprise plan." },
      { status: 403 }
    );
  }

  const resource = params.resource as ExportResource;
  if (!EXPORT_RESOURCES.includes(resource)) {
    return NextResponse.json({ error: "Unknown export resource" }, { status: 404 });
  }

  const csv = await buildExportCsv(resource, ctx.organizationId);
  const filename = exportFilename(resource, ctx.organization.slug);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
