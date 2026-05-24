import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { BRAND } from "@/lib/branding";
import {
  LEGAL,
  LEGAL_DISCLAIMER,
  PRIVACY_SECTIONS,
} from "@/lib/legal";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Privacy Policy",
  description: `Privacy Policy for ${BRAND.name} — GDPR, data collection, subprocessors, retention, and your rights.`,
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <LegalDocument
        title="Privacy Policy"
        lastUpdated={LEGAL.lastUpdated}
        disclaimer={LEGAL_DISCLAIMER}
        intro={`${BRAND.name} is committed to protecting personal data in line with the UK GDPR, EU GDPR where applicable, and other relevant privacy laws.`}
        sections={PRIVACY_SECTIONS}
      />
      <Footer />
    </>
  );
}
