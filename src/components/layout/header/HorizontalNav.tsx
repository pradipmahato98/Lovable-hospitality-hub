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
import { useTranslation } from "react-i18next";

interface NavSubItem {
  label: string;
  tab?: string;
  path?: string;
}

interface NavItemConfig {
  icon: LucideIcon;
  label: string;
  path: string;
  subItems?: NavSubItem[];
  defaultTab?: string;
}

const navItems: NavItemConfig[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  {
    icon: CalendarDays,
    label: "Reservations",
    path: "/reservations",
    defaultTab: "list",
    subItems: [
      { label: "List View", tab: "list" },
      { label: "Calendar", tab: "calendar" },
    ]
  },
  {
    icon: Users,
    label: "Guests",
    path: "/guests",
    defaultTab: "guests",
    subItems: [
      { label: "Guests", tab: "guests" },
      { label: "Feedback", tab: "feedback" },
      { label: "Loyalty", tab: "loyalty" },
      { label: "Preferences", tab: "preferences" },
    ]
  },
  {
    icon: BedDouble,
    label: "Front Desk",
    path: "/front-desk",
    defaultTab: "rooms",
    subItems: [
      { label: "Rooms", tab: "rooms" },
      { label: "Billing", tab: "billing" },
      { label: "Guest Folios", tab: "folios" },
    ]
  },
  {
    icon: ShoppingCart,
    label: "POS",
    path: "/pos",
    subItems: [
      { label: "Dashboard", path: "/pos" },
      { label: "Terminal", path: "/pos/terminal" },
      { label: "History", path: "/pos/history" },
    ]
  },
  {
    icon: Package,
    label: "Inventory",
    path: "/inventory",
    defaultTab: "items",
    subItems: [
      { label: "Item Master", tab: "items" },
      { label: "Suppliers", tab: "suppliers" },
      { label: "Purchase Orders", tab: "orders" },
    ]
  },
  {
    icon: DollarSign,
    label: "Finance",
    path: "/finance",
    defaultTab: "dashboard",
    subItems: [
      { label: "Dashboard", tab: "dashboard" },
      { label: "Setup", tab: "setup" },
      { label: "Transactions", tab: "transactions" },
    ]
  },
  {
    icon: PartyPopper,
    label: "Banquet",
    path: "/banquet",
    defaultTab: "events",
    subItems: [
      { label: "Events", tab: "events" },
      { label: "Calendar", tab: "calendar" },
    ]
  },
  {
    icon: BarChart3,
    label: "Reports",
    path: "/reports",
    defaultTab: "overview",
    subItems: [
      { label: "Overview", tab: "overview" },
      { label: "Daily Stats", tab: "daily" },
    ]
  },
  {
    icon: Settings,
    label: "Settings",
    path: "/settings",
    defaultTab: "checkin",
    subItems: [
      { label: "Check-in", tab: "checkin" },
      { label: "UI", tab: "ui" },
      { label: "Payment", tab: "payment" },
    ]
  },
];

export function HorizontalNav() {
  const location = useLocation();
  const { t } = useTranslation();
  const { isAdmin } = useIsAdmin();

  const isItemActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="sticky top-14 z-20 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40">
      <div className="px-4 h-11 flex items-center gap-1 overflow-x-auto scrollbar-hide">
        {navItems.map((item) => {
          const isActive = isItemActive(item.path);
          const translationKey = `nav.${item.label.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
          const translatedLabel = t(translationKey, item.label);

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
                "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {translatedLabel}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
