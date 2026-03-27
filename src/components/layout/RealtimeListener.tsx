import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const RealtimeListener = () => {
  const queryClient = useQueryClient();

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

    // Global channel for Room status changes (Housekeeping -> Front Desk sync)
    const roomsChannel = supabase
      .channel("rooms-status-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rooms" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["rooms"] });
          queryClient.invalidateQueries({ queryKey: ["room"] });
        }
      )
      .subscribe();

    // Global channel for Reservations
    const resChannel = supabase
      .channel("reservations-global-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reservations" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["reservations"] });
        }
      )
      .subscribe();

    // Global channel for Guest Folios
    const folioChannel = supabase
      .channel("folios-global-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "guest_folios" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["guest_folios"] });
          queryClient.invalidateQueries({ queryKey: ["folio_items"] });
        }
      )
      .subscribe();

    // Global channel for Banquet Events
    const banquetChannel = supabase
      .channel("banquet-global-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "banquet_events" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["banquet-events"] });
        }
      )
      .subscribe();

    // Global channel for Guests
    const guestChannel = supabase
      .channel("guests-global-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "guests" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["guests"] });
          queryClient.invalidateQueries({ queryKey: ["guest"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(settingsChannel);
      supabase.removeChannel(roomsChannel);
      supabase.removeChannel(resChannel);
      supabase.removeChannel(folioChannel);
      supabase.removeChannel(banquetChannel);
      supabase.removeChannel(guestChannel);
    };
  }, [queryClient]);

  return null;
};
