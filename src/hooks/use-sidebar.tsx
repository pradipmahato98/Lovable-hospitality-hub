import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface SidebarContextType {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  toggleCollapsed: () => void;
  isMobile: boolean;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  openGroups: string[];
  setOpenGroups: (groups: string[] | ((prev: string[]) => string[])) => void;
  toggleGroup: (label: string) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [openGroups, setOpenGroups] = useState<string[]>([]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setMobileOpen(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const toggleCollapsed = () => setCollapsed(prev => !prev);

  const toggleGroup = (label: string) => {
    setOpenGroups(prev =>
      prev.includes(label)
        ? prev.filter(l => l !== label)
        : [...prev, label]
    );
  };

  return (
    <SidebarContext.Provider value={{
      collapsed,
      setCollapsed,
      toggleCollapsed,
      isMobile,
      mobileOpen,
      setMobileOpen,
      openGroups,
      setOpenGroups,
      toggleGroup
    }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within SidebarProvider");
  }
  return context;
}
