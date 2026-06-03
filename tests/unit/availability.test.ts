import { describe, it, expect, vi, beforeEach } from "vitest";

const prismaMock = {
  availabilityRequest: {
    findUnique: vi.fn(),
  },
  freelancerProfile: {
    findFirst: vi.fn(),
  },
  availabilityResponse: {
    upsert: vi.fn(),
  },
};

const createFreelancerAssignmentMock = vi.fn();

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/lib/services/assignments", () => ({
  createFreelancerAssignment: createFreelancerAssignmentMock,
}));
vi.mock("@/lib/security/rate-limit", () => ({
  ipRateLimit: vi.fn().mockResolvedValue(null),
}));

describe("availability respond API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates assignment when status is AVAILABLE", async () => {
    const future = new Date(Date.now() + 86400000);
    prismaMock.availabilityRequest.findUnique.mockResolvedValue({
      id: "req1",
      jobId: "job1",
      organizationId: "org1",
      expiresAt: future,
    });
    prismaMock.freelancerProfile.findFirst.mockResolvedValue({
      id: "fl1",
      organizationId: "org1",
    });
    prismaMock.availabilityResponse.upsert.mockResolvedValue({
      id: "resp1",
      status: "AVAILABLE",
    });
    createFreelancerAssignmentMock.mockResolvedValue({ id: "assign1" });

    const { POST } = await import("@/app/api/availability/[token]/route");
    const res = await POST(
      new Request("http://localhost/api/availability/abc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ freelancerId: "fl1", status: "AVAILABLE" }),
      }),
      { params: { token: "abc" } }
    );

    expect(res.status).toBe(200);
    expect(createFreelancerAssignmentMock).toHaveBeenCalledWith({
      jobId: "job1",
      freelancerProfileId: "fl1",
      organizationId: "org1",
    });
  });

  it("does not assign when status is UNAVAILABLE", async () => {
    const future = new Date(Date.now() + 86400000);
    prismaMock.availabilityRequest.findUnique.mockResolvedValue({
      id: "req1",
      jobId: "job1",
      organizationId: "org1",
      expiresAt: future,
    });
    prismaMock.freelancerProfile.findFirst.mockResolvedValue({
      id: "fl1",
      organizationId: "org1",
    });
    prismaMock.availabilityResponse.upsert.mockResolvedValue({
      id: "resp1",
      status: "UNAVAILABLE",
    });

    const { POST } = await import("@/app/api/availability/[token]/route");
    await POST(
      new Request("http://localhost/api/availability/abc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ freelancerId: "fl1", status: "UNAVAILABLE" }),
      }),
      { params: { token: "abc" } }
    );

    expect(createFreelancerAssignmentMock).not.toHaveBeenCalled();
  });

  it("returns 404 for expired token", async () => {
    prismaMock.availabilityRequest.findUnique.mockResolvedValue({
      id: "req1",
      expiresAt: new Date(Date.now() - 1000),
    });

    const { POST } = await import("@/app/api/availability/[token]/route");
    const res = await POST(
      new Request("http://localhost/api/availability/abc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ freelancerId: "fl1", status: "AVAILABLE" }),
      }),
      { params: { token: "abc" } }
    );

    expect(res.status).toBe(404);
  });
});
