import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-bridge";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useRealtimeNotifications() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const channel = api
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          const notification = payload.new as {
            id: string;
            title: string;
            message: string;
            user_id: string | null;
          };

          // Only show if it's for this user or global
          if (notification.user_id === null || notification.user_id === user.id) {
            // Invalidate the notifications query to refresh list
            queryClient.invalidateQueries({ queryKey: ["notifications"] });

            // Show toast for new notification
            toast.info(notification.title, {
              description: notification.message,
            });
          }
        }
      )
      .subscribe();

    return () => {
      api.removeChannel(channel);
    };
  }, [user, queryClient]);
}
