"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BRAND, HERO } from "@/lib/branding";

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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        password: form.get("password"),
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Registration failed");
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", {
      email: form.get("email") as string,
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
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <Input id="password" name="password" type="password" required minLength={8} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-center pt-1">
            <Button type="submit" className="min-w-[200px]" disabled={loading}>
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
