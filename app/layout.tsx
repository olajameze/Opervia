import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { createMetadata } from "@/lib/seo";
import { Providers } from "@/components/providers";
import { PwaProvider } from "@/components/pwa/PwaProvider";
import { CookieConsent } from "@/components/legal/CookieConsent";
import { GoogleAnalytics } from "@/components/legal/GoogleAnalytics";
import { SatisfactionBanner } from "@/components/layout/SatisfactionBanner";
import { StripeTestModeBanner } from "@/components/layout/StripeTestModeBanner";
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
        <Providers>
          <PwaProvider>{children}</PwaProvider>
        </Providers>
        <CookieConsent />
        <SatisfactionBanner />
        <StripeTestModeBanner />
        {gaId ? <GoogleAnalytics measurementId={gaId} /> : null}
      </body>
    </html>
  );
}
