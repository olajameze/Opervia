"use client";

import { useState } from "react";
import { signIn, signOut } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BRAND, HERO } from "@/lib/branding";

export function LoginForm({
  showGoogleAuth = false,
  signedInEmail,
  defaultCallbackUrl = "/dashboard",
}: {
  showGoogleAuth?: boolean;
  signedInEmail?: string;
  defaultCallbackUrl?: string;
}) {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? defaultCallbackUrl;
  const verified = searchParams.get("verified") === "1";
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const email = form.get("email") as string;
    const result = await signIn("credentials", {
      email,
      password: form.get("password") as string,
      redirect: false,
    });

    if (result?.error) {
      setUnverifiedEmail(email);
      let message =
        result.error === "AccessDenied"
          ? "Please verify your email before signing in."
          : "Invalid email or password. If you haven't verified your email yet, use the link below.";

      try {
        const maintenanceRes = await fetch("/api/system/maintenance", { cache: "no-store" });
        if (maintenanceRes.ok) {
          const { maintenanceMode } = (await maintenanceRes.json()) as {
            maintenanceMode?: boolean;
          };
          if (maintenanceMode) {
            message =
              "Opervia is under maintenance. Only platform administrators can sign in right now.";
          }
        }
      } catch {
        // Keep the default auth error message.
      }

      setError(message);
      setLoading(false);
      return;
    }

    window.location.assign(callbackUrl);
  }

  async function handleResendVerification() {
    if (!unverifiedEmail) return;
    setResending(true);
    await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: unverifiedEmail }),
    });
    setResending(false);
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign in to {BRAND.name}</CardTitle>
        <CardDescription>{BRAND.tagline}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {signedInEmail && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-950 space-y-2">
            <p>
              Signed in as <span className="font-medium">{signedInEmail}</span>. Sign out to use a
              platform administrator account.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              Sign out
            </Button>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required placeholder="you@company.com" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-xs text-muted-foreground hover:text-primary"
              >
                Forgot password?
              </Link>
            </div>
            <PasswordInput id="password" name="password" required />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {verified && (
            <p className="text-sm text-emerald-600">
              Email verified. You can sign in now.
            </p>
          )}
          {(error || unverifiedEmail) && (
            <p className="text-sm text-muted-foreground">
              Need a new verification link?{" "}
              <button
                type="button"
                className="text-primary hover:underline disabled:opacity-50"
                onClick={handleResendVerification}
                disabled={!unverifiedEmail || resending}
              >
                {resending ? "Sending..." : "Resend verification email"}
              </button>
              {" "}or{" "}
              <Link href={`/verify-email${unverifiedEmail ? `?email=${encodeURIComponent(unverifiedEmail)}` : ""}`} className="text-primary hover:underline">
                open verify page
              </Link>
              .
            </p>
          )}
          <div className="flex justify-center pt-1">
            <Button type="submit" className="min-w-[200px]" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </div>
        </form>
        {showGoogleAuth && (
          <>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or</span>
              </div>
            </div>
            <div className="flex justify-center">
              <Button
                variant="outline"
                className="min-w-[200px]"
                onClick={() => signIn("google", { callbackUrl })}
              >
                Continue with Google
              </Button>
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-2 text-sm text-center">
        <p>
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-primary hover:underline">
            {HERO.primaryCta}
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
