import type { Metadata } from "next";
import { BRAND } from "./branding";
import { getAppUrl } from "./app-url";

export function createMetadata({
  title,
  description,
  path = "",
  noIndex = false,
}: {
  title?: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
}): Metadata {
  const fullTitle = title
    ? `${title} | ${BRAND.name}`
    : `${BRAND.name} | ${BRAND.tagline}`;
  const desc =
    description ??
    `${BRAND.name} — ${BRAND.tagline}. ${BRAND.secondaryTagline}`;

  const appUrl = getAppUrl();

  return {
    title: fullTitle,
    description: desc,
    metadataBase: new URL(appUrl),
    alternates: { canonical: `${appUrl}${path}` },
    openGraph: {
      title: fullTitle,
      description: desc,
      url: `${appUrl}${path}`,
      siteName: BRAND.name,
      type: "website",
      locale: "en_GB",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: desc,
    },
    robots: noIndex ? { index: false, follow: false } : undefined,
    applicationName: BRAND.name,
    manifest: "/manifest.json",
    icons: {
      icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
      apple: [{ url: "/apple-icon.svg", sizes: "180x180", type: "image/svg+xml" }],
    },
  };
}
