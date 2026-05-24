"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import {
  COOKIE_CONSENT_EVENT,
  COOKIE_CONSENT_KEY,
  parseCookieConsent,
} from "@/lib/legal/cookie-consent";

type GoogleAnalyticsProps = {
  measurementId: string;
};

export function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    function readConsent() {
      const stored = parseCookieConsent(localStorage.getItem(COOKIE_CONSENT_KEY));
      setEnabled(stored === "accepted");
    }

    readConsent();
    window.addEventListener(COOKIE_CONSENT_EVENT, readConsent);
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, readConsent);
  }, []);

  if (!enabled) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}', { anonymize_ip: true });
        `}
      </Script>
    </>
  );
}
