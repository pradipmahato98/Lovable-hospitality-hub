import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-bridge";
import { toast } from "sonner";

export const RealtimeListener = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Global channel for system settings
    const settingsChannel = api
      .channel("global-settings")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "settings" },
        (payload: any) => {
          queryClient.invalidateQueries({ queryKey: ["settings"] });

          if (payload.new?.key === "ui_preferences") {
            queryClient.invalidateQueries({ queryKey: ["settings", "ui_preferences"] });
          }

          if (payload.new?.key === "system_lockdown") {
            const isLockdown = payload.new.value === true;
            if (isLockdown) {
              toast.error("SYSTEM LOCKDOWN INITIATED", {
                description: "The system is entering emergency maintenance mode.",
                duration: Infinity,
              });
            } else {
              toast.success("SYSTEM LOCKDOWN LIFTED", {
                description: "Normal operations have resumed.",
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      api.removeChannel(settingsChannel);
    };
  }, [queryClient]);

  return null;
};
