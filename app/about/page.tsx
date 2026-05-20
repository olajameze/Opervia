import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { LinkButton } from "@/components/ui/link-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BRAND, HERO } from "@/lib/branding";
import { createMetadata } from "@/lib/seo";
import {
  Sparkles,
  Gauge,
  ShieldCheck,
  Workflow,
  Smartphone,
  Layers,
} from "lucide-react";

export const metadata = createMetadata({
  title: "About",
  description: `${BRAND.mission}`,
  path: "/about",
});

const values = [
  {
    icon: Sparkles,
    title: "Operational clarity",
    description:
      "We replace spreadsheets and WhatsApp threads with a single source of truth for jobs, equipment and people.",
  },
  {
    icon: Gauge,
    title: "Speed & simplicity",
    description:
      "Every page is built to be fast and obvious — your team should onboard in minutes, not weeks.",
  },
  {
    icon: ShieldCheck,
    title: "Reliability",
    description:
      "Organization-level data isolation, role-based access control, audit logging, and industry-standard encryption.",
  },
  {
    icon: Workflow,
    title: "Automation",
    description:
      "Rules engine handles repeat work: unassigned jobs, overdue invoices, delayed logistics, equipment shortages.",
  },
  {
    icon: Smartphone,
    title: "Mobile-first",
    description:
      "Designed for ops teams on the move — works on every screen with a native-feeling experience.",
  },
  {
    icon: Layers,
    title: "Scales with you",
    description:
      "From a 3-person crew on Starter to a 200-person operation on Pro, the same workflows grow with you.",
  },
];

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="pt-12 pb-20">
        <section className="container mx-auto px-4 md:px-6 max-w-4xl text-center space-y-6">
          <p className="text-xs uppercase tracking-wide text-primary font-semibold">
            About {BRAND.name}
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl text-balance">
            {BRAND.positioning}
          </h1>
          <p className="text-lg text-muted-foreground text-balance max-w-2xl mx-auto">
            {BRAND.mission}
          </p>
        </section>

        <section className="container mx-auto px-4 md:px-6 mt-16">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {values.map((value) => (
              <Card key={value.title}>
                <CardHeader>
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <value.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg pt-3">{value.title}</CardTitle>
                  <CardDescription>{value.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <section className="container mx-auto px-4 md:px-6 mt-20 max-w-3xl space-y-6">
          <h2 className="text-3xl font-bold tracking-tight text-center">
            Built for growing teams
          </h2>
          <p className="text-muted-foreground text-center text-lg">
            {BRAND.name} is designed for rental companies, field service businesses, logistics
            operators, and any organization tired of managing operations through spreadsheets and
            WhatsApp. If your team coordinates people, equipment, and jobs every day — {BRAND.name}
            is for you.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <LinkButton href="/register" size="lg">
              {HERO.primaryCta}
            </LinkButton>
            <LinkButton href="/#features" size="lg" variant="outline">
              See features
            </LinkButton>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Questions? Email{" "}
            <a
              className="text-primary hover:underline"
              href={`mailto:${BRAND.salesEmail}`}
            >
              {BRAND.salesEmail}
            </a>
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
