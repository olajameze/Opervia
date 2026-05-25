"use client";

import { useEffect, type ReactNode } from "react";
import { usePwa } from "@/components/pwa/PwaProvider";
import { OfflineAppShell } from "@/components/pwa/OfflineAppShell";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { OfflineBanner, OnlineSyncBanner } from "@/components/pwa/OfflineBanner";

export function AppOfflineGate({ children }: { children: ReactNode }) {
  const { isOnline, refreshSnapshot } = usePwa();

  useEffect(() => {
    if (isOnline) {
      void refreshSnapshot();
    }
  }, [isOnline, refreshSnapshot]);

  return (
    <>
      <OfflineBanner />
      <OnlineSyncBanner />
      {!isOnline ? <OfflineAppShell /> : children}
      <InstallPrompt />
    </>
  );
}
