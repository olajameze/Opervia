"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BRAND } from "@/lib/branding";

export function SuperAdminSecurityPanel() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [manualEntryKey, setManualEntryKey] = useState("");
  const [code, setCode] = useState("");
  const enabled = Boolean(session?.user?.totpEnabled);

  useEffect(() => {
    if (!enabled) {
      void startSetup();
    }
  }, [enabled]);

  async function startSetup() {
    setSetupLoading(true);
    setError("");
    const res = await fetch("/api/admin/mfa/setup");
    setSetupLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not start MFA setup");
      return;
    }

    const data = await res.json();
    if (data.enabled) return;
    setQrDataUrl(data.qrDataUrl ?? null);
    setManualEntryKey(data.manualEntryKey ?? "");
  }

  async function enableMfa(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const res = await fetch("/api/admin/mfa/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not enable MFA");
      return;
    }

    await update({ superAdminMfaVerified: true });
    setSuccess("Multi-factor authentication is now enabled for your super admin account.");
    setCode("");
    setQrDataUrl(null);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Super admin MFA</CardTitle>
        <CardDescription>
          Protect {BRAND.name} platform controls with a time-based one-time password from an
          authenticator app.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {enabled ? (
          <p className="text-sm text-emerald-600">
            MFA is enabled. You will be asked for a code when accessing super admin tools.
          </p>
        ) : setupLoading ? (
          <p className="text-sm text-muted-foreground">Preparing authenticator setup...</p>
        ) : (
          <>
            {qrDataUrl && (
              <div className="flex flex-col items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrDataUrl} alt="Authenticator QR code" className="h-48 w-48 rounded-md border" />
                <p className="text-xs text-muted-foreground break-all text-center">
                  Manual key: {manualEntryKey}
                </p>
              </div>
            )}
            <form onSubmit={enableMfa} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="enable-code">Confirm with a code</Label>
                <Input
                  id="enable-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]*"
                  maxLength={8}
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? "Enabling..." : "Enable MFA"}
              </Button>
            </form>
          </>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && <p className="text-sm text-emerald-600">{success}</p>}
      </CardContent>
    </Card>
  );
}
