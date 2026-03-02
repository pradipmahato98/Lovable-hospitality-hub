import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./GlobalHeader";
import { SidebarInset } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function MainLayout({ children, title, subtitle }: MainLayoutProps) {
  return (
    <div className={cn(
      "h-screen w-screen bg-background relative flex overflow-hidden fixed inset-0"
    )}>
      <Sidebar />
      <SidebarInset className="flex flex-col min-w-0 overflow-hidden">
        <Header title={title} subtitle={subtitle} />
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto overflow-x-hidden bg-background/50">{children}</main>
      </SidebarInset>
    </div>
  );
}
