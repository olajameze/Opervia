import { BRAND } from "@/lib/branding";
import { PLANS } from "@/lib/plans";
import { LinkButton } from "@/components/ui/link-button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

const plans = [
  { ...PLANS.STARTER, highlighted: false },
  { ...PLANS.PRO, highlighted: true },
  { ...PLANS.ENTERPRISE, highlighted: false },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-20 md:py-28 bg-muted/30">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Simple, transparent pricing</h2>
          <p className="text-muted-foreground text-lg">
            Start with a free {BRAND.trialDays}-day trial on Pro features. No credit card required.
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={plan.highlighted ? "border-primary shadow-lg relative" : ""}
            >
              {plan.highlighted && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Most Popular</Badge>
              )}
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="pt-4">
                  <span className="text-4xl font-bold">{plan.priceLabel}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="flex justify-center">
                <LinkButton
                  href="/register"
                  variant={plan.highlighted ? "default" : "outline"}
                >
                  Start Free Trial
                </LinkButton>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
