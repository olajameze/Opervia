import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { BRAND } from "@/lib/branding";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Terms of Service",
  description: `Terms of Service for ${BRAND.name}`,
  path: "/terms",
});

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-16 md:px-6 max-w-3xl prose prose-slate">
        <h1>Terms of Service</h1>
        <p>Last updated: {new Date().toLocaleDateString("en-GB")}</p>
        <p>
          By using {BRAND.name}, you agree to these terms. {BRAND.name} provides a B2B SaaS platform
          for rental, workforce, and operations management.
        </p>
        <h2>Subscription & Billing</h2>
        <p>
          Plans are billed monthly or annually via Stripe. A {BRAND.trialDays}-day free trial is
          provided for new accounts. You may cancel at any time.
        </p>
        <h2>Acceptable Use</h2>
        <p>
          You agree not to misuse the platform, attempt unauthorized access, or use {BRAND.name}
          for unlawful purposes.
        </p>
        <h2>Limitation of Liability</h2>
        <p>
          {BRAND.name} is provided &quot;as is&quot;. We are not liable for indirect damages arising
          from use of the platform beyond fees paid in the preceding 12 months.
        </p>
      </main>
      <Footer />
    </>
  );
}
