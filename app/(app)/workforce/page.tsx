import { getOrganizationContext } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { StatCard } from "@/components/app/StatCard";
import { StaffForm, FreelancerForm } from "@/components/app/ModuleForms";
import { WorkforceTables } from "@/components/app/WorkforceTables";
import { DataImportPanel } from "@/components/app/DataImportPanel";
import { formatStaffLimit, formatFreelancerLimit } from "@/lib/entitlements";
import { ensureDefaultSkills } from "@/lib/services/skills";
import { isWorkforceUploadConfigured } from "@/lib/blob-config";
import { Users, UserCheck } from "lucide-react";

export default async function WorkforcePage() {
  const { organization } = await getOrganizationContext();
  await ensureDefaultSkills(organization.id);

  const staffLimitLabel = formatStaffLimit(organization);
  const freelancerLimitLabel = formatFreelancerLimit(organization);

  const [staff, freelancers] = await Promise.all([
    prisma.staffProfile.findMany({
      where: { organizationId: organization.id },
      orderBy: { name: "asc" },
      include: { documents: true },
    }),
    prisma.freelancerProfile.findMany({
      where: { organizationId: organization.id },
      orderBy: { name: "asc" },
      include: { documents: true },
    }),
  ]);

  const uploadsConfigured = isWorkforceUploadConfigured();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Workforce</h1>
        <p className="text-muted-foreground">
          Manage staff ({staff.length}/{staffLimitLabel}) and freelancers ({freelancers.length}/{freelancerLimitLabel}).
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <StaffForm />
        <FreelancerForm />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard title="Staff Members" value={staff.length} icon={Users} />
        <StatCard title="Freelancers" value={freelancers.length} icon={UserCheck} />
      </div>

      <DataImportPanel allowedResources={["staff", "freelancers"]} compact />

      <WorkforceTables staff={staff} freelancers={freelancers} uploadsConfigured={uploadsConfigured} />
    </div>
  );
}
