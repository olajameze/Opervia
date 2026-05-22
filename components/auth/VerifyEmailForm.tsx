"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BRAND } from "@/lib/branding";

export function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const emailParam = searchParams.get("email") ?? "";
  const [email, setEmail] = useState(emailParam);
  const [loading, setLoading] = useState(Boolean(token));
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [verified, setVerified] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    async function verify() {
      setLoading(true);
      setError("");

      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (cancelled) return;

      setLoading(false);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Verification failed");
        return;
      }

      setVerified(true);
    }

    verify();

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleResend(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResending(true);
    setError("");
    setResent(false);

    const res = await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    setResending(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not resend verification email");
      return;
    }

    setResent(true);
  }

  if (token && loading) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Confirming your email</CardTitle>
          <CardDescription>Please wait while we verify your account.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (token && verified) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Email confirmed</CardTitle>
          <CardDescription>
            Your email is verified and your welcome email is on its way.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button className="w-full" onClick={() => router.push("/login?verified=1")}>
            Sign in to {BRAND.name}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Verify your email</CardTitle>
        <CardDescription>
          {token
            ? "This verification link is invalid or has expired."
            : `We sent a confirmation link to ${email || "your email"}. Click it to activate your ${BRAND.name} account.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <p className="text-sm text-destructive">{error}</p>}
        {resent && (
          <p className="text-sm text-emerald-600">
            If an unverified account exists for that email, we sent a new link.
          </p>
        )}
        <form onSubmit={handleResend} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Work email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
            />
          </div>
          <Button type="submit" className="w-full" disabled={resending}>
            {resending ? "Sending..." : "Resend verification email"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="text-sm text-center">
        <p>
          Already verified?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
