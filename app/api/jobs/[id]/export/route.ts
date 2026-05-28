import { NextResponse } from "next/server";
import { requireApiOrganization } from "@/lib/api-auth";
import { buildJobSummaryCsv, buildJobSummaryPdf } from "@/lib/exports/job-summary";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const ctx = await requireApiOrganization("scheduling");
  if ("error" in ctx) return ctx.error;

  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") ?? "csv";

  try {
    if (format === "pdf") {
      const pdf = await buildJobSummaryPdf(params.id, ctx.organizationId);
      return new NextResponse(Buffer.from(pdf), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="opervia-job-${params.id}.pdf"`,
        },
      });
    }

    const csv = await buildJobSummaryCsv(params.id, ctx.organizationId);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="opervia-job-${params.id}.csv"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Export failed" }, { status: 404 });
  }
}
