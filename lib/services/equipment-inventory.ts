import { prisma } from "@/lib/db";
import type { Equipment, EquipmentStatus } from "@prisma/client";

export async function getOutQuantity(equipmentId: string): Promise<number> {
  const result = await prisma.equipmentAllocation.aggregate({
    where: { equipmentId, endDate: null },
    _sum: { quantity: true },
  });
  return result._sum.quantity ?? 0;
}

export async function getOutQuantitiesByEquipment(
  equipmentIds: string[]
): Promise<Map<string, number>> {
  if (equipmentIds.length === 0) return new Map();

  const allocations = await prisma.equipmentAllocation.groupBy({
    by: ["equipmentId"],
    where: { equipmentId: { in: equipmentIds }, endDate: null },
    _sum: { quantity: true },
  });

  return new Map(
    allocations.map((row) => [row.equipmentId, row._sum.quantity ?? 0])
  );
}

export function getInStock(equipment: Pick<Equipment, "totalQuantity">, outQuantity: number): number {
  return Math.max(0, equipment.totalQuantity - outQuantity);
}

export function getComputedStatus(
  equipment: Pick<Equipment, "totalQuantity" | "status">,
  outQuantity: number
): EquipmentStatus {
  if (equipment.status === "MAINTENANCE" || equipment.status === "RETIRED") {
    return equipment.status;
  }
  const inStock = getInStock(equipment, outQuantity);
  if (inStock > 0) return "AVAILABLE";
  return "RENTED";
}

export async function syncEquipmentStatus(equipmentId: string): Promise<EquipmentStatus> {
  const equipment = await prisma.equipment.findUniqueOrThrow({ where: { id: equipmentId } });
  const outQuantity = await getOutQuantity(equipmentId);
  const status = getComputedStatus(equipment, outQuantity);
  if (status !== equipment.status) {
    await prisma.equipment.update({
      where: { id: equipmentId },
      data: { status },
    });
  }
  return status;
}

export function normalizeEquipmentName(name: string): string {
  return name.trim().toLowerCase();
}
