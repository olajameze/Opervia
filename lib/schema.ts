import { BRAND } from "./branding";
import { getAppUrl } from "./app-url";

export function softwareApplicationSchema() {
  const appUrl = getAppUrl();
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: BRAND.name,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: BRAND.mission,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
      description: `Free ${BRAND.trialDays}-day trial`,
    },
    url: appUrl,
  };
}

export function organizationSchema() {
  const appUrl = getAppUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: BRAND.name,
    url: appUrl,
    description: BRAND.positioning,
    email: BRAND.supportEmail,
  };
}

export function faqSchema(
  items: { question: string; answer: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function jsonLdScript(data: object) {
  return JSON.stringify(data);
}
