import { getOrganizationContext } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { DataTable } from "@/components/app/DataTable";
import { StatCard } from "@/components/app/StatCard";
import { AddQuantityButton } from "@/components/app/AddQuantityButton";
import {
  EquipmentForm,
  EquipmentAllocationForm,
  DeleteButton,
  ReleaseAllocationButton,
} from "@/components/app/ModuleForms";
import { getInStock, getOutQuantitiesByEquipment } from "@/lib/services/equipment-inventory";
import { Package, CheckCircle, Truck } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

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
    return { ...item, outQuantity, inStock };
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
        {equipment.length > 0 && (
          <EquipmentAllocationForm equipment={pickerEquipment} jobs={jobs.map((j) => ({ id: j.id, title: j.title }))} />
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Total Units" value={totalUnits} icon={Package} />
        <StatCard title="In Stock" value={totalInStock} icon={CheckCircle} />
        <StatCard title="Out on Jobs" value={totalOut} icon={Truck} />
      </div>

      <DataTable
        data={equipmentRows}
        emptyMessage="No equipment added yet. Add your first item to get started."
        columns={[
          { key: "name", header: "Equipment" },
          { key: "sku", header: "SKU" },
          { key: "category", header: "Category" },
          { key: "totalQuantity", header: "Total" },
          { key: "inStock", header: "In Stock" },
          { key: "outQuantity", header: "Out on Jobs" },
          {
            key: "allocations",
            header: "Allocated to",
            render: (row) => {
              const allocations = row.allocations as Array<{
                id: string;
                quantity: number;
                startDate: Date;
                job?: {
                  title: string;
                  project?: { client?: { name: string } | null } | null;
                  assignments?: Array<{
                    staffProfile?: { name: string } | null;
                    freelancerProfile?: { name: string } | null;
                  }>;
                } | null;
              }>;

              if (allocations.length === 0) {
                return <span className="text-muted-foreground">—</span>;
              }

              return (
                <div className="space-y-2 text-sm">
                  {allocations.map((allocation) => {
                    const job = allocation.job;
                    const assignee =
                      job?.assignments?.[0]?.staffProfile?.name ??
                      job?.assignments?.[0]?.freelancerProfile?.name;
                    return (
                      <div key={allocation.id} className="border-b pb-2 last:border-0">
                        <p className="font-medium">
                          {allocation.quantity}× {job?.title ?? "Unassigned job"}
                        </p>
                        {assignee && (
                          <p className="text-xs text-muted-foreground">With: {assignee}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            },
          },
          {
            key: "dailyRate",
            header: "Daily Rate",
            render: (row) => (row.dailyRate ? formatCurrency(row.dailyRate as number) : "—"),
          },
          {
            key: "id",
            header: "Actions",
            render: (row) => {
              const allocations = row.allocations as Array<{ id: string }>;
              return (
                <div className="flex flex-wrap gap-2">
                  <AddQuantityButton equipmentId={row.id as string} />
                  {allocations.map((allocation) => (
                    <ReleaseAllocationButton key={allocation.id} allocationId={allocation.id} />
                  ))}
                  <DeleteButton endpoint={`/api/equipment/${row.id as string}`} />
                </div>
              );
            },
          },
        ]}
      />
    </div>
  );
}
