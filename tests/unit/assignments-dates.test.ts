import { describe, it, expect } from "vitest";
import { resolveJobDates } from "@/lib/services/assignments";

describe("resolveJobDates", () => {
  it("maps startsAt and endsAt", () => {
    const result = resolveJobDates({
      startsAt: "2026-06-01",
      endsAt: "2026-06-05",
    });
    expect(result.startsAt).toEqual(new Date("2026-06-01"));
    expect(result.endsAt).toEqual(new Date("2026-06-05"));
    expect(result.scheduledAt).toEqual(result.startsAt);
  });

  it("falls back scheduledAt to startsAt", () => {
    const result = resolveJobDates({ scheduledAt: "2026-07-01T10:00:00.000Z" });
    expect(result.startsAt).toEqual(new Date("2026-07-01T10:00:00.000Z"));
    expect(result.endsAt).toEqual(result.startsAt);
  });
});
