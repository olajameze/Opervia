"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { offlineFetch } from "@/lib/pwa/offline-fetch";
import { SkillPicker } from "@/components/app/SkillPicker";
import { EquipmentPicker, type EquipmentOption } from "@/components/app/EquipmentPicker";

export function DeleteButton({
  endpoint,
  label = "Delete",
}: {
  endpoint: string;
  label?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this item?")) return;
    setLoading(true);
    const res = await offlineFetch(endpoint, { method: "DELETE" });
    setLoading(false);
    if (res.ok || res.status === 202) router.refresh();
    else alert("Delete failed");
  }

  return (
    <Button variant="destructive" size="sm" onClick={handleDelete} disabled={loading}>
      {loading ? "Deleting..." : label}
    </Button>
  );
}

export function ReleaseAllocationButton({ allocationId }: { allocationId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRelease() {
    if (!confirm("Release this equipment allocation?")) return;
    setLoading(true);
    const res = await offlineFetch(`/api/allocations/${allocationId}`, { method: "PATCH" });
    setLoading(false);
    if (res.ok || res.status === 202) router.refresh();
    else alert("Release failed");
  }

  return (
    <Button variant="outline" size="sm" onClick={handleRelease} disabled={loading}>
      {loading ? "Releasing..." : "Release"}
    </Button>
  );
}

function FormCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border p-4 space-y-4 bg-card">
      <h3 className="font-semibold text-sm">{title}</h3>
      {children}
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  options,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      {options ? (
        <select
          id={name}
          name={name}
          required={required}
          aria-label={label}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          required={required}
          placeholder={placeholder}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      )}
    </div>
  );
}

function useResourceForm(endpoint: string) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(form: HTMLFormElement, method: "POST" | "PATCH" = "POST") {
    setLoading(true);
    setError("");
    const formData = new FormData(form);
    const body: Record<string, string> = {};
    formData.forEach((value, key) => {
      body[key] = String(value);
    });

    const res = await offlineFetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setLoading(false);
    if (!res.ok && res.status !== 202) {
      const data = await res.json();
      setError(data.error ?? "Save failed");
      return;
    }

    form.reset();
    router.refresh();
  }

  return { loading, error, submit };
}

export function EquipmentForm() {
  const { loading, error, submit } = useResourceForm("/api/equipment");

  return (
    <FormCard title="Add equipment">
      <form
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          submit(e.currentTarget);
        }}
      >
        <Field label="Name" name="name" required placeholder="Scissor Lift 8m" />
        <Field label="Quantity" name="totalQuantity" type="number" placeholder="1" />
        <Field label="SKU" name="sku" placeholder="SL-008" />
        <Field label="Category" name="category" placeholder="Lifts" />
        <Field label="Daily rate (£)" name="dailyRate" type="number" placeholder="85" />
        {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
        <Button type="submit" disabled={loading} className="sm:col-span-2 w-fit">
          {loading ? "Saving..." : "Add equipment"}
        </Button>
      </form>
    </FormCard>
  );
}

export function StaffForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await offlineFetch("/api/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, location, skills }),
    });
    setLoading(false);
    if (!res.ok && res.status !== 202) {
      const data = await res.json();
      setError(data.error ?? "Save failed");
      return;
    }
    setName("");
    setEmail("");
    setPhone("");
    setLocation("");
    setSkills([]);
    router.refresh();
  }

  return (
    <FormCard title="Add staff member">
      <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => void handleSubmit(e)}>
        <div className="space-y-1">
          <label htmlFor="staff-name" className="text-sm font-medium">Name</label>
          <input id="staff-name" value={name} onChange={(e) => setName(e.target.value)} required className="flex h-10 w-full rounded-md border px-3 text-sm" />
        </div>
        <div className="space-y-1">
          <label htmlFor="staff-email" className="text-sm font-medium">Email</label>
          <input id="staff-email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="flex h-10 w-full rounded-md border px-3 text-sm" />
        </div>
        <div className="space-y-1">
          <label htmlFor="staff-phone" className="text-sm font-medium">Phone</label>
          <input id="staff-phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="flex h-10 w-full rounded-md border px-3 text-sm" />
        </div>
        <div className="space-y-1">
          <label htmlFor="staff-location" className="text-sm font-medium">Location</label>
          <input id="staff-location" value={location} onChange={(e) => setLocation(e.target.value)} className="flex h-10 w-full rounded-md border px-3 text-sm" />
        </div>
        <SkillPicker value={skills} onChange={setSkills} />
        {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
        <Button type="submit" disabled={loading} className="sm:col-span-2 w-fit">
          {loading ? "Saving..." : "Add staff member"}
        </Button>
      </form>
    </FormCard>
  );
}

