import { describe, it, expect } from "vitest";
import { importTemplateHeaders } from "@/lib/imports/csv-import";

describe("csv import templates", () => {
  it("includes expected staff headers", () => {
    expect(importTemplateHeaders("staff")).toEqual([
      "name",
      "email",
      "phone",
      "location",
      "skills",
    ]);
  });

  it("includes dayRate for freelancers", () => {
    expect(importTemplateHeaders("freelancers")).toContain("dayRate");
  });

  it("includes totalQuantity for equipment", () => {
    expect(importTemplateHeaders("equipment")).toContain("totalQuantity");
  });
});
