import { ReactNode, useEffect } from "react";
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
  const { data: uiPrefs } = useUIPreferences();

  useEffect(() => {
    if (uiPrefs?.ios_materials) {
      document.body.classList.add("ios-enabled");
    } else {
      document.body.classList.remove("ios-enabled");
    }
  }, [uiPrefs?.ios_materials]);

  return (
    <div className={cn("min-h-screen bg-background transition-all duration-500", uiPrefs?.ios_materials && "ios-materials-active")}>
      <Sidebar />
      <div 
        className={cn(
          "transition-all duration-300 min-h-screen flex flex-col",
          isMobile ? "ml-0" : collapsed ? "ml-20" : "ml-64"
        )}
      >
        <Header title={title} subtitle={subtitle} />
        <main className="flex-1 p-4 sm:p-6 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