export function FreelancerForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [dayRate, setDayRate] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await offlineFetch("/api/freelancers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        phone,
        location,
        skills,
        dayRate: dayRate ? Number(dayRate) : undefined,
      }),
    });
    setLoading(false);
    if (!res.ok && res.status !== 202) {
      const data = await res.json();
      setError(data.error ?? "Save failed");
      return;
    }
    setName("");
    setEmail("");
    setPhone("");
    setLocation("");
    setDayRate("");
    setSkills([]);
    router.refresh();
  }

  return (
    <FormCard title="Add freelancer">
      <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => void handleSubmit(e)}>
        <div className="space-y-1">
          <label htmlFor="freelancer-name" className="text-sm font-medium">Name</label>
          <input id="freelancer-name" value={name} onChange={(e) => setName(e.target.value)} required className="flex h-10 w-full rounded-md border px-3 text-sm" />
        </div>
        <div className="space-y-1">
          <label htmlFor="freelancer-email" className="text-sm font-medium">Email</label>
          <input id="freelancer-email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="flex h-10 w-full rounded-md border px-3 text-sm" />
        </div>
        <div className="space-y-1">
          <label htmlFor="freelancer-phone" className="text-sm font-medium">Phone</label>
          <input id="freelancer-phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="flex h-10 w-full rounded-md border px-3 text-sm" />
        </div>
        <div className="space-y-1">
          <label htmlFor="freelancer-location" className="text-sm font-medium">Location</label>
          <input id="freelancer-location" value={location} onChange={(e) => setLocation(e.target.value)} className="flex h-10 w-full rounded-md border px-3 text-sm" />
        </div>
        <div className="space-y-1">
          <label htmlFor="freelancer-dayRate" className="text-sm font-medium">Day rate (£/12hr day)</label>
          <input id="freelancer-dayRate" value={dayRate} onChange={(e) => setDayRate(e.target.value)} type="number" className="flex h-10 w-full rounded-md border px-3 text-sm" />
        </div>
        <SkillPicker value={skills} onChange={setSkills} />
        {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
        <Button type="submit" disabled={loading} className="sm:col-span-2 w-fit">
          {loading ? "Saving..." : "Add freelancer"}
        </Button>
      </form>
    </FormCard>
  );
}

export function JobForm({ projects }: { projects: { id: string; name: string }[] }) {
  const { loading, error, submit } = useResourceForm("/api/jobs");

  return (
    <FormCard title="Create job">
      <form
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          submit(e.currentTarget);
        }}
      >
        <Field label="Title" name="title" required />
        <Field label="Location" name="location" />
        <Field
          label="Project"
          name="projectId"
          options={[
            { value: "", label: "No project" },
            ...projects.map((p) => ({ value: p.id, label: p.name })),
          ]}
        />
        <Field
          label="Priority"
          name="priority"
          options={[
            { value: "LOW", label: "Low" },
            { value: "MEDIUM", label: "Medium" },
            { value: "HIGH", label: "High" },
            { value: "URGENT", label: "Urgent" },
          ]}
        />
        <Field label="Scheduled at" name="scheduledAt" type="datetime-local" />
        <Field
          label="Status"
          name="status"
          options={[
            { value: "DRAFT", label: "Draft" },
            { value: "SCHEDULED", label: "Scheduled" },
            { value: "DISPATCHED", label: "Dispatched" },
            { value: "IN_PROGRESS", label: "In progress" },
            { value: "COMPLETED", label: "Completed" },
          ]}
        />
        <Field label="Description" name="description" placeholder="Job details" />
        {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
        <Button type="submit" disabled={loading} className="sm:col-span-2 w-fit">
          {loading ? "Saving..." : "Create job"}
        </Button>
      </form>
    </FormCard>
  );
}

export function ShiftForm({
  staff,
}: {
  staff: { id: string; name: string }[];
}) {
  const { loading, error, submit } = useResourceForm("/api/shifts");

  return (
    <FormCard title="Schedule shift">
      <form
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          submit(e.currentTarget);
        }}
      >
        <Field
          label="Staff member"
          name="staffProfileId"
          required
          options={staff.map((s) => ({ value: s.id, label: s.name }))}
        />
        <Field label="Start" name="startTime" type="datetime-local" required />
        <Field label="End" name="endTime" type="datetime-local" required />
        <Field label="Notes" name="notes" />
        {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
        <Button type="submit" disabled={loading} className="sm:col-span-2 w-fit">
          {loading ? "Saving..." : "Schedule shift"}
        </Button>
      </form>
    </FormCard>
  );
}

