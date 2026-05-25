export const BRAND = {
  name: "Opervia",
  productType: "B2B SaaS Rental + Workforce + Operations Platform",
  mission:
    "Help businesses eliminate operational chaos by managing equipment rentals, staff, freelancers, scheduling, logistics, inventory, billing, analytics, notifications, and operational workflows.",
  positioning: "Opervia is the Operational OS for modern businesses.",
  tagline: "Run Your Entire Operation From One Platform",
  secondaryTagline: "Stop Managing Operations Through Spreadsheets & WhatsApp",
  alternativeTaglines: [
    "Opervia — Smarter Rental & Workforce Operations",
    "Opervia — Coordinate Teams, Equipment & Jobs In One Place",
    "Opervia — The Operational OS For Modern Businesses",
    "Opervia — Simplify Scheduling, Staffing & Rental Operations",
  ],
  values: [
    "Simplicity",
    "Operational clarity",
    "Speed",
    "Reliability",
    "Automation",
    "Scalability",
    "Mobile-first experience",
    "Professional enterprise UX",
  ],
  trialDays: 30,
  supportEmail: process.env.OPERVIA_SUPPORT_EMAIL?.trim() || "opervia@gmail.com",
  salesEmail: process.env.OPERVIA_SALES_EMAIL?.trim() || process.env.OPERVIA_SUPPORT_EMAIL?.trim() || "opervia@gmail.com",
} as const;

export const HERO = {
  headline: BRAND.secondaryTagline,
  subheadline:
    "Opervia helps businesses manage equipment, staff, freelancers, scheduling, logistics and operations from one intelligent platform built for growing teams across Europe.",
  primaryCta: "Start Free 30-Day Trial",
  secondaryCta: "See Features",
} as const;
