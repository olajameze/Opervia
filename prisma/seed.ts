import { PrismaClient, Role, WorkflowTrigger } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 12);

  const user = await prisma.user.upsert({
    where: { email: "demo@opervia.com" },
    update: {},
    create: {
      name: "Demo User",
      email: "demo@opervia.com",
      passwordHash,
      emailVerified: new Date(),
    },
  });

  await seedSuperAdmin(passwordHash);

  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 5);

  const org = await prisma.organization.upsert({
    where: { slug: "demo-rentals" },
    update: {},
    create: {
      name: "Demo Rentals Ltd",
      slug: "demo-rentals",
      subscriptionStatus: "TRIALING",
      trialEndsAt,
    },
  });

  await prisma.membership.upsert({
    where: { userId_organizationId: { userId: user.id, organizationId: org.id } },
    update: {},
    create: { userId: user.id, organizationId: org.id, role: Role.OWNER },
  });

  const client = await prisma.client.create({
    data: {
      name: "BuildCo Construction",
      email: "ops@buildco.com",
      organizationId: org.id,
    },
  });

  const project = await prisma.project.create({
    data: {
      name: "City Centre Renovation",
      clientId: client.id,
      organizationId: org.id,
    },
  });

  const equipment = await Promise.all([
    prisma.equipment.create({
      data: { name: "Scissor Lift 8m", sku: "SL-008", category: "Lifts", status: "AVAILABLE", dailyRate: 85, organizationId: org.id },
    }),
    prisma.equipment.create({
      data: { name: "Mini Excavator 1.5T", sku: "EX-015", category: "Earthmoving", status: "RENTED", dailyRate: 120, organizationId: org.id },
    }),
    prisma.equipment.create({
      data: { name: "Generator 20kVA", sku: "GN-020", category: "Power", status: "AVAILABLE", dailyRate: 45, organizationId: org.id },
    }),
  ]);

  const staff = await Promise.all([
    prisma.staffProfile.create({
      data: {
        name: "James O'Brien",
        email: "james@demo-rentals.com",
        skills: ["Equipment Operation", "Safety"],
        certifications: ["CSCS", "IPAF"],
        hourlyRate: 28,
        organizationId: org.id,
      },
    }),
    prisma.staffProfile.create({
      data: {
        name: "Sarah Müller",
        email: "sarah@demo-rentals.com",
        skills: ["Dispatch", "Logistics"],
        hourlyRate: 32,
        organizationId: org.id,
      },
    }),
  ]);

  const freelancer = await prisma.freelancerProfile.create({
    data: {
      name: "Marco Rossi",
      email: "marco@freelance.eu",
      skills: ["Heavy Machinery", "Welding"],
      hourlyRate: 45,
      organizationId: org.id,
    },
  });

  const jobs = await Promise.all([
    prisma.job.create({
      data: {
        title: "Scaffold delivery - Block A",
        status: "SCHEDULED",
        priority: "HIGH",
        scheduledAt: new Date(Date.now() + 86400000),
        location: "Dublin City Centre",
        projectId: project.id,
        organizationId: org.id,
      },
    }),
    prisma.job.create({
      data: {
        title: "Equipment pickup - Site B",
        status: "IN_PROGRESS",
        priority: "MEDIUM",
        location: "Cork Industrial Park",
        projectId: project.id,
        organizationId: org.id,
      },
    }),
    prisma.job.create({
      data: {
        title: "Generator install - Warehouse",
        status: "DISPATCHED",
        priority: "LOW",
        scheduledAt: new Date(Date.now() + 172800000),
        organizationId: org.id,
      },
    }),
  ]);

  await prisma.assignment.create({
    data: { jobId: jobs[0].id, staffProfileId: staff[0].id, organizationId: org.id },
  });

  await prisma.assignment.create({
    data: { jobId: jobs[1].id, freelancerProfileId: freelancer.id, organizationId: org.id },
  });

  await prisma.equipmentAllocation.create({
    data: {
      equipmentId: equipment[1].id,
      jobId: jobs[1].id,
      startDate: new Date(),
      organizationId: org.id,
    },
  });

  const now = new Date();
  await prisma.shift.create({
    data: {
      staffProfileId: staff[0].id,
      startTime: new Date(now.setHours(8, 0, 0, 0)),
      endTime: new Date(now.setHours(17, 0, 0, 0)),
      organizationId: org.id,
    },
  });

  await Promise.all([
    prisma.logisticsEvent.create({
      data: { jobId: jobs[0].id, status: "PLANNED", location: "Depot", organizationId: org.id },
    }),
    prisma.logisticsEvent.create({
      data: { jobId: jobs[1].id, status: "IN_TRANSIT", location: "M50 Junction 12", organizationId: org.id },
    }),
  ]);

  await prisma.invoice.create({
    data: {
      number: "INV-2026-001",
      amount: 2400,
      status: "SENT",
      dueDate: new Date(Date.now() + 1209600000),
      organizationId: org.id,
    },
  });

  await prisma.payment.create({
    data: { amount: 1200, status: "SUCCEEDED", organizationId: org.id },
  });

  const triggers: WorkflowTrigger[] = [
    "JOB_UNASSIGNED",
    "EQUIPMENT_LOW",
    "INVOICE_OVERDUE",
    "LOGISTICS_DELAYED",
  ];

  for (const trigger of triggers) {
    await prisma.workflowRule.upsert({
      where: { id: `${org.id}-${trigger}` },
      update: {},
      create: {
        id: `${org.id}-${trigger}`,
        name: `Auto: ${trigger.replace(/_/g, " ").toLowerCase()}`,
        trigger,
        enabled: true,
        organizationId: org.id,
      },
    });
  }

  console.log("Seed complete:");
  console.log("  Demo email: demo@opervia.com");
  console.log("  Demo password: password123");
  console.log("  Super admin email: opervia@gmail.com  (also: admin@opervia.com)");
  console.log("  Super admin password: password123");
}

async function seedSuperAdmin(passwordHash: string) {
  const admins = [
    { email: "opervia@gmail.com", name: "Opervia Owner" },
    { email: "admin@opervia.com", name: "Opervia Admin" },
  ];

  for (const { email, name } of admins) {
    await prisma.user.upsert({
      where: { email },
      update: { isSuperAdmin: true },
      create: {
        name,
        email,
        passwordHash,
        emailVerified: new Date(),
        isSuperAdmin: true,
      },
    });
  }

  await prisma.systemSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
