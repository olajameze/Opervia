import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { createMetadata } from "@/lib/seo";
import { BRAND } from "@/lib/branding";
import { Providers } from "@/components/providers";
import { CookieConsent } from "@/components/legal/CookieConsent";
import { SatisfactionBanner } from "@/components/layout/SatisfactionBanner";
import { enforceMaintenanceMode } from "@/lib/maintenance-enforcement";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = createMetadata({});

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await enforceMaintenanceMode();
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans min-h-screen">
        <Providers>{children}</Providers>
        <CookieConsent />
        <SatisfactionBanner />
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}', { anonymize_ip: true });
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
