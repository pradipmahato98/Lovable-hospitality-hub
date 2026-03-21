import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./GlobalHeader";
import { PageTransition } from "./PageTransition";
import { useSidebar } from "@/hooks/use-sidebar";
import { cn } from "@/lib/utils";

export interface MainLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function MainLayout({ children, title, subtitle, actions }: MainLayoutProps) {
  const { collapsed, isMobile } = useSidebar();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div 
        className={cn(
          "transition-[margin] duration-300 ease-in-out min-h-screen flex flex-col",
          isMobile ? "ml-0" : collapsed ? "ml-20" : "ml-64"
        )}
      >
        <Header title={title} subtitle={subtitle} />
        <main className="flex-1 p-4 sm:p-6 overflow-x-hidden">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
