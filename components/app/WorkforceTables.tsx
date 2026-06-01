"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/app/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/app/ModuleForms";
import { SkillPicker } from "@/components/app/SkillPicker";
import { formatCurrency } from "@/lib/utils";
import { offlineFetch } from "@/lib/pwa/offline-fetch";
import { WorkforceDocumentUpload } from "@/components/app/WorkforceDocumentUpload";

type DocumentItem = {
  id: string;
  label: string;
  fileName: string;
  blobUrl: string;
};

type StaffRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  location: string | null;
  skills: string[];
  documents?: DocumentItem[];
};

type FreelancerRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  location: string | null;
  skills: string[];
  dayRate: number | null;
  documents?: DocumentItem[];
};

function SearchInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex h-10 w-full max-w-md rounded-md border border-input bg-background px-3 text-sm"
      />
    </div>
  );
}

function filterRows<T extends { name: string; email: string | null; skills: string[]; phone?: string | null; location?: string | null }>(
  rows: T[],
  query: string
): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((row) => {
    const haystack = [row.name, row.email ?? "", row.phone ?? "", row.location ?? "", ...row.skills]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

function EditStaffDialog({
  row,
  onClose,
  uploadsConfigured,
}: {
  row: StaffRow;
  onClose: () => void;
  uploadsConfigured: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState(row.name);
  const [email, setEmail] = useState(row.email ?? "");
  const [phone, setPhone] = useState(row.phone ?? "");
  const [location, setLocation] = useState(row.location ?? "");
  const [skills, setSkills] = useState(row.skills);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setLoading(true);
    setError("");
    const res = await offlineFetch(`/api/staff/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, location, skills }),
    });
    setLoading(false);
    if (!res.ok && res.status !== 202) {
      const data = await res.json();
      setError(data.error ?? "Update failed");
      return;
    }
    onClose();
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-lg border bg-background p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-semibold">Edit staff member</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-medium">Name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className="flex h-10 w-full rounded-md border px-3" />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Email</span>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="flex h-10 w-full rounded-md border px-3" />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Phone</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="flex h-10 w-full rounded-md border px-3" />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Location</span>
            <input value={location} onChange={(e) => setLocation(e.target.value)} className="flex h-10 w-full rounded-md border px-3" />
          </label>
        </div>
        <SkillPicker value={skills} onChange={setSkills} />
        <WorkforceDocumentUpload
          staffProfileId={row.id}
          documents={row.documents}
          uploadsConfigured={uploadsConfigured}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-2">
          <Button onClick={() => void save()} disabled={loading}>{loading ? "Saving..." : "Save"}</Button>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}

function EditFreelancerDialog({
  row,
  onClose,
  uploadsConfigured,
}: {
  row: FreelancerRow;
  onClose: () => void;
  uploadsConfigured: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState(row.name);
  const [email, setEmail] = useState(row.email ?? "");
  const [phone, setPhone] = useState(row.phone ?? "");
  const [location, setLocation] = useState(row.location ?? "");
  const [skills, setSkills] = useState(row.skills);
  const [dayRate, setDayRate] = useState(row.dayRate?.toString() ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setLoading(true);
    setError("");
    const res = await offlineFetch(`/api/freelancers/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        phone,
        location,
        skills,
        dayRate: dayRate ? Number(dayRate) : null,
      }),
    });
    setLoading(false);
    if (!res.ok && res.status !== 202) {
      const data = await res.json();
      setError(data.error ?? "Update failed");
      return;
    }
    onClose();
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-lg border bg-background p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-semibold">Edit freelancer</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-medium">Name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className="flex h-10 w-full rounded-md border px-3" />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Email</span>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="flex h-10 w-full rounded-md border px-3" />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Phone</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="flex h-10 w-full rounded-md border px-3" />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Location</span>
            <input value={location} onChange={(e) => setLocation(e.target.value)} className="flex h-10 w-full rounded-md border px-3" />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Day rate (£/12hr day)</span>
            <input value={dayRate} onChange={(e) => setDayRate(e.target.value)} type="number" className="flex h-10 w-full rounded-md border px-3" />
          </label>
        </div>
        <SkillPicker value={skills} onChange={setSkills} />
        <WorkforceDocumentUpload
          freelancerProfileId={row.id}
          documents={row.documents}
          uploadsConfigured={uploadsConfigured}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-2">
          <Button onClick={() => void save()} disabled={loading}>{loading ? "Saving..." : "Save"}</Button>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}

