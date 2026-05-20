"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = e.currentTarget;
    const data = new FormData(form);

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.get("name"),
        email: data.get("email"),
        company: data.get("company"),
        phone: data.get("phone"),
        subject: data.get("subject"),
        message: data.get("message"),
      }),
    });

    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Something went wrong. Please try again.");
      return;
    }

    setSuccess(true);
    form.reset();
  }

  if (success) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center space-y-2">
        <p className="text-lg font-semibold">Thanks — message received.</p>
        <p className="text-sm text-muted-foreground">
          A member of our team will be in touch within one business day.
        </p>
        <Button
          variant="outline"
          className="min-w-[200px] mt-2"
          onClick={() => setSuccess(false)}
        >
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">
            Name <span aria-hidden="true">*</span>
          </Label>
          <Input id="name" name="name" required autoComplete="name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">
            Work email <span aria-hidden="true">*</span>
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@company.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="company">Company</Label>
          <Input id="company" name="company" autoComplete="organization" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" type="tel" autoComplete="tel" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="subject">
          Subject <span aria-hidden="true">*</span>
        </Label>
        <Input
          id="subject"
          name="subject"
          required
          placeholder="How can we help?"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="message">
          Message <span aria-hidden="true">*</span>
        </Label>
        <Textarea
          id="message"
          name="message"
          required
          rows={6}
          minLength={10}
          placeholder="Tell us about your operation — team size, current tooling, and what you'd like to improve."
        />
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <div className="flex justify-end pt-1">
        <Button type="submit" className="min-w-[200px]" disabled={loading}>
          {loading ? "Sending..." : "Send message"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        We only use your information to reply to your enquiry. See our{" "}
        <a href="/privacy" className="text-primary hover:underline">
          privacy policy
        </a>
        .
      </p>
    </form>
  );
}
