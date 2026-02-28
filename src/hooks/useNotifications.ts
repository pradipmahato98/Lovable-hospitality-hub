import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api as supabase } from "@/lib/api-bridge";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export type NotificationCategory = "booking" | "checkin" | "settings" | "alert" | "info" | "role_change";

export interface Notification {
  id: string;
  user_id: string | null;
  type: string;
  title: string;
  message: string;
  category: string;
  is_read: boolean;
  created_at: string;
}

export function useNotifications() {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      try {
        const { data, error } = await db
          .from("notifications")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) {
          console.warn("Notifications table issue, returning empty:", error.message);
          return [] as Notification[];
        }
        return data as Notification[];
      } catch (err) {
        return [] as Notification[];
      }
    },
  });

  const createNotification = useMutation({
    mutationFn: async (notification: {
      type: string;
      title: string;
      message: string;
      category: NotificationCategory;
      user_id?: string;
    }) => {
      const { error } = await db.from("notifications").insert(notification);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await db
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      const { error } = await db
        .from("notifications")
        .update({ is_read: true })
        .eq("is_read", false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  return {
    notifications,
    isLoading,
    unreadCount: notifications.filter((n) => !n.is_read).length,
    createNotification,
    markAsRead,
    markAllAsRead,
  };
}
