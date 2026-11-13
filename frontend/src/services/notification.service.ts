import api from "@/lib/axios";
import type { ApiResponse, Notification } from "@/types";

// Notification API calls (Module 2 Feature 2).

export const getNotifications = async (): Promise<{
  notifications: Notification[];
  unreadCount: number;
}> => {
  const res = await api.get<
    ApiResponse<{ notifications: Notification[]; unreadCount: number }>
  >("/notifications");
  return res.data.data;
};

export const getUnreadCount = async (): Promise<number> => {
  const res = await api.get<ApiResponse<{ unreadCount: number }>>(
    "/notifications/unread-count"
  );
  return res.data.data.unreadCount;
};

export const markRead = async (notificationId: number): Promise<void> => {
  await api.patch(`/notifications/${notificationId}/read`);
};

export const markAllRead = async (): Promise<void> => {
  await api.patch("/notifications/read-all");
};
