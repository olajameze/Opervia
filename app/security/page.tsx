import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { BRAND } from "@/lib/branding";
import { createMetadata } from "@/lib/seo";
import { Shield, Lock, Eye, Server } from "lucide-react";

export const metadata = createMetadata({
  title: "Security",
  description: `Security practices at ${BRAND.name}`,
  path: "/security",
});

const securityFeatures = [
  { icon: Lock, title: "Encryption", description: "All data encrypted in transit (TLS 1.3) and at rest (AES-256)." },
  { icon: Shield, title: "Access Control", description: "Role-based permissions with organization-level data isolation." },
  { icon: Eye, title: "Audit Logging", description: "Complete audit trail of all critical actions across your organization." },
  { icon: Server, title: "Infrastructure", description: "Hosted on SOC 2 compliant infrastructure with 99.9% uptime SLA." },
];

export default function SecurityPage() {
  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-16 md:px-6">
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
          <h1 className="text-4xl font-bold">Security at {BRAND.name}</h1>
          <p className="text-lg text-muted-foreground">
            Enterprise-grade security built into every layer of the platform.
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
          {securityFeatures.map((feature) => (
            <div key={feature.title} className="flex gap-4 p-6 rounded-xl border">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <feature.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
