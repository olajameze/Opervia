"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  COOKIE_CONSENT_EVENT,
  COOKIE_CONSENT_KEY,
  type CookieConsentChoice,
} from "@/lib/legal/cookie-consent";

function persistConsent(choice: CookieConsentChoice) {
  localStorage.setItem(COOKIE_CONSENT_KEY, choice);
  window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_EVENT, { detail: choice }));
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) setVisible(true);
  }, []);

  function accept() {
    persistConsent("accepted");
    setVisible(false);
  }

  function decline() {
    persistConsent("declined");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 rounded-lg border bg-background p-4 shadow-lg"
    >
      <p className="text-sm text-muted-foreground mb-3">
        Opervia uses essential cookies for sign-in and security. With your consent, we also use
        analytics cookies to improve the product. See our{" "}
        <Link href="/privacy" className="text-primary hover:underline">
          Privacy Policy
        </Link>
        .
      </p>
      <div className="flex gap-2">
        <Button size="sm" onClick={accept}>
          Accept analytics
        </Button>
        <Button size="sm" variant="outline" onClick={decline}>
          Decline
        </Button>
      </div>
    </div>
  );
}
