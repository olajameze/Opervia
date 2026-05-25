import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { isSuperAdminUser } from "@/lib/super-admin";
import { OnboardingForm } from "@/components/auth/OnboardingForm";
import { CompleteSubscriptionForm } from "@/components/auth/CompleteSubscriptionForm";
import { createMetadata } from "@/lib/seo";
import { BRAND } from "@/lib/branding";

export const metadata = createMetadata({
  title: `Set Up ${BRAND.name}`,
  path: "/onboarding",
  noIndex: true,
});

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: { canceled?: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  if (await isSuperAdminUser(session.user.id)) redirect("/super-admin");

  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id },
    include: {
      organization: {
        select: { id: true, name: true, stripeSubscriptionId: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  if (membership?.organization?.stripeSubscriptionId) {
    redirect("/dashboard");
  }

  if (membership?.organization) {
    return (
      <CompleteSubscriptionForm
        organizationName={membership.organization.name}
        canceled={searchParams.canceled === "true"}
      />
    );
  }

  if (session.user.organizationId) {
    const organization = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      select: { id: true, name: true, stripeSubscriptionId: true },
    });

    if (organization?.stripeSubscriptionId) {
      redirect("/dashboard");
    }

    if (organization) {
      return (
        <CompleteSubscriptionForm
          organizationName={organization.name}
          canceled={searchParams.canceled === "true"}
        />
      );
    }
  }

  return <OnboardingForm />;
}