export function LogisticsForm({ jobs }: { jobs: { id: string; title: string }[] }) {
  const { loading, error, submit } = useResourceForm("/api/logistics");

  return (
    <FormCard title="Track logistics event">
      <form
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          submit(e.currentTarget);
        }}
      >
        <Field
          label="Job"
          name="jobId"
          required
          options={jobs.map((j) => ({ value: j.id, label: j.title }))}
        />
        <Field
          label="Status"
          name="status"
          options={[
            { value: "PLANNED", label: "Planned" },
            { value: "DISPATCHED", label: "Dispatched" },
            { value: "IN_TRANSIT", label: "In transit" },
            { value: "DELIVERED", label: "Delivered" },
            { value: "DELAYED", label: "Delayed" },
            { value: "COMPLETED", label: "Completed" },
          ]}
        />
        <Field label="Location" name="location" />
        <Field label="Notes" name="notes" />
        {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
        <Button type="submit" disabled={loading} className="sm:col-span-2 w-fit">
          {loading ? "Saving..." : "Add event"}
        </Button>
      </form>
    </FormCard>
  );
}

export function InvoiceForm() {
  const { loading, error, submit } = useResourceForm("/api/invoices");

  return (
    <FormCard title="Create invoice">
      <form
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          submit(e.currentTarget);
        }}
      >
        <Field label="Invoice number" name="number" required placeholder="INV-001" />
        <Field label="Amount (£)" name="amount" type="number" required />
        <Field label="Due date" name="dueDate" type="date" />
        <Field
          label="Status"
          name="status"
          options={[
            { value: "DRAFT", label: "Draft" },
            { value: "SENT", label: "Sent" },
            { value: "PAID", label: "Paid" },
            { value: "OVERDUE", label: "Overdue" },
          ]}
        />
        {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
        <Button type="submit" disabled={loading} className="sm:col-span-2 w-fit">
          {loading ? "Saving..." : "Create invoice"}
        </Button>
      </form>
    </FormCard>
  );
}

export function PaymentForm({
  invoices,
}: {
  invoices: { id: string; number: string; amount: number }[];
}) {
  const { loading, error, submit } = useResourceForm("/api/payments");

  if (invoices.length === 0) return null;

  return (
    <FormCard title="Record payment">
      <form
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          submit(e.currentTarget);
        }}
      >
        <Field
          label="Invoice"
          name="invoiceId"
          required
          options={invoices.map((invoice) => ({
            value: invoice.id,
            label: `${invoice.number} (£${invoice.amount})`,
          }))}
        />
        <Field label="Amount (£)" name="amount" type="number" required />
        {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
        <Button type="submit" disabled={loading} className="sm:col-span-2 w-fit">
          {loading ? "Saving..." : "Record payment"}
        </Button>
      </form>
    </FormCard>
  );
}

export function WorkflowForm() {
  const { loading, error, submit } = useResourceForm("/api/workflows");

  return (
    <FormCard title="Add automation rule">
      <form
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          submit(e.currentTarget);
        }}
      >
        <Field label="Rule name" name="name" required />
        <Field
          label="Trigger"
          name="trigger"
          required
          options={[
            { value: "JOB_UNASSIGNED", label: "Unassigned jobs" },
            { value: "EQUIPMENT_LOW", label: "Low equipment availability" },
            { value: "INVOICE_OVERDUE", label: "Overdue invoices" },
            { value: "LOGISTICS_DELAYED", label: "Logistics delays" },
            { value: "SHIFT_CONFLICT", label: "Shift conflicts" },
          ]}
        />
        {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
        <Button type="submit" disabled={loading} className="sm:col-span-2 w-fit">
          {loading ? "Saving..." : "Add rule"}
        </Button>
      </form>
    </FormCard>
  );
}

export function OrganizationSettingsForm({ name }: { name: string }) {
  const { loading, error, submit } = useResourceForm("/api/organization");

  return (
    <FormCard title="Update organization">
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          submit(e.currentTarget, "PATCH");
        }}
      >
        <Field label="Organization name" name="name" required placeholder={name} />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save changes"}
        </Button>
      </form>
    </FormCard>
  );
}

