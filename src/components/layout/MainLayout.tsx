import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./GlobalHeader";
import { useSidebar } from "@/hooks/use-sidebar";
import { cn } from "@/lib/utils";
import { useUIPreferences, type UIPreferences } from "@/hooks/useSettings";

interface MainLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function MainLayout({ children, title, subtitle }: MainLayoutProps) {
  const { collapsed, isMobile } = useSidebar();
  const { data: uiPrefs } = useUIPreferences();

  useEffect(() => {
    // Basic enable/disable
    if (uiPrefs?.ios_materials) {
      document.body.classList.add("ios-enabled");
    } else {
      document.body.classList.remove("ios-enabled");
    }

    // Intensity classes
    const intensities: UIPreferences['glass_intensity'][] = ['low', 'medium', 'high'];
    intensities.forEach(intensity => {
      if (uiPrefs?.glass_intensity === intensity) {
        document.body.classList.add(`ios-intensity-${intensity}`);
      } else {
        document.body.classList.remove(`ios-intensity-${intensity}`);
      }
    });

    // Mobile disabling
    if (uiPrefs?.disable_on_mobile && isMobile) {
      document.body.classList.add("ios-mobile-disabled");
    } else {
      document.body.classList.remove("ios-mobile-disabled");
    }
  }, [uiPrefs?.ios_materials, uiPrefs?.glass_intensity, uiPrefs?.disable_on_mobile, isMobile]);

  return (
    <div className={cn("min-h-screen bg-background transition-all duration-500", uiPrefs?.ios_materials && !uiPrefs?.disable_on_mobile && "ios-materials-active")}>
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
