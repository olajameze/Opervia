"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

function Banner({
  title,
  description,
  icon: Icon,
  className,
}: {
  title: string;
  description: string;
  icon: typeof CheckCircle2;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border p-4 flex gap-3", className)}>
      <Icon className="h-5 w-5 shrink-0 mt-0.5" />
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm opacity-90">{description}</p>
      </div>
    </div>
  );
}

export function BillingStatusBanner() {
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("success") === "true") setVisible("success");
    else if (searchParams.get("canceled") === "true") setVisible("canceled");
    else if (searchParams.get("expired") === "1") setVisible("expired");
    else if (searchParams.get("upgrade") === "true") setVisible("upgrade");
  }, [searchParams]);

  if (!visible) return null;

  if (visible === "success") {
    return (
      <Banner
        icon={CheckCircle2}
        title="Subscription updated"
        description="Your payment was successful. Your plan should reflect shortly."
        className="border-emerald-200 bg-emerald-50 text-emerald-950"
      />
    );
  }

  if (visible === "canceled") {
    return (
      <Banner
        icon={XCircle}
        title="Checkout canceled"
        description="No changes were made to your subscription."
      />
    );
  }

  if (visible === "expired") {
    return (
      <Banner
        icon={AlertTriangle}
        title="Trial expired"
        description="Subscribe to a plan below to restore full access to Opervia."
        className="border-destructive/30 bg-destructive/5 text-destructive"
      />
    );
  }

  return (
    <Banner
      icon={AlertTriangle}
      title="Upgrade required"
      description="Choose a plan below to unlock this feature."
    />
  );
}
