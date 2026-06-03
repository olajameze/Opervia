import { getSnapshot, saveSnapshot } from "@/lib/pwa/offline-db";
import { queueMutation } from "@/lib/pwa/sync-queue";
import type { SyncSnapshot } from "@/lib/pwa/types";

function isNetworkFailure(error: unknown) {
  return error instanceof TypeError;
}

function tempId(prefix: string) {
  return `${prefix}-offline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function applyOptimisticPatch(
  snapshot: SyncSnapshot,
  method: string,
  url: string,
  body: Record<string, string> | null
): SyncSnapshot {
  const next: SyncSnapshot = structuredClone(snapshot);

  if (method === "POST" && url === "/api/jobs" && body) {
    next.jobs.unshift({
      id: tempId("job"),
      title: body.title ?? "Offline job",
      description: body.description ?? null,
      location: body.location ?? null,
      status: body.status ?? "DRAFT",
      priority: body.priority ?? "MEDIUM",
      scheduledAt: body.startsAt ?? body.scheduledAt ?? null,
      startsAt: body.startsAt ?? body.scheduledAt ?? null,
      endsAt: body.endsAt ?? body.startsAt ?? body.scheduledAt ?? null,
      projectId: body.projectId || null,
      assignments: [],
    });
    next.stats.activeJobs += 1;
  }

  if (method === "POST" && url === "/api/equipment" && body) {
    next.equipment.unshift({
      id: tempId("equipment"),
      name: body.name ?? "Offline equipment",
      sku: body.sku ?? null,
      category: body.category ?? null,
      status: body.status ?? "AVAILABLE",
      dailyRate: body.dailyRate ? Number(body.dailyRate) : null,
    });
  }

  if (method === "POST" && url === "/api/logistics" && body) {
    const job = next.jobs.find((item) => item.id === body.jobId);
    next.logistics.unshift({
      id: tempId("logistics"),
      jobId: body.jobId,
      status: body.status ?? "PLANNED",
      location: body.location ?? null,
      notes: body.notes ?? null,
      job: job ? { id: job.id, title: job.title } : undefined,
    });
  }

  if (method === "PATCH" && url.includes("/api/jobs/") && body?.status) {
    const id = url.split("/").pop();
    const job = next.jobs.find((item) => item.id === id);
    if (job) job.status = body.status;
  }

  if (method === "PATCH" && url.includes("/api/equipment/") && body?.status) {
    const id = url.split("/").pop();
    const item = next.equipment.find((entry) => entry.id === id);
    if (item) item.status = body.status;
  }

  if (method === "DELETE") {
    const id = url.split("/").pop();
    if (url.includes("/api/jobs/")) {
      next.jobs = next.jobs.filter((item) => item.id !== id);
    }
    if (url.includes("/api/equipment/")) {
      next.equipment = next.equipment.filter((item) => item.id !== id);
    }
    if (url.includes("/api/logistics/")) {
      next.logistics = next.logistics.filter((item) => item.id !== id);
    }
  }

  return next;
}

export async function offlineFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  const method = (init?.method ?? "GET").toUpperCase();
  const bodyText =
    typeof init?.body === "string"
      ? init.body
      : init?.body
        ? JSON.stringify(init.body)
        : null;

  const isMutation = ["POST", "PATCH", "PUT", "DELETE"].includes(method);

  if (isMutation && !navigator.onLine) {
    await queueMutation(method, url, bodyText);

    const snapshot = await getSnapshot();
    if (snapshot && bodyText) {
      try {
        const parsed = JSON.parse(bodyText) as Record<string, string>;
        const patched = applyOptimisticPatch(snapshot, method, url, parsed);
        await saveSnapshot(patched);
      } catch {
        // Keep queued mutation even if optimistic patch fails.
      }
    }

    return new Response(JSON.stringify({ ok: true, queued: true }), {
      status: 202,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const response = await fetch(input, init);
    return response;
  } catch (error) {
    if (isMutation && isNetworkFailure(error)) {
      await queueMutation(method, url, bodyText);

      const snapshot = await getSnapshot();
      if (snapshot && bodyText) {
        try {
          const parsed = JSON.parse(bodyText) as Record<string, string>;
          const patched = applyOptimisticPatch(snapshot, method, url, parsed);
          await saveSnapshot(patched);
        } catch {
          // Ignore optimistic patch errors.
        }
      }

      return new Response(JSON.stringify({ ok: true, queued: true }), {
        status: 202,
        headers: { "Content-Type": "application/json" },
      });
    }

    throw error;
  }
}
