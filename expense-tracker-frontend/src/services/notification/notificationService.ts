import api from "../api";

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  redirectUrl?: string | null;
  createdAt: string;
}

export const getNotifications = async (isRead?: boolean) => {
  const res = await api.get<NotificationItem[]>("/notifications", {
    params: isRead !== undefined ? { isRead } : {},
  });

  return res.data;
};

export const getUnreadNotificationCount = async () => {
  const res = await api.get<{ unreadCount: number }>(
    "/notifications/unread-count",
  );

  return res.data.unreadCount;
};

export const markNotificationAsRead = async (id: number) => {
  const res = await api.put(`/notifications/${id}/read`);
  return res.data;
};

export const markAllNotificationsAsRead = async () => {
  const res = await api.put("/notifications/read-all");
  return res.data;
};

export const deleteNotification = async (id: number) => {
  const res = await api.delete(`/notifications/${id}`);
  return res.data;
};
