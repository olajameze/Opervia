import {
  Calendar,
  Truck,
  Users,
  Package,
  BarChart3,
  Bell,
  Workflow,
  CreditCard,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: Package,
    title: "Equipment Rentals",
    description: "Track inventory, allocations, maintenance schedules, and rental contracts in one place.",
  },
  {
    icon: Users,
    title: "Workforce Management",
    description: "Manage staff and freelancers with skills, certifications, availability, and compliance.",
  },
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description: "Plan shifts, assign jobs, and resolve conflicts with an intelligent dispatch engine.",
  },
  {
    icon: Truck,
    title: "Logistics Tracking",
    description: "Monitor deliveries, routes, and operational milestones in real time.",
  },
  {
    icon: CreditCard,
    title: "Billing & Invoicing",
    description: "Generate invoices from jobs, rentals, and time — collect payments via Stripe.",
  },
  {
    icon: BarChart3,
    title: "Analytics & Reports",
    description: "Dashboard KPIs for utilization, on-time delivery, labor costs, and revenue.",
  },
  {
    icon: Bell,
    title: "Notifications",
    description: "Stay ahead with alerts for delays, low inventory, unassigned jobs, and overdue invoices.",
  },
  {
    icon: Workflow,
    title: "Workflow Automation",
    description: "Define rules that trigger actions when operational conditions are met.",
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 md:py-28">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything your operation needs
          </h2>
          <p className="text-muted-foreground text-lg">
            Replace spreadsheets, WhatsApp groups, and disconnected tools with one intelligent platform.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Card key={feature.title} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-2">
                  <feature.icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
