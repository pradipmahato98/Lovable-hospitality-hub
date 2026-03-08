import { useState, useEffect } from "react";
import { Menu, Moon, Sun, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useSidebar } from "@/hooks/use-sidebar";
import { HeaderSearch } from "./header/HeaderSearch";
import { HeaderNotifications } from "./header/HeaderNotifications";
import { HeaderUserMenu } from "./header/HeaderUserMenu";
import { todayBS, formatBSDate } from "@/lib/nepaliDate";
import { formatAD } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { isMobile, setMobileOpen } = useSidebar();
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const bsToday = todayBS();
  const bsFormatted = formatBSDate(bsToday, "short");
  const adFormatted = formatAD(new Date());

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/60 bg-background/80 backdrop-blur-xl px-3 sm:px-4 lg:px-6 gap-2 sm:gap-4">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
            className="flex-shrink-0 text-muted-foreground hover:text-foreground hover:bg-secondary h-8 w-8"
          >
            <Menu className="h-4 w-4" />
          </Button>
        )}
        
        <div className="min-w-0">
          <h1 className="text-sm sm:text-base lg:text-lg font-display font-semibold text-foreground truncate leading-tight">{title}</h1>
          {subtitle && <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
        {/* BS Date Badge */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/8 border border-primary/15 cursor-help mr-1">
              <Calendar className="h-3 w-3 text-primary" />
              <span className="text-[10px] sm:text-xs font-medium text-primary">{bsFormatted} BS</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-xs">{adFormatted} (AD)</p>
          </TooltipContent>
        </Tooltip>

        <HeaderSearch />

        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleTheme}
          className="text-muted-foreground hover:text-foreground hover:bg-secondary h-8 w-8"
        >
          {!mounted ? (
            <Moon className="h-4 w-4 opacity-0" />
          ) : resolvedTheme === "dark" ? (
            <Sun className="h-4 w-4 transition-all" />
          ) : (
            <Moon className="h-4 w-4 transition-all" />
          )}
        </Button>

        <HeaderNotifications />
        <HeaderUserMenu />
      </div>
    </header>
  );
}
