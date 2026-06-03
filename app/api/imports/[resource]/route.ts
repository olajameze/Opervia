import { NextResponse } from "next/server";
import { denyUnlessApiPermission, requireApiOrganization } from "@/lib/api-auth";
import { assertFreelancerCapacity, assertStaffCapacity } from "@/lib/api-auth";
import {
  IMPORT_RESOURCES,
  importCsvResource,
  importSpreadsheetResource,
  type ImportResource,
} from "@/lib/imports/csv-import";
import { hasActiveSubscription } from "@/lib/plans";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

export async function POST(
  req: Request,
  { params }: { params: { resource: string } }
) {
  const resource = params.resource as ImportResource;
  if (!IMPORT_RESOURCES.includes(resource)) {
    return NextResponse.json({ error: "Unknown import resource" }, { status: 400 });
  }

  const ctx = await requireApiOrganization("dashboard");
  if ("error" in ctx) return ctx.error;

  if (!hasActiveSubscription(ctx.organization)) {
    return NextResponse.json({ error: "Active subscription required" }, { status: 403 });
  }

  const forbidden = denyUnlessApiPermission(ctx.session.user.role, "organization.manage");
  if (forbidden) {
    const modulePermission =
      resource === "staff" || resource === "freelancers"
        ? "workforce.write"
        : resource === "equipment"
          ? "rentals.write"
          : "scheduling.write";
    const altForbidden = denyUnlessApiPermission(ctx.session.user.role, modulePermission);
    if (altForbidden) return altForbidden;
  }

  if (resource === "staff") {
    const limitError = await assertStaffCapacity(ctx.organizationId);
    if (limitError) return limitError;
  }
  if (resource === "freelancers") {
    const limitError = await assertFreelancerCapacity(ctx.organizationId);
    if (limitError) return limitError;
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Spreadsheet file is required" }, { status: 400 });
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: "File must be 5MB or smaller" }, { status: 400 });
    }

    const name = file.name.toLowerCase();
    const isExcel = name.endsWith(".xlsx") || name.endsWith(".xls");
    const isCsv = name.endsWith(".csv") || file.type.includes("csv") || file.type === "text/plain";

    if (!isExcel && !isCsv) {
      return NextResponse.json(
        { error: "Upload a .csv, .xlsx, or .xls file" },
        { status: 400 }
      );
    }

    let summary;
    if (isExcel) {
      const buffer = await file.arrayBuffer();
      summary = await importSpreadsheetResource(
        resource,
        buffer,
        file.name,
        ctx.organizationId
      );
    } else {
      const csvText = await file.text();
      summary = await importCsvResource(resource, csvText, ctx.organizationId);
    }

    return NextResponse.json(summary);
  } catch {
    return NextResponse.json({ error: "Import failed" }, { status: 400 });
  }
}
