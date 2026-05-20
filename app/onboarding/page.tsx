import { OnboardingForm } from "@/components/auth/OnboardingForm";
import { createMetadata } from "@/lib/seo";
import { BRAND } from "@/lib/branding";

export const metadata = createMetadata({
  title: `Set Up ${BRAND.name}`,
  path: "/onboarding",
  noIndex: true,
});

export default function OnboardingPage() {
  return <OnboardingForm />;
}
