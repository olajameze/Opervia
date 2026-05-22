import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { OnboardingForm } from "@/components/auth/OnboardingForm";
import { createMetadata } from "@/lib/seo";
import { BRAND } from "@/lib/branding";

export const metadata = createMetadata({
  title: `Set Up ${BRAND.name}`,
  path: "/onboarding",
  noIndex: true,
});

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  if (session.user.organizationId) redirect("/dashboard");

  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (membership) redirect("/dashboard");

  return <OnboardingForm />;
}
