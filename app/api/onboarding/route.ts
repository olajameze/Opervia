import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createOrganization } from "@/lib/services/organization";
import { z } from "zod";

const onboardingSchema = z.object({
  organizationName: z.string().min(2),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { organizationName } = onboardingSchema.parse(body);

    const organization = await createOrganization(session.user.id, organizationName);

    return NextResponse.json({ organizationId: organization.id, slug: organization.slug });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Onboarding failed" }, { status: 500 });
  }
}
