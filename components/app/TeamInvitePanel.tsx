"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Role } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { INVITABLE_ROLES, formatRoleLabel } from "@/lib/roles";
import { Mail, Trash2 } from "lucide-react";

type InviteRow = {
  id: string;
  email: string;
  role: Role;
  expiresAt: string;
  createdAt: string;
  invitedBy: { name: string | null; email: string };
};

export function TeamInvitePanel() {
  const router = useRouter();
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("DISPATCHER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadInvites() {
    const res = await fetch("/api/invites");
    if (!res.ok) return;
    const data = await res.json();
    setInvites(data.invites ?? []);
  }

  useEffect(() => {
    loadInvites();
  }, []);

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const res = await fetch("/api/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data.error ?? "Failed to send invite");
      setLoading(false);
      return;
    }

    setEmail("");
    setMessage(
      data.emailSent
        ? `Invite sent to ${data.invite.email}`
        : `Invite created for ${data.invite.email} (logged to console in dev)`
    );
    setLoading(false);
    await loadInvites();
    router.refresh();
  }

  async function cancelInvite(id: string) {
    const res = await fetch(`/api/invites/${id}`, { method: "DELETE" });
    if (res.ok) {
      setInvites((current) => current.filter((invite) => invite.id !== id));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Team invites
        </CardTitle>
        <CardDescription>
          Invite teammates by email. They will join this workspace with the role you choose.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={sendInvite} className="grid gap-4 sm:grid-cols-[1fr_180px_auto] sm:items-end">
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              type="email"
              required
              placeholder="teammate@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invite-role">Role</Label>
            <select
              id="invite-role"
              name="role"
              aria-label="Role"
              title="Role"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
            >
              {INVITABLE_ROLES.map((item) => (
                <option key={item} value={item}>
                  {formatRoleLabel(item)}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send invite"}
          </Button>
        </form>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {message && <p className="text-sm text-success">{message}</p>}

        <div className="space-y-2">
          <p className="text-sm font-medium">Pending invites</p>
          {invites.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending invites.</p>
          ) : (
            <ul className="space-y-2">
              {invites.map((invite) => (
                <li
                  key={invite.id}
                  className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium">{invite.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatRoleLabel(invite.role)} · expires{" "}
                      {new Date(invite.expiresAt).toLocaleDateString("en-GB")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{formatRoleLabel(invite.role)}</Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Cancel invite for ${invite.email}`}
                      onClick={() => cancelInvite(invite.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
