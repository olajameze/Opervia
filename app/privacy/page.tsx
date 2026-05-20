import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { BRAND } from "@/lib/branding";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Privacy Policy",
  description: `Privacy Policy for ${BRAND.name}`,
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-16 md:px-6 max-w-3xl prose prose-slate">
        <h1>Privacy Policy</h1>
        <p>Last updated: {new Date().toLocaleDateString("en-GB")}</p>
        <p>
          {BRAND.name} (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your personal data
          in accordance with the General Data Protection Regulation (GDPR).
        </p>
        <h2>Data We Collect</h2>
        <ul>
          <li>Account information (name, email, organization details)</li>
          <li>Operational data you enter (jobs, equipment, staff records)</li>
          <li>Usage analytics (with your consent)</li>
          <li>Payment information (processed securely via Stripe)</li>
        </ul>
        <h2>Your Rights</h2>
        <p>
          You have the right to access, rectify, erase, restrict processing, and port your data.
          Contact us at {BRAND.supportEmail}.
        </p>
        <h2>Data Retention</h2>
        <p>
          We retain your data for as long as your account is active. Upon deletion request,
          data is removed within 30 days except where legally required to retain.
        </p>
      </main>
      <Footer />
    </>
  );
}
