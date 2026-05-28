import { NextResponse } from "next/server";
import { denyUnlessApiPermission, requireApiOrganization } from "@/lib/api-auth";
import { assertFreelancerCapacity, assertStaffCapacity } from "@/lib/api-auth";
import {
  IMPORT_RESOURCES,
  importCsvResource,
  type ImportResource,
} from "@/lib/imports/csv-import";
import { hasActiveSubscription } from "@/lib/plans";

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
      return NextResponse.json({ error: "CSV file is required" }, { status: 400 });
    }
    const csvText = await file.text();
    const summary = await importCsvResource(resource, csvText, ctx.organizationId);
    return NextResponse.json(summary);
  } catch {
    return NextResponse.json({ error: "Import failed" }, { status: 400 });
  }
}
