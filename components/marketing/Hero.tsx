import { HERO, BRAND } from "@/lib/branding";
import { LinkButton } from "@/components/ui/link-button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      <div className="absolute inset-0 -z-10 opervia-hero-mesh" />
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-4xl text-center space-y-8">
          <Badge variant="secondary" className="animate-fade-in border-primary/20 bg-primary/5 text-foreground">
            {BRAND.positioning}
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl text-balance animate-fade-in text-opervia-brand">
            {HERO.headline}
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground text-balance animate-fade-in">
            {HERO.subheadline}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in">
            <LinkButton href="/register" size="lg">
              {HERO.primaryCta}
              <ArrowRight className="ml-1 h-4 w-4" />
            </LinkButton>
            <LinkButton
              href="#features"
              size="lg"
              variant="outline"
              className="border-border bg-card text-foreground shadow-sm hover:border-primary/30 hover:bg-card"
            >
              {HERO.secondaryCta}
            </LinkButton>
          </div>
          <p className="text-sm text-muted-foreground">
            No credit card required · {BRAND.trialDays}-day free trial · Cancel anytime
          </p>
        </div>

        <div className="mt-16 mx-auto max-w-5xl">
          <div className="rounded-xl border bg-card shadow-2xl overflow-hidden">
            <div className="bg-muted px-4 py-3 flex items-center gap-2 border-b">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-amber-400" />
                <div className="h-3 w-3 rounded-full bg-success" />
              </div>
              <span className="text-xs text-muted-foreground ml-2">{BRAND.name} Dashboard</span>
            </div>
            <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4 min-h-[200px]">
              {[
                { label: "Active Jobs", value: "24", color: "text-primary" },
                { label: "Staff On Shift", value: "18", color: "text-success" },
                { label: "Equipment Out", value: "12", color: "text-warning" },
                { label: "Revenue MTD", value: "£48.2k", color: "text-opervia-brand" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-lg border p-4 bg-background">
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
