"use client";

import { useRouter } from "next/navigation";
import { Bell, Loader2, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/axios";
import { cn, getInitials } from "@/lib/utils";
import { useNotifications } from "@/hooks/useNotifications";
import { Navbar } from "@/components/layout/Navbar";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import type { Notification } from "@/types";

export default function NotificationsPage() {
  const router = useRouter();
  // The shared context polls in the background, so this list updates itself.
  const { items, loading, markRead, markAllRead } = useNotifications();

  const hasUnread = items.some((n) => !n.isRead);

  const open = async (n: Notification) => {
    if (!n.isRead) {
      markRead(n.notificationId).catch(() => {});
    }
    if (n.linkUrl) router.push(n.linkUrl);
  };

  const markAll = async () => {
    try {
      await markAllRead();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col">
        <Navbar />

        <main className="container max-w-2xl flex-1 py-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-medium tracking-tight">
                Notifications
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Activity from projects you&apos;re part of.
              </p>
            </div>
            {hasUnread && (
              <Button variant="outline" size="sm" onClick={markAll}>
                <CheckCheck className="h-4 w-4" />
                Mark all read
              </Button>
            )}
          </div>

          <div className="mt-8">
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : items.length === 0 ? (
              <EmptyState
                icon={Bell}
                title="Nothing yet"
                body="When someone posts in a project you're on, you'll hear about it here."
              />
            ) : (
              <ul className="space-y-2">
                {items.map((n) => (
                  <li key={n.notificationId}>
                    <button
                      type="button"
                      onClick={() => open(n)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-lg border border-border p-4 text-left transition-colors hover:border-primary/40",
                        n.isRead ? "bg-card" : "bg-primary/5"
                      )}
                    >
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                        {n.actor ? getInitials(n.actor.fullName) : "•"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-foreground/90">{n.message}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {new Date(n.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {!n.isRead && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
