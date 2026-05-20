import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { evaluateWorkflowRules } from "@/lib/workflows";

export async function POST() {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await evaluateWorkflowRules(session.user.organizationId);
  return NextResponse.json({ success: true });
}
