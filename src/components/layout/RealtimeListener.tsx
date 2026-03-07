import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCOGSEngine } from "@/hooks/useCOGSEngine";

export const RealtimeListener = () => {
  const queryClient = useQueryClient();

  // Initialize Automated Accounting Engines
  useCOGSEngine();

  useEffect(() => {
    // Global channel for system settings
    const settingsChannel = supabase
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
      supabase.removeChannel(settingsChannel);
    };
  }, [queryClient]);

  return null;
};
