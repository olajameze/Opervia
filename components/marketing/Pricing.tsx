"use client";

import { useState } from "react";
import { BRAND } from "@/lib/branding";
import { PLANS, type SubscriptionPlan } from "@/lib/plans";
import { LinkButton } from "@/components/ui/link-button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const plans = [
  { ...PLANS.STARTER, highlighted: false },
  { ...PLANS.PRO, highlighted: true },
  { ...PLANS.ENTERPRISE, highlighted: false },
];

export function Pricing() {
  const [focusedPlan, setFocusedPlan] = useState<SubscriptionPlan>("PRO");

  return (
    <section id="pricing" className="py-20 md:py-28 bg-muted/30">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Simple, transparent pricing</h2>
          <p className="text-muted-foreground text-lg">
            Start with a {BRAND.trialDays}-day free trial. Card required at signup — no charge until the trial ends.
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const isFocused = focusedPlan === plan.id;

            return (
              <Card
                key={plan.id}
                tabIndex={0}
                onMouseEnter={() => setFocusedPlan(plan.id)}
                onFocus={() => setFocusedPlan(plan.id)}
                onClick={() => setFocusedPlan(plan.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setFocusedPlan(plan.id);
                  }
                }}
                className={cn(
                  "group relative cursor-pointer overflow-visible transition-all duration-300 ease-out",
                  "hover:-translate-y-2 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                  plan.highlighted && "border-primary",
                  isFocused
                    ? "border-primary shadow-xl -translate-y-2 ring-2 ring-primary/15"
                    : "hover:border-primary/40"
                )}
              >
                <div
                  className={cn(
                    "pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] bg-gradient-to-b from-primary/10 via-primary/5 to-transparent transition-opacity duration-300",
                    isFocused ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  )}
                  aria-hidden
                />
                {plan.highlighted && (
                  <Badge className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2 border-primary bg-background px-3 py-1 text-primary shadow-sm">
                    Most Popular
                  </Badge>
                )}
                <CardHeader className={cn("relative", plan.highlighted && "pt-8")}>
                  <CardTitle className="transition-colors group-hover:text-primary">
                    {plan.name}
                  </CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="pt-4">
                    <span
                      className={cn(
                        "text-4xl font-bold transition-transform duration-300",
                        isFocused && "scale-105 inline-block origin-left"
                      )}
                    >
                      {plan.priceLabel}
                    </span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-sm transition-colors duration-300 group-hover:text-foreground"
                      >
                        <Check
                          className={cn(
                            "mt-0.5 h-4 w-4 shrink-0 text-primary transition-transform duration-300",
                            isFocused ? "scale-110" : "group-hover:scale-110"
                          )}
                        />
                        <span className={cn(isFocused && "text-foreground")}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="relative flex justify-center">
                  <LinkButton
                    href="/register"
                    variant={plan.highlighted || isFocused ? "default" : "outline"}
                    className={cn(
                      "transition-all duration-300",
                      isFocused && "shadow-md"
                    )}
                  >
                    Start Free Trial
                  </LinkButton>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
