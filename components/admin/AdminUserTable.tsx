"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/app/DataTable";
import { formatDate } from "@/lib/utils";

export type AdminUserRow = {
  id: string;
  name: string | null;
  email: string;
  createdAt: string;
  frozenAt: string | null;
  isSuperAdmin: boolean;
  organizationId: string | null;
  organizationName: string | null;
  subscriptionPlan: string | null;
  subscriptionStatus: string | null;
  orgFrozenAt: string | null;
};

function ActionButton({
  label,
  variant = "outline",
  onClick,
}: {
  label: string;
  variant?: "outline" | "destructive";
  onClick: () => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);

  return (
    <Button
      variant={variant}
      size="sm"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        await onClick();
        setLoading(false);
      }}
    >
      {loading ? "..." : label}
    </Button>
  );
}

export function AdminUserTable({ users }: { users: AdminUserRow[] }) {
  const router = useRouter();

  async function patchUser(id: string, action: string) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (!res.ok) alert("Action failed");
    else router.refresh();
  }

  async function deleteUser(id: string) {
    if (
      !confirm(
        "Permanently delete this user's login? (Their organization, billing and team data are preserved — use 'Delete account' to wipe the whole org.)"
      )
    )
      return;
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    if (!res.ok) alert("Delete failed");
    else router.refresh();
  }

  async function patchOrg(orgId: string, action: string) {
    if (action === "cancel_plan") {
      if (
        !confirm(
          "Cancel this organization's plan and Stripe subscription? They will stop being billed immediately."
        )
      )
        return;
    }
    const res = await fetch(`/api/admin/organizations/${orgId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (!res.ok) alert("Organization action failed");
    else router.refresh();
  }

  async function deleteOrg(orgId: string, orgName: string) {
    if (
      !confirm(
        `PERMANENTLY delete the account "${orgName}"? This cancels any Stripe subscription, wipes ALL their data (clients, jobs, equipment, invoices, staff) and removes every team member. This cannot be undone.`
      )
    )
      return;
    const res = await fetch(`/api/admin/organizations/${orgId}`, {
      method: "DELETE",
    });
    if (!res.ok) alert("Account deletion failed");
    else router.refresh();
  }

  return (
    <DataTable
      data={users}
      emptyMessage="No users found."
      columns={[
        {
          key: "email",
          header: "User",
          render: (row) => (
            <div>
              <p className="font-medium">{String(row.email)}</p>
              <p className="text-xs text-muted-foreground">{String(row.name ?? "—")}</p>
            </div>
          ),
        },
        {
          key: "organizationName",
          header: "Organization",
          render: (row) => String(row.organizationName ?? "No org"),
        },
        {
          key: "subscriptionPlan",
          header: "Plan",
          render: (row) => (
            <Badge variant="outline">{String(row.subscriptionPlan ?? "—")}</Badge>
          ),
        },
        {
          key: "subscriptionStatus",
          header: "Billing",
          render: (row) => {
            const status = String(row.subscriptionStatus ?? "—");
            const overdue = ["PAST_DUE", "UNPAID"].includes(status);
            return (
              <Badge variant={overdue ? "destructive" : "secondary"}>{status}</Badge>
            );
          },
        },
        {
          key: "frozenAt",
          header: "Status",
          render: (row) => {
            if (row.isSuperAdmin) return <Badge>Super Admin</Badge>;
            if (row.frozenAt || row.orgFrozenAt) return <Badge variant="destructive">Frozen</Badge>;
            return <Badge variant="outline">Active</Badge>;
          },
        },
        {
          key: "createdAt",
          header: "Joined",
          render: (row) => formatDate(new Date(String(row.createdAt))),
        },
        {
          key: "id",
          header: "Actions",
          render: (row) => {
            const id = String(row.id);
            const orgId = row.organizationId ? String(row.organizationId) : null;
            const orgName = row.organizationName
              ? String(row.organizationName)
              : "this account";
            const frozen = Boolean(row.frozenAt);

            return (
              <div className="flex flex-wrap gap-1">
                <ActionButton
                  label={frozen ? "Unfreeze" : "Freeze"}
                  onClick={() => patchUser(id, frozen ? "unfreeze" : "freeze")}
                />
                {orgId && (
                  <>
                    <ActionButton
                      label="Cancel plan"
                      onClick={() => patchOrg(orgId, "cancel_plan")}
                    />
                    <ActionButton
                      label={row.orgFrozenAt ? "Unfreeze org" : "Freeze org"}
                      onClick={() =>
                        patchOrg(orgId, row.orgFrozenAt ? "unfreeze" : "freeze")
                      }
                    />
                    {!row.isSuperAdmin && (
                      <ActionButton
                        label="Delete account"
                        variant="destructive"
                        onClick={() => deleteOrg(orgId, orgName)}
                      />
                    )}
                  </>
                )}
                {!row.isSuperAdmin && (
                  <ActionButton
                    label="Delete user"
                    variant="destructive"
                    onClick={() => deleteUser(id)}
                  />
                )}
              </div>
            );
          },
        },
      ]}
    />
  );
}
