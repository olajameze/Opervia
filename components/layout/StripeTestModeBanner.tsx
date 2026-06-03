"use client";

import { useCallback, useEffect, useState } from "react";
import { Toast, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";

const STORAGE_KEY = "opervia_stripe_test_notice_last";
const INTERVAL_MS = 30 * 60 * 1000;

export function StripeTestModeBanner() {
  const isTestMode =
    process.env.NEXT_PUBLIC_STRIPE_TEST_MODE === "true" ||
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith("pk_test_");

  const [open, setOpen] = useState(false);

  const showNotice = useCallback(() => {
    if (!isTestMode) return;
    setOpen(true);
    sessionStorage.setItem(STORAGE_KEY, String(Date.now()));
  }, [isTestMode]);

  useEffect(() => {
    if (!isTestMode) return;

    const last = Number(sessionStorage.getItem(STORAGE_KEY) || "0");
    const shouldShow = !last || Date.now() - last >= INTERVAL_MS;
    if (shouldShow) {
      showNotice();
    }

    const interval = setInterval(() => {
      showNotice();
    }, INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isTestMode, showNotice]);

  if (!isTestMode) return null;

  return (
    <ToastProvider swipeDirection="up">
      <Toast open={open} onOpenChange={setOpen} duration={8000}>
        <ToastTitle>Stripe test mode — no real charges will be processed.</ToastTitle>
      </Toast>
      <ToastViewport />
    </ToastProvider>
  );
}
