import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, CalendarDays, Users, BedDouble, Sparkles, Wrench,
  ShoppingCart, Package, Globe, DollarSign, PartyPopper, Target, Briefcase,
  BarChart3, Moon, Lock, UserCog, UserCheck, Settings, ShieldCheck, Code2,
  ChevronDown, LucideIcon
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsAdmin } from "@/hooks/useUserRole";
import { useUIPreferences } from "@/hooks/useSettings";
import { MoreHorizontal } from "lucide-react";

export function HorizontalNav() {
  const location = useLocation();
  const { t } = useTranslation();
  const { isAdmin } = useIsAdmin();
  const { data: uiPrefs } = useUIPreferences();
  const dropdownsEnabled = uiPrefs?.sidebar_dropdowns_enabled ?? true;

  const isItemActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const renderNavItem = (item: NavItemConfig) => {
    const isActive = isItemActive(item.path);
    const translationKey = `nav.${item.label.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    const translatedLabel = t(translationKey, item.label);

    if (item.subItems && item.subItems.length > 0 && dropdownsEnabled) {
      return (
        <div key={item.path} className="flex items-center group relative">
          {isActive && (
            <motion.div
              layoutId="activeNav"
              className="absolute inset-0 bg-primary/10 rounded-md border border-primary/10 shadow-sm"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          <Link
            to={item.path}
            className={cn(
              "relative z-10 flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-semibold transition-all whitespace-nowrap rounded-l-md",
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
            )}
          >
            <item.icon className={cn("h-4 w-4 transition-transform group-hover:scale-110", isActive && "text-primary")} />
            {translatedLabel}
          </Link>

          if (item.subItems && item.subItems.length > 0) {
            return (
              <DropdownMenu key={item.path}>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {translatedLabel}
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-[160px]">
                  <DropdownMenuItem asChild>
                    <Link to={item.path} className="w-full cursor-pointer">
                      Main {translatedLabel}
                    </Link>
                  </DropdownMenuItem>
                  {item.subItems.map((sub) => (
                    <DropdownMenuItem key={sub.tab || sub.path} asChild>
                      <Link
                        to={sub.path || `${item.path}?tab=${sub.tab}`}
                        className="w-full cursor-pointer"
                      >
                        {sub.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            );
          }

    return (
      <Link
        key={item.path}
        to={item.path}
        className={cn(
          "relative flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-semibold rounded-md transition-all whitespace-nowrap",
          isActive
            ? "text-primary"
            : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
        )}
      >
        {isActive && (
          <motion.div
            layoutId="activeNav"
            className="absolute inset-0 bg-primary/10 rounded-md border border-primary/10 shadow-sm"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
        <item.icon className={cn("relative z-10 h-4 w-4 transition-transform hover:scale-110", isActive && "text-primary")} />
        <span className="relative z-10">{translatedLabel}</span>
      </Link>
    );
  };

  const visibleItems = navItems.slice(0, 8);
  const moreItems = navItems.slice(8);

  return (
    <motion.div
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -10, opacity: 0 }}
      className="sticky top-14 z-20 w-full bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 border-b border-border/40 shadow-sm overflow-hidden"
    >
      <div className="px-4 h-12 flex items-center gap-1.5 overflow-x-auto scrollbar-hide no-scrollbar">
        {visibleItems.map(renderNavItem)}

        {moreItems.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-semibold rounded-md transition-all whitespace-nowrap text-muted-foreground hover:bg-accent/40 hover:text-foreground">
                <MoreHorizontal className="h-4 w-4" />
                More
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[200px] p-1.5">
              {moreItems.map((item) => (
                <DropdownMenuItem key={item.path} asChild>
                  <Link to={item.path} className="flex items-center gap-2.5 py-2 px-2.5 cursor-pointer">
                    <item.icon className="h-4 w-4" />
                    <span>{t(`nav.${item.label.toLowerCase().replace(/[^a-z0-9]/g, '_')}`, item.label)}</span>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <div className="h-4 w-[1px] bg-border mx-2" />
        {operationsNavItems.map(renderNavItem)}
        {isAdmin && (
          <>
            <div className="h-4 w-[1px] bg-border mx-2" />
            {adminNavItems.map(renderNavItem)}
          </>
        )}
      </div>
    </div>
  );
}
