import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { Hero } from "@/components/marketing/Hero";
import { Features } from "@/components/marketing/Features";
import { Pricing } from "@/components/marketing/Pricing";
import { FAQ, faqs } from "@/components/marketing/FAQ";
import { CTA } from "@/components/marketing/CTA";
import { EmergencyRibbon } from "@/components/marketing/EmergencyRibbon";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import {
  softwareApplicationSchema,
  organizationSchema,
  faqSchema,
  jsonLdScript,
} from "@/lib/schema";
import { CheckCircle2 } from "lucide-react";

const socialProof = [
  "Built for European operations teams",
  "GDPR compliant",
  "Enterprise-grade infrastructure",
  "5-day free trial",
];

export default function HomePage() {
  const schemas = [
    softwareApplicationSchema(),
    organizationSchema(),
    faqSchema(faqs),
  ];

  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(schema) }}
        />
      ))}
      <Header />
      <main className="pt-6 pb-20 md:pb-0">
        <Hero />
        <section className="border-y bg-muted/20 py-8">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-wrap justify-center gap-6 md:gap-12">
              {socialProof.map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>
        <section id="how-it-works" className="py-20 md:py-28">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                From chaos to clarity in 3 steps
              </h2>
            </div>
            <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
              {[
                {
                  step: "01",
                  title: "Connect your operation",
                  description:
                    "Import equipment, staff, and clients. Set up your workspace in minutes.",
                },
                {
                  step: "02",
                  title: "Schedule & dispatch",
                  description:
                    "Assign jobs, allocate equipment, and coordinate teams from one dashboard.",
                },
                {
                  step: "03",
                  title: "Automate & scale",
                  description:
                    "Let Opervia handle notifications, billing, and workflow automations as you grow.",
                },
              ].map((item) => (
                <div key={item.step} className="text-center space-y-3">
                  <div className="text-4xl font-bold text-primary/20">{item.step}</div>
                  <h3 className="text-xl font-semibold">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <Features />
        <Pricing />
        <FAQ />
        <CTA />
      </main>
      <Footer />
      <EmergencyRibbon />
      <InstallPrompt />
    </>
  );
}
