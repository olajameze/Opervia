import { describe, it, expect } from "vitest";
import { getInStock, getComputedStatus } from "@/lib/services/equipment-inventory";

describe("equipment inventory", () => {
  it("calculates in stock from total minus out quantity", () => {
    expect(getInStock({ totalQuantity: 100 }, 86)).toBe(14);
    expect(getInStock({ totalQuantity: 125 }, 86)).toBe(39);
  });

  it("computes available status when stock remains", () => {
    expect(getComputedStatus({ totalQuantity: 10, status: "AVAILABLE" }, 3)).toBe("AVAILABLE");
  });

  it("computes rented status when fully allocated", () => {
    expect(getComputedStatus({ totalQuantity: 10, status: "AVAILABLE" }, 10)).toBe("RENTED");
  });

  it("preserves maintenance and retired statuses", () => {
    expect(getComputedStatus({ totalQuantity: 10, status: "MAINTENANCE" }, 0)).toBe("MAINTENANCE");
    expect(getComputedStatus({ totalQuantity: 10, status: "RETIRED" }, 0)).toBe("RETIRED");
  });
});
