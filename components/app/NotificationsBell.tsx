"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
};

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);

  async function load() {
    const res = await fetch("/api/notifications");
    if (res.ok) {
      const data = await res.json();
      setItems(data.notifications);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const unread = items.filter((item) => !item.read).length;

  async function markRead(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Notifications"
        onClick={() => setOpen((value) => !value)}
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 h-4 min-w-4 rounded-full bg-destructive px-1 text-[10px] text-destructive-foreground">
            {unread}
          </span>
        )}
      </Button>
      {open && (
        <div className="absolute right-0 top-10 z-50 w-80 rounded-lg border bg-background p-3 shadow-lg">
          <p className="mb-2 text-sm font-semibold">Notifications</p>
          {unread > 0 && (
            <Button
              variant="link"
              size="sm"
              className="mb-2 h-auto p-0 text-xs"
              onClick={async () => {
                await fetch("/api/notifications", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ markAll: true }),
                });
                load();
              }}
            >
              Mark all read
            </Button>
          )}
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No notifications yet.</p>
          ) : (
            <div className="max-h-64 space-y-2 overflow-auto">
              {items.map((item) => (
                <div key={item.id} className="rounded border p-2 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium">{item.title}</p>
                    <Badge variant="outline">{item.type}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{item.message}</p>
                  {!item.read && (
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs"
                      onClick={() => markRead(item.id)}
                    >
                      Mark read
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
          <Link href="/automations" className="mt-2 block text-xs text-primary">
            View automations
          </Link>
        </div>
      )}
    </div>
  );
}
