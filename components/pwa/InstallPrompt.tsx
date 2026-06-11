"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/branding";
import { PWA_INSTALL_DISMISSED_SESSION_KEY } from "@/lib/pwa/types";
import {
  detectInstallPlatform,
  getInstallFallbackMessage,
  type InstallPlatform,
} from "@/lib/pwa/install-platform";
import { useOptionalPwa } from "@/components/pwa/PwaProvider";
import { X, Download, Share, MonitorDown } from "lucide-react";

const SHOW_DELAY_MS = 500;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function FallbackIcon({ platform }: { platform: InstallPlatform }) {
  if (platform === "ios-safari") {
    return <Share className="h-4 w-4 shrink-0" />;
  }
  if (platform === "macos-safari") {
    return <MonitorDown className="h-4 w-4 shrink-0" />;
  }
  return <Download className="h-4 w-4 shrink-0" />;
}

export function InstallPrompt() {
  const pwa = useOptionalPwa();
  const [visible, setVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [platform, setPlatform] = useState<InstallPlatform>("generic");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(PWA_INSTALL_DISMISSED_SESSION_KEY)) return;
    if (pwa?.isInstalled) return;

    setPlatform(detectInstallPlatform());

    const showTimer = window.setTimeout(() => {
      setVisible(true);
    }, SHOW_DELAY_MS);

    function handleBeforeInstall(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => {
      window.clearTimeout(showTimer);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, [pwa?.isInstalled]);

  function dismiss() {
    sessionStorage.setItem(PWA_INSTALL_DISMISSED_SESSION_KEY, String(Date.now()));
    setVisible(false);
  }

  async function install() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (choice.outcome === "accepted") {
      setVisible(false);
      return;
    }
    dismiss();
  }

  if (!visible) return null;

  const showNativeInstall = Boolean(deferredPrompt);

  return (
    <div
      role="dialog"
      aria-label="Install Opervia app"
      className="fixed inset-x-4 bottom-20 z-[70] rounded-xl border bg-card p-4 shadow-lg md:inset-x-auto md:right-6 md:bottom-6 md:max-w-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="font-semibold">Install {BRAND.name}</p>
          <p className="text-sm text-muted-foreground">
            Install on desktop or mobile for faster access and offline operations.
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="rounded-md p-1 text-muted-foreground hover:text-foreground"
          aria-label="Dismiss install prompt"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {showNativeInstall ? (
        <div className="mt-4 flex gap-2">
          <Button size="sm" onClick={install} className="gap-2">
            <Download className="h-4 w-4" />
            Install app
          </Button>
          <Button size="sm" variant="outline" onClick={dismiss}>
            Not now
          </Button>
        </div>
      ) : (
        <>
          <div className="mt-4 flex items-center gap-2 rounded-md bg-muted/60 px-3 py-2 text-sm">
            <FallbackIcon platform={platform} />
            <span>{getInstallFallbackMessage(platform)}</span>
          </div>
          <div className="mt-4">
            <Button size="sm" variant="outline" onClick={dismiss}>
              Got it
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
