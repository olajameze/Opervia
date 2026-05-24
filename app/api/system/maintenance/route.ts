import { NextResponse } from "next/server";
import { getMaintenanceState } from "@/lib/maintenance";

export const dynamic = "force-dynamic";

/** Public read-only maintenance flag for edge middleware (no auth required). */
export async function GET() {
  const state = await getMaintenanceState();
  return NextResponse.json(
    { maintenanceMode: state.enabled },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
