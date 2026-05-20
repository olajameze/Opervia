import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperAdminApi } from "@/lib/super-admin";
import { setMaintenanceMode } from "@/lib/system-settings";

const schema = z.object({
  maintenanceMode: z.boolean(),
  maintenanceMessage: z.string().nullable().optional(),
});

export async function GET() {
  const ctx = await requireSuperAdminApi();
  if ("error" in ctx) return ctx.error;

  const { getSystemSettings } = await import("@/lib/system-settings");
  const settings = await getSystemSettings();
  return NextResponse.json(settings);
}

export async function PATCH(req: Request) {
  const ctx = await requireSuperAdminApi();
  if ("error" in ctx) return ctx.error;

  try {
    const body = schema.parse(await req.json());
    const settings = await setMaintenanceMode(
      body.maintenanceMode,
      body.maintenanceMessage ?? undefined
    );
    return NextResponse.json(settings);
  } catch {
    return NextResponse.json({ error: "Invalid settings" }, { status: 400 });
  }
}
