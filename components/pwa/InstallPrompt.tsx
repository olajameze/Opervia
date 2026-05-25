"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/branding";
import { PWA_INSTALL_DISMISSED_KEY } from "@/lib/pwa/types";
import { useOptionalPwa } from "@/components/pwa/PwaProvider";
import { X, Download, Share } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isIosSafari() {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const isIos = /iphone|ipad|ipod/i.test(ua);
  const isSafari = /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua);
  return isIos && isSafari;
}

export function InstallPrompt() {
  const pwa = useOptionalPwa();
  const [visible, setVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(PWA_INSTALL_DISMISSED_KEY)) return;
    if (pwa?.isInstalled) return;

    if (isIosSafari()) {
      setShowIosHelp(true);
      setVisible(true);
      return;
    }

    function handleBeforeInstall(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, [pwa?.isInstalled]);

  function dismiss() {
    localStorage.setItem(PWA_INSTALL_DISMISSED_KEY, String(Date.now()));
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
            {showIosHelp
              ? "Add Opervia to your home screen for quick access and offline use."
              : "Install the app on this device for faster access and offline operations."}
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

      {showIosHelp ? (
        <div className="mt-4 flex items-center gap-2 rounded-md bg-muted/60 px-3 py-2 text-sm">
          <Share className="h-4 w-4 shrink-0" />
          <span>Tap Share, then &quot;Add to Home Screen&quot;</span>
        </div>
      ) : (
        <div className="mt-4 flex gap-2">
          <Button size="sm" onClick={install} className="gap-2">
            <Download className="h-4 w-4" />
            Install app
          </Button>
          <Button size="sm" variant="outline" onClick={dismiss}>
            Not now
          </Button>
        </div>
      )}
    </div>
  );
}
