"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BRAND, HERO } from "@/lib/branding";
import { HoneypotField, HONEYPOT_FIELD } from "@/components/security/HoneypotField";
import { TurnstileWidget, isTurnstileEnabled } from "@/components/security/TurnstileWidget";

type RegisterFormProps = {
  inviteToken?: string;
  invitedEmail?: string;
  organizationName?: string;
};

export function RegisterForm({
  inviteToken,
  invitedEmail,
  organizationName,
}: RegisterFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!acceptedTerms) {
      setError("You must accept the Terms of Service and Privacy Policy.");
      setLoading(false);
      return;
    }

    if (isTurnstileEnabled() && !turnstileToken) {
      setError("Complete the security check before continuing.");
      setLoading(false);
      return;
    }

    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        password: form.get("password"),
        [HONEYPOT_FIELD]: form.get(HONEYPOT_FIELD),
        turnstileToken,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Registration failed");
      setLoading(false);
      return;
    }

    const data = await res.json();
    const email = form.get("email") as string;

    if (data.requiresEmailVerification) {
      const params = new URLSearchParams({ email });
      router.push(`/verify-email?${params.toString()}`);
      router.refresh();
      return;
    }

    const result = await signIn("credentials", {
      email,
      password: form.get("password") as string,
      redirect: false,
    });

    if (result?.error) {
      setError("Account created but sign-in failed. Please log in.");
      setLoading(false);
      return;
    }

    if (inviteToken) {
      router.push(`/invite?token=${inviteToken}`);
    } else {
      router.push("/onboarding");
    }
    router.refresh();
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>
          {organizationName ? `Join ${organizationName}` : HERO.primaryCta}
        </CardTitle>
        <CardDescription>
          {inviteToken
            ? `Create your account to accept the team invite.`
            : `${BRAND.trialDays} days free · No credit card required`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="relative space-y-4">
          <HoneypotField />
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" name="name" required placeholder="Jane Smith" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Work email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              readOnly={Boolean(invitedEmail)}
              defaultValue={invitedEmail}
              placeholder="jane@company.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <PasswordInput id="password" name="password" required minLength={8} />
            <p className="text-xs text-muted-foreground">
              At least 8 characters with letters and numbers.
            </p>
          </div>
          <TurnstileWidget onTokenChange={setTurnstileToken} />
          <Label
            htmlFor="accept-terms"
            className="flex cursor-pointer items-start gap-2 text-sm font-normal leading-snug"
          >
            <input
              id="accept-terms"
              name="acceptTerms"
              type="checkbox"
              required
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              aria-label="I agree to the Terms of Service and Privacy Policy"
              className="mt-1 h-4 w-4 rounded border-input accent-primary"
            />
            <span>
              I agree to the{" "}
              <Link href="/terms" className="text-primary hover:underline" target="_blank">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-primary hover:underline" target="_blank">
                Privacy Policy
              </Link>
              .
            </span>
          </Label>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-center pt-1">
            <Button type="submit" className="min-w-[200px]" disabled={loading || !acceptedTerms}>
              {loading ? "Creating account..." : inviteToken ? "Create account & continue" : HERO.primaryCta}
            </Button>
          </div>
        </form>
      </CardContent>
      <CardFooter className="text-sm text-center">
        <p>
          Already have an account?{" "}
          <Link
            href={
              inviteToken
                ? `/login?callbackUrl=${encodeURIComponent(`/invite?token=${inviteToken}`)}`
                : "/login"
            }
            className="text-primary hover:underline"
          >
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
