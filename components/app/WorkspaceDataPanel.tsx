"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Trash2 } from "lucide-react";
import { signOut } from "next-auth/react";
import type { Organization } from "@prisma/client";

export function WorkspaceDataPanel({
  organization,
  canExport,
}: {
  organization: Organization;
  canExport: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function exportWorkspace() {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/organization/export");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Export failed");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `opervia-${organization.slug}-export.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      setMessage("Workspace export downloaded.");
    } catch {
      setError("Export failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteWorkspace() {
    if (confirmName.trim() !== organization.name) {
      setError("Type the exact workspace name to confirm deletion.");
      return;
    }

    setDeleteLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/organization/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmName }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Deletion failed");
        return;
      }

      await signOut({ callbackUrl: "/" });
    } catch {
      setError("Deletion failed. Please try again or contact support.");
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Workspace data & deletion
        </CardTitle>
        <CardDescription>
          Export your operational data or permanently delete this workspace.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Download a JSON copy of your workspace data for portability or records.
          </p>
          <Button type="button" variant="outline" disabled={!canExport || loading} onClick={exportWorkspace}>
            {loading ? "Preparing export..." : "Export workspace JSON"}
          </Button>
          {!canExport && (
            <p className="text-xs text-muted-foreground">
              Export is available while your subscription is active or after cancellation.
            </p>
          )}
        </div>

        <div className="space-y-3 border-t pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-4 w-4" />
            <p className="font-medium text-sm">Delete workspace</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Permanently deletes {organization.name}, cancels any Stripe subscription, and removes
            all operational data. This cannot be undone.
          </p>
          <div className="space-y-2">
            <Label htmlFor="confirm-delete">
              Type <span className="font-semibold">{organization.name}</span> to confirm
            </Label>
            <Input
              id="confirm-delete"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={organization.name}
              autoComplete="off"
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            disabled={deleteLoading || confirmName.trim() !== organization.name}
            onClick={deleteWorkspace}
          >
            {deleteLoading ? "Deleting..." : "Delete workspace permanently"}
          </Button>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
      </CardContent>
    </Card>
  );
}