export function WorkflowToggle({
  id,
  enabled,
}: {
  id: string;
  enabled: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    await offlineFetch(`/api/workflows/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !enabled }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <Button variant="outline" size="sm" onClick={toggle} disabled={loading}>
      {enabled ? "Disable" : "Enable"}
    </Button>
  );
}

export function StatusSelect({
  endpoint,
  field,
  value,
  options,
  label,
}: {
  endpoint: string;
  field: string;
  value: string;
  options: { value: string; label: string }[];
  label: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const selectId = useId();
  const accessibleLabel = label || `Change ${field}`;

  async function handleChange(nextValue: string) {
    setLoading(true);
    await offlineFetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: nextValue }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <>
      <label htmlFor={selectId} className="sr-only">
        {accessibleLabel}
      </label>
      <select
        id={selectId}
        value={value}
        disabled={loading}
        aria-label={accessibleLabel}
        onChange={(e) => handleChange(e.target.value)}
        className="h-8 rounded-md border border-input bg-background px-2 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </>
  );
}

export function ClientForm() {
  const { loading, error, submit } = useResourceForm("/api/clients");

  return (
    <FormCard title="Add client">
      <form
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          submit(e.currentTarget);
        }}
      >
        <Field label="Client name" name="name" required />
        <Field label="Email" name="email" type="email" />
        <Field label="Phone" name="phone" />
        {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
        <Button type="submit" disabled={loading} className="sm:col-span-2 w-fit">
          {loading ? "Saving..." : "Add client"}
        </Button>
      </form>
    </FormCard>
  );
}

export function ProjectForm({
  clients,
}: {
  clients: { id: string; name: string }[];
}) {
  const { loading, error, submit } = useResourceForm("/api/projects");

  return (
    <FormCard title="Add project">
      <form
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          submit(e.currentTarget);
        }}
      >
        <Field label="Project name" name="name" required />
        <Field
          label="Client"
          name="clientId"
          options={[
            { value: "", label: "No client" },
            ...clients.map((c) => ({ value: c.id, label: c.name })),
          ]}
        />
        <Field label="Description" name="description" />
        {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
        <Button type="submit" disabled={loading} className="sm:col-span-2 w-fit">
          {loading ? "Saving..." : "Add project"}
        </Button>
      </form>
    </FormCard>
  );
}

export function JobAssignForm({
  jobs,
  staff,
  freelancers,
}: {
  jobs: { id: string; title: string }[];
  staff: { id: string; name: string }[];
  freelancers: { id: string; name: string }[];
}) {
  const { loading, error, submit } = useResourceForm("/api/assignments");

  return (
    <FormCard title="Assign staff to job">
      <form
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          submit(e.currentTarget);
        }}
      >
        <Field
          label="Job"
          name="jobId"
          required
          options={jobs.map((j) => ({ value: j.id, label: j.title }))}
        />
        <Field
          label="Staff member"
          name="staffProfileId"
          options={[
            { value: "", label: "None" },
            ...staff.map((s) => ({ value: s.id, label: s.name })),
          ]}
        />
        <Field
          label="Freelancer"
          name="freelancerProfileId"
          options={[
            { value: "", label: "None" },
            ...freelancers.map((f) => ({ value: f.id, label: f.name })),
          ]}
        />
        {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
        <Button type="submit" disabled={loading} className="sm:col-span-2 w-fit">
          {loading ? "Saving..." : "Assign to job"}
        </Button>
      </form>
    </FormCard>
  );
}

export function EquipmentAllocationForm({
  equipment,
  jobs,
}: {
  equipment: EquipmentOption[];
  jobs: { id: string; title: string }[];
}) {
  const { loading, error, submit } = useResourceForm("/api/allocations");

  return (
    <FormCard title="Allocate equipment">
      <form
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          submit(e.currentTarget);
        }}
      >
        <EquipmentPicker equipment={equipment} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:col-span-2">
          <Field label="Quantity" name="quantity" type="number" placeholder="1" required />
          <Field
            label="Job"
            name="jobId"
            options={[
              { value: "", label: "No job" },
              ...jobs.map((j) => ({ value: j.id, label: j.title })),
            ]}
          />
          <Field label="Start date" name="startDate" type="date" required />
          <Field label="End date" name="endDate" type="date" />
        </div>
        {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
        <Button type="submit" disabled={loading} className="sm:col-span-2 w-fit">
          {loading ? "Saving..." : "Allocate equipment"}
        </Button>
      </form>
    </FormCard>
  );
}
