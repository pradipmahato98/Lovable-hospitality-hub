import React, { createContext, useContext, useEffect, ReactNode } from "react";
import { useUIPreferences } from "@/hooks/useSettings";

const DesignSystemContext = createContext({});

export const useDesignSystem = () => useContext(DesignSystemContext);

export const DesignSystemProvider = ({ children }: { children: ReactNode }) => {
  const { data: prefs } = useUIPreferences();

  useEffect(() => {
    if (!prefs) return;

    const root = document.documentElement;

    // Standard Theme Colors from Preferences
    if (prefs.primary_color) {
      root.style.setProperty("--primary", prefs.primary_color);
    }

    // Typography Standard
    // We force Google Sans as requested, but respect preference if it's set and valid
    const sansFont = prefs.font_family_sans || 'Google Sans';
    root.style.setProperty("--font-body", sansFont);
    root.style.setProperty("--font-display", prefs.font_family_display || sansFont);

    // Standard Radius
    if (prefs.base_radius) {
        root.style.setProperty("--radius", `${prefs.base_radius}px`);
    }

    // Handle animations
    if (prefs.animations_enabled === false) {
      document.body.classList.add("reduce-motion");
    } else {
      document.body.classList.remove("reduce-motion");
    }

    // Ensure ios-enabled class is removed as we are moving to standard shadcn/ui
    document.body.classList.remove("ios-enabled");

  }, [prefs]);

  return (
    <DesignSystemContext.Provider value={{ prefs }}>
      {children}
    </DesignSystemContext.Provider>
  );
};
