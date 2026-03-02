import { ReactNode, useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./GlobalHeader";
import { useSidebar } from "@/hooks/use-sidebar";
import { cn } from "@/lib/utils";
import { useUIPreferences } from "@/hooks/useSettings";

interface MainLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function MainLayout({ children, title, subtitle }: MainLayoutProps) {
  const { collapsed, isMobile } = useSidebar();

  return (
    <div className={cn(
      "h-screen w-screen bg-background transition-all duration-500 relative flex overflow-hidden fixed inset-0"
    )}>
      <Sidebar />
      <div
        className={cn(
          "flex-1 transition-all duration-300 h-full flex flex-col min-w-0 overflow-hidden",
          !isMobile && (collapsed ? "pl-20" : "pl-64")
        )}
      >
        <Header title={title} subtitle={subtitle} />
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto overflow-x-hidden bg-background/50">{children}</main>
      </div>
    </div>
  );
}
