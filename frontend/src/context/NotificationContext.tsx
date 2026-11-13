"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import { useAuth } from "@/hooks/useAuth";
import * as notificationService from "@/services/notification.service";
import type { Notification } from "@/types";

// How often the client checks the server for fresh notifications. Short enough
// to feel live, long enough to stay light on the API.
const POLL_INTERVAL_MS = 20_000;

interface NotificationContextValue {
  items: Notification[];
  unreadCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
  markRead: (notificationId: number) => Promise<void>;
  markAllRead: () => Promise<void>;
}

export const NotificationContext = createContext<
  NotificationContextValue | undefined
>(undefined);

// Keeps notifications fresh without a manual reload: polls on an interval and
// re-checks whenever the tab regains focus. Only runs while signed in.
export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Avoids overlapping requests when a poll and a focus event coincide.
  const inFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const { notifications, unreadCount } =
        await notificationService.getNotifications();
      setItems(notifications);
      setUnreadCount(unreadCount);
    } catch {
      // A failed poll shouldn't disrupt the UI; the next tick retries.
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setItems([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    refresh();

    const timer = setInterval(refresh, POLL_INTERVAL_MS);

    // Refetch immediately when the user comes back to the tab.
    const onFocus = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);

    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [isAuthenticated, refresh]);

  const markRead = useCallback(async (notificationId: number) => {
    // Optimistic: flip it locally, then tell the server.
    setItems((prev) =>
      prev.map((n) =>
        n.notificationId === notificationId ? { ...n, isRead: true } : n
      )
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await notificationService.markRead(notificationId);
    } catch {
      // If it fails, the next poll will reconcile the true state.
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    await notificationService.markAllRead();
  }, []);

  return (
    <NotificationContext.Provider
      value={{ items, unreadCount, loading, refresh, markRead, markAllRead }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
