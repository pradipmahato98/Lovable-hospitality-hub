import { useState, useEffect } from "react";
import { Menu, Moon, Sun, Calendar, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useSidebar } from "@/hooks/use-sidebar";
import { HeaderSearch } from "./header/HeaderSearch";
import { HeaderNotifications } from "./header/HeaderNotifications";
import { HeaderUserMenu } from "./header/HeaderUserMenu";
import { todayBS, formatBSDate } from "@/lib/nepaliDate";
import { formatAD } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useLocalizationSettings, useUpdateLocalizationSettings } from "@/hooks/useSettings";

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
  const { data: locSettings } = useLocalizationSettings();
  const updateLoc = useUpdateLocalizationSettings();

  const toggleCalendar = () => {
    if (locSettings) {
      updateLoc.mutate({
        ...locSettings,
        calendar_mode: locSettings.calendar_mode === "AD" ? "BS" : "AD"
      });
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center border-b border-border/40 bg-background/95 backdrop-blur-md px-4 lg:px-8">
      {/* 3-Column Layout with Grid for Perfect Centering */}
      <div className="w-full grid grid-cols-[1fr_auto_1fr] items-center gap-4 lg:grid-cols-[1fr_2fr_1fr]">
        
        {/* Left: Title & Mobile Menu */}
        <div className="flex items-center gap-3 min-w-0">
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen(true)}
              className="flex-shrink-0 text-muted-foreground hover:text-foreground hover:bg-secondary h-9 w-9"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}

          <div className="min-w-0">
            <h1 className="text-base lg:text-xl font-display font-bold text-foreground truncate tracking-tight">{title}</h1>
            {subtitle && <p className="text-[10px] lg:text-xs text-muted-foreground truncate font-medium uppercase tracking-wider">{subtitle}</p>}
          </div>
        </div>

        {/* Center: Search Box */}
        <div className="flex justify-center w-full min-w-0">
          <div className="w-full max-w-3xl">
            <HeaderSearch />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center justify-end gap-1 sm:gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleCalendar}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 h-auto rounded-md bg-primary/8 border border-primary/15 hover:bg-primary/15 mr-1"
              >
                <Calendar className="h-3 w-3 text-primary" />
                <span className="text-[10px] sm:text-xs font-medium text-primary uppercase">
                  {locSettings?.calendar_mode === "BS" ? `${bsFormatted} BS` : `${adFormatted}`}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs">Switch to {locSettings?.calendar_mode === "BS" ? "AD" : "BS"} calendar</p>
            </TooltipContent>
          </Tooltip>

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
      </div>
    </header>
  );
}
