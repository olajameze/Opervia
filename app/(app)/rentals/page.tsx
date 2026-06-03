import { getOrganizationContext } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { DataImportPanel } from "@/components/app/DataImportPanel";
import { RentalsEquipmentTable } from "@/components/app/RentalsEquipmentTable";
import { StatCard } from "@/components/app/StatCard";
import {
  EquipmentForm,
  EquipmentAllocationForm,
} from "@/components/app/ModuleForms";
import { getInStock, getOutQuantitiesByEquipment } from "@/lib/services/equipment-inventory";
import { Package, CheckCircle, Truck } from "lucide-react";
export default async function RentalsPage() {
  const { organization } = await getOrganizationContext();

  const [equipment, jobs] = await Promise.all([
    prisma.equipment.findMany({
      where: { organizationId: organization.id },
      orderBy: { name: "asc" },
      include: {
        allocations: {
          where: { endDate: null },
          include: {
            job: {
              include: {
                project: { include: { client: true } },
                assignments: {
                  include: { staffProfile: true, freelancerProfile: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
    }),
    prisma.job.findMany({
      where: { organizationId: organization.id },
      orderBy: { title: "asc" },
    }),
  ]);

  const outMap = await getOutQuantitiesByEquipment(equipment.map((e) => e.id));

  const equipmentRows = equipment.map((item) => {
    const outQuantity = outMap.get(item.id) ?? 0;
    const inStock = getInStock(item, outQuantity);
    return {
      id: item.id,
      name: item.name,
      sku: item.sku,
      category: item.category,
      totalQuantity: item.totalQuantity,
      dailyRate: item.dailyRate,
      outQuantity,
      inStock,
      allocations: item.allocations.map((allocation) => ({
        id: allocation.id,
        quantity: allocation.quantity,
        job: allocation.job
          ? {
              title: allocation.job.title,
              assignments: allocation.job.assignments.map((a) => ({
                staffProfile: a.staffProfile ? { name: a.staffProfile.name } : null,
                freelancerProfile: a.freelancerProfile
                  ? { name: a.freelancerProfile.name }
                  : null,
              })),
            }
          : null,
      })),
    };
  });

  const totalInStock = equipmentRows.reduce((sum, item) => sum + item.inStock, 0);
  const totalOut = equipmentRows.reduce((sum, item) => sum + item.outQuantity, 0);
  const totalUnits = equipmentRows.reduce((sum, item) => sum + item.totalQuantity, 0);

  const pickerEquipment = equipmentRows.map((item) => ({
    id: item.id,
    name: item.name,
    sku: item.sku,
    category: item.category,
    inStock: item.inStock,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Equipment Rentals</h1>
        <p className="text-muted-foreground">
          Manage inventory quantities, allocations, and stock levels.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <EquipmentForm />
      </div>

      {equipment.length > 0 && (
        <div className="max-w-xl">
          <EquipmentAllocationForm
            equipment={pickerEquipment}
            jobs={jobs.map((j) => ({ id: j.id, title: j.title }))}
          />
        </div>
      )}

      <DataImportPanel allowedResources={["equipment"]} compact />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Total Units" value={totalUnits} icon={Package} />
        <StatCard title="In Stock" value={totalInStock} icon={CheckCircle} />
        <StatCard title="Out on Jobs" value={totalOut} icon={Truck} />
      </div>

      <RentalsEquipmentTable rows={equipmentRows} />
    </div>
  );
}