export function WorkforceTables({
  staff,
  freelancers,
  uploadsConfigured,
}: {
  staff: StaffRow[];
  freelancers: FreelancerRow[];
  uploadsConfigured: boolean;
}) {
  const [staffQuery, setStaffQuery] = useState("");
  const [freelancerQuery, setFreelancerQuery] = useState("");
  const [editStaff, setEditStaff] = useState<StaffRow | null>(null);
  const [editFreelancer, setEditFreelancer] = useState<FreelancerRow | null>(null);

  const filteredStaff = useMemo(() => filterRows(staff, staffQuery), [staff, staffQuery]);
  const filteredFreelancers = useMemo(
    () => filterRows(freelancers, freelancerQuery),
    [freelancers, freelancerQuery]
  );

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-lg font-semibold">Staff</h2>
          <SearchInput
            label="Search staff"
            value={staffQuery}
            onChange={setStaffQuery}
            placeholder="Name, email, phone, location, or skill"
          />
        </div>
        <DataTable
          data={filteredStaff}
          emptyMessage="No staff profiles yet."
          columns={[
            { key: "name", header: "Name" },
            { key: "email", header: "Email" },
            { key: "phone", header: "Phone" },
            { key: "location", header: "Location" },
            {
              key: "skills",
              header: "Skills",
              render: (row) => (
                <div className="flex flex-wrap gap-1">
                  {(row.skills as string[]).slice(0, 3).map((s) => (
                    <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                  ))}
                </div>
              ),
            },
            {
              key: "id",
              header: "Actions",
              render: (row) => (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditStaff(row as StaffRow)}>Edit</Button>
                  <DeleteButton endpoint={`/api/staff/${row.id as string}`} />
                </div>
              ),
            },
          ]}
        />
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-lg font-semibold">Freelancers</h2>
          <SearchInput
            label="Search freelancers"
            value={freelancerQuery}
            onChange={setFreelancerQuery}
            placeholder="Name, email, phone, location, or skill"
          />
        </div>
        <DataTable
          data={filteredFreelancers}
          emptyMessage="No freelancer profiles yet."
          columns={[
            { key: "name", header: "Name" },
            { key: "email", header: "Email" },
            { key: "phone", header: "Phone" },
            { key: "location", header: "Location" },
            {
              key: "skills",
              header: "Skills",
              render: (row) => (
                <div className="flex flex-wrap gap-1">
                  {(row.skills as string[]).slice(0, 3).map((s) => (
                    <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                  ))}
                </div>
              ),
            },
            {
              key: "dayRate",
              header: "Day rate",
              render: (row) =>
                row.dayRate ? formatCurrency(row.dayRate as number) + "/day" : "—",
            },
            {
              key: "id",
              header: "Actions",
              render: (row) => (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditFreelancer(row as FreelancerRow)}>Edit</Button>
                  <DeleteButton endpoint={`/api/freelancers/${row.id as string}`} />
                </div>
              ),
            },
          ]}
        />
      </div>

      {editStaff && (
        <EditStaffDialog
          row={editStaff}
          onClose={() => setEditStaff(null)}
          uploadsConfigured={uploadsConfigured}
        />
      )}
      {editFreelancer && (
        <EditFreelancerDialog
          row={editFreelancer}
          onClose={() => setEditFreelancer(null)}
          uploadsConfigured={uploadsConfigured}
        />
      )}
    </>
  );
}
