import React, { createContext, useContext, useEffect, ReactNode } from "react";
import { useUIPreferences } from "@/hooks/useSettings";
import { useSidebar } from "@/components/ui/sidebar";

const DesignSystemContext = createContext({});

export const useDesignSystem = () => useContext(DesignSystemContext);

export const DesignSystemProvider = ({ children }: { children: ReactNode }) => {
  const { data: prefs } = useUIPreferences();
  const { isMobile } = useSidebar();

  useEffect(() => {
    if (!prefs) return;

    const root = document.documentElement;

    // Inject CSS Variables for Layout (Mapping to Shadcn standard variables)
    if (prefs.base_radius) {
      root.style.setProperty("--radius", `${prefs.base_radius / 16}rem`);
    }

    // Inject Theme Colors
    if (prefs.primary_color) {
      root.style.setProperty("--primary", prefs.primary_color);
    }

    // Inject Typography
    if (prefs.font_family_sans) {
      root.style.setProperty("--font-body", prefs.font_family_sans);
    }
    if (prefs.font_family_display) {
      root.style.setProperty("--font-display", prefs.font_family_display);
    }

    // Handle animations
    if (!prefs.animations_enabled) {
      document.body.classList.add("reduce-motion");
    } else {
      document.body.classList.remove("reduce-motion");
    }

    // Clean up legacy iOS classes
    document.body.classList.remove("ios-enabled");

  }, [prefs]);

  return (
    <DesignSystemContext.Provider value={{ prefs }}>
      {children}
    </DesignSystemContext.Provider>
  );
};
