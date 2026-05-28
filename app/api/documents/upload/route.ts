import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { denyUnlessApiPermission, requireApiOrganization } from "@/lib/api-auth";

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(req: Request) {
  const ctx = await requireApiOrganization("workforce");
  if ("error" in ctx) return ctx.error;

  const forbidden = denyUnlessApiPermission(ctx.session.user.role, "workforce.write");
  if (forbidden) return forbidden;

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Document uploads are not configured. Set BLOB_READ_WRITE_TOKEN." },
      { status: 503 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const label = String(formData.get("label") ?? "Document");
    const staffProfileId = formData.get("staffProfileId");
    const freelancerProfileId = formData.get("freelancerProfileId");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File exceeds 10MB limit" }, { status: 400 });
    }
    if (!staffProfileId && !freelancerProfileId) {
      return NextResponse.json({ error: "Staff or freelancer ID required" }, { status: 400 });
    }

    if (staffProfileId) {
      const staff = await prisma.staffProfile.findFirst({
        where: { id: String(staffProfileId), organizationId: ctx.organizationId },
      });
      if (!staff) return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }
    if (freelancerProfileId) {
      const freelancer = await prisma.freelancerProfile.findFirst({
        where: { id: String(freelancerProfileId), organizationId: ctx.organizationId },
      });
      if (!freelancer) return NextResponse.json({ error: "Freelancer not found" }, { status: 404 });
    }

    const blob = await put(`workforce/${ctx.organizationId}/${Date.now()}-${file.name}`, file, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    const document = await prisma.workforceDocument.create({
      data: {
        label,
        fileName: file.name,
        mimeType: file.type,
        blobUrl: blob.url,
        sizeBytes: file.size,
        organizationId: ctx.organizationId,
        staffProfileId: staffProfileId ? String(staffProfileId) : null,
        freelancerProfileId: freelancerProfileId ? String(freelancerProfileId) : null,
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 400 });
  }
}
