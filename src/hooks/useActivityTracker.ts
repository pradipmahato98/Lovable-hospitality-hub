import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useActivityTracker = () => {
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const logNavigation = async () => {
      try {
        await supabase.from("audit_log").insert({
          action: "navigation",
          entity_type: "page",
          entity_id: location.pathname,
          user_id: user.id,
          new_values: { path: location.pathname, search: location.search },
        });
      } catch (error) {
        console.error("Failed to log activity:", error);
      }
    };

    logNavigation();
  }, [location, user]);

  useEffect(() => {
    if (!user) return;

    const handleGlobalClick = async (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const button = target.closest("button");
      const link = target.closest("a");

      if (button || link) {
        const label = button?.innerText || link?.innerText || (target as any).value || "unknown element";
        try {
          // Debounce or filter noise if needed, but for now simple logging
          await supabase.from("audit_log").insert({
            action: "click",
            entity_type: "ui_interaction",
            entity_id: label.substring(0, 50),
            user_id: user.id,
            new_values: {
              element: button ? "button" : "link",
              path: location.pathname,
              text: label.substring(0, 100)
            },
          });
        } catch (error) {
          // Silently fail interaction logging to avoid breaking UI
        }
      }
    };

    window.addEventListener("click", handleGlobalClick);
    return () => window.removeEventListener("click", handleGlobalClick);
  }, [user, location.pathname]);
};
