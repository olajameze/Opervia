import { BRAND } from "@/lib/branding";
import { PLANS } from "@/lib/plans";
import { getAppUrl } from "@/lib/app-url";

/** Legal operator details — override via environment in production if needed. */
export const LEGAL = {
  lastUpdated: "22 May 2026",
  version: "1.0",
  entityName: process.env.LEGAL_ENTITY_NAME ?? "JGDev",
  tradingAs: BRAND.name,
  registeredAddress:
    process.env.LEGAL_ENTITY_ADDRESS ?? "United Kingdom",
  jurisdiction: "England and Wales",
  governingLaw: "England and Wales",
  privacyEmail: BRAND.supportEmail,
  legalEmail: BRAND.supportEmail,
  website: getAppUrl(),
  creatorUrl: "https://www.jgdev.co.uk/",
  trialDays: BRAND.trialDays,
  plans: {
    starter: `${PLANS.STARTER.priceLabel}${PLANS.STARTER.period}`,
    pro: `${PLANS.PRO.priceLabel}${PLANS.PRO.period}`,
    enterprise: `${PLANS.ENTERPRISE.priceLabel}${PLANS.ENTERPRISE.period}`,
  },
} as const;

export type LegalBlock =
  | { type: "p"; text: string }
  | { type: "ps"; texts: string[] }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "h3"; text: string };

export type LegalSection = {
  id: string;
  title: string;
  blocks: LegalBlock[];
};
