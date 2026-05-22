"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { BRAND } from "@/lib/branding";

const STORAGE_KEY = "opervia-guarantee-dismissed";

export function SatisfactionBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(localStorage.getItem(STORAGE_KEY) !== "true");
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "true");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100] bg-success text-success-foreground text-center text-xs py-1 font-medium hidden md:flex items-center justify-center gap-2 px-10"
      role="status"
      aria-label="Service guarantee"
    >
      <span>100% Satisfaction Guarantee — {BRAND.name} operational excellence</span>
      <button
        type="button"
        onClick={dismiss}
        className="absolute right-3 rounded p-0.5 hover:bg-white/20 transition-colors"
        aria-label="Dismiss guarantee banner"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
