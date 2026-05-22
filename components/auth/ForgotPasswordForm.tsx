"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BRAND } from "@/lib/branding";
import { HoneypotField, HONEYPOT_FIELD } from "@/components/security/HoneypotField";
import { TurnstileWidget, isTurnstileEnabled } from "@/components/security/TurnstileWidget";

export function ForgotPasswordForm() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (isTurnstileEnabled() && !turnstileToken) {
      setError("Complete the security check before continuing.");
      setLoading(false);
      return;
    }

    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        [HONEYPOT_FIELD]: form.get(HONEYPOT_FIELD),
        turnstileToken,
      }),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Request failed");
      return;
    }
    setSubmitted(true);
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Reset your password</CardTitle>
        <CardDescription>
          Enter your {BRAND.name} email address. We will send you a link to set a new password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {submitted ? (
          <p className="text-sm text-muted-foreground">
            If an account exists for that email, a password reset link has been sent. Please check
            your inbox (and your server console in development).
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="relative space-y-4">
            <HoneypotField />
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required placeholder="you@company.com" />
            </div>
            <TurnstileWidget onTokenChange={setTurnstileToken} />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-center pt-1">
              <Button type="submit" className="min-w-[200px]" disabled={loading}>
                {loading ? "Sending..." : "Send reset link"}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-2 text-sm text-center">
        <p>
          Remembered it?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
