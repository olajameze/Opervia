import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { BRAND } from "@/lib/branding";
import {
  LEGAL,
  LEGAL_DISCLAIMER,
  TERMS_SECTIONS,
} from "@/lib/legal";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Terms of Service",
  description: `Terms of Service for ${BRAND.name} — subscription, acceptable use, data roles, and liability.`,
  path: "/terms",
});

export default function TermsPage() {
  return (
    <>
      <Header />
      <LegalDocument
        title="Terms of Service"
        lastUpdated={LEGAL.lastUpdated}
        disclaimer={LEGAL_DISCLAIMER}
        intro={`These Terms govern your use of ${BRAND.name}, the B2B operational platform operated by ${LEGAL.entityName}. By using ${BRAND.name}, you agree to these Terms and our Privacy Policy.`}
        sections={TERMS_SECTIONS}
      />
      <Footer />
    </>
  );
}
