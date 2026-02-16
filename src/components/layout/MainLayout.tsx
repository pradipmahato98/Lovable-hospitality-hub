import { ReactNode, useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./GlobalHeader";
import { useSidebar } from "@/hooks/use-sidebar";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useUIPreferences } from "@/hooks/useSettings";
import { useLocation } from "react-router-dom";

interface MainLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function MainLayout({ children, title, subtitle }: MainLayoutProps) {
  const { collapsed, isMobile } = useSidebar();
  const { data: prefs } = useUIPreferences();
  const location = useLocation();

  const isSpring = prefs?.animation_preset === "spring";
  const transition = isSpring
    ? { type: "spring", stiffness: 300, damping: 30 }
    : { duration: 0.3, ease: "easeInOut" };

  return (
    <div className={cn(
      "min-h-screen bg-background transition-all duration-500"
    )}>
      <Sidebar />
      <div 
        className={cn(
          "transition-all duration-300 min-h-screen flex flex-col",
          isMobile ? "ml-0" : collapsed ? "ml-20" : "ml-64"
        )}
      >
        <Header title={title} subtitle={subtitle} />
        <main className="flex-1 p-4 sm:p-6 overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={transition}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
