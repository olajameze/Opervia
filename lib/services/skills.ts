import { prisma } from "@/lib/db";

export const DEFAULT_SKILLS = [
  "Equipment Operation",
  "Safety & Compliance",
  "Electrical",
  "Plumbing",
  "Driving / Logistics",
  "Event Setup",
  "Crowd Management",
  "Technical Support",
  "General Labour",
  "Supervision",
] as const;

export async function ensureDefaultSkills(organizationId: string): Promise<void> {
  const existing = await prisma.skillCatalog.count({ where: { organizationId } });
  if (existing > 0) return;

  await prisma.skillCatalog.createMany({
    data: DEFAULT_SKILLS.map((name) => ({ name, organizationId })),
    skipDuplicates: true,
  });
}

export async function getSkillCatalog(organizationId: string): Promise<string[]> {
  await ensureDefaultSkills(organizationId);
  const skills = await prisma.skillCatalog.findMany({
    where: { organizationId },
    orderBy: { name: "asc" },
    select: { name: true },
  });
  return skills.map((s) => s.name);
}
