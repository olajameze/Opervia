export type SyncSnapshot = {
  syncedAt: string;
  organizationId: string;
  jobs: Array<{
    id: string;
    title: string;
    description: string | null;
    location: string | null;
    status: string;
    priority: string;
    scheduledAt: string | null;
    startsAt: string | null;
    endsAt: string | null;
    projectId: string | null;
    project?: { id: string; name: string } | null;
    assignments?: Array<{
      id: string;
      staffProfile?: { id: string; name: string } | null;
      freelancerProfile?: { id: string; name: string } | null;
    }>;
  }>;
  shifts: Array<{
    id: string;
    startTime: string;
    endTime: string;
    notes: string | null;
    staffProfile?: { id: string; name: string } | null;
  }>;
  projects: Array<{ id: string; name: string; clientId: string | null }>;
  clients: Array<{ id: string; name: string; email: string | null; phone: string | null; notes: string | null }>;
  staff: Array<{ id: string; name: string; email: string | null; skills: string | null }>;
  freelancers: Array<{ id: string; name: string; email: string | null; skills: string | null }>;
  assignments: Array<{
    id: string;
    jobId: string;
    staffProfileId: string | null;
    freelancerProfileId: string | null;
  }>;
  equipment: Array<{
    id: string;
    name: string;
    sku: string | null;
    category: string | null;
    status: string;
    dailyRate: number | null;
  }>;
  allocations: Array<{
    id: string;
    equipmentId: string;
    jobId: string | null;
    startDate: string;
    endDate: string | null;
    equipment?: { id: string; name: string };
    job?: { id: string; title: string } | null;
  }>;
  logistics: Array<{
    id: string;
    jobId: string;
    status: string;
    location: string | null;
    notes: string | null;
    job?: { id: string; title: string };
  }>;
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    type: string;
    read: boolean;
    createdAt: string;
  }>;
  stats: {
    activeJobs: number;
    staffCount: number;
    equipmentRented: number;
    unassignedJobs: number;
  };
};

export type QueuedMutation = {
  id: string;
  method: string;
  url: string;
  body: string | null;
  createdAt: string;
  idempotencyKey: string;
};

export type OfflineMeta = {
  lastSyncedAt: string | null;
  organizationId: string | null;
};

export const PWA_INSTALL_DISMISSED_SESSION_KEY = "opervia:pwa-install-dismissed-session";
export const PWA_SYNC_EVENT = "opervia:pwa-sync";
