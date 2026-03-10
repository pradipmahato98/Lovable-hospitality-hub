import { Link, useLocation, useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, CalendarDays, Users, BedDouble, Receipt, Package, BarChart3, Settings,
  ChevronLeft, ChevronRight, Hotel, LogOut, UserCog, Code2, ShoppingCart, UserCheck,
  Globe, Sparkles, Wrench, DollarSign, PartyPopper, ShieldCheck, Moon, Lock, ChevronDown, LucideIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSidebar } from "@/hooks/use-sidebar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useUserRole";
import { useUIPreferences } from "@/hooks/useSettings";
import { useEffect } from "react";

interface NavSubItem {
  label: string;
  tab: string;
}

interface NavItemConfig {
  icon: LucideIcon;
  label: string;
  path: string;
  subItems?: NavSubItem[];
}

const navItems: NavItemConfig[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: CalendarDays, label: "Reservations", path: "/reservations" },
  { icon: Users, label: "Guests", path: "/guests" },
  { icon: BedDouble, label: "Front Desk", path: "/front-desk" },
  { icon: Sparkles, label: "Housekeeping", path: "/housekeeping" },
  { icon: Wrench, label: "Engineering", path: "/engineering" },
  {
    icon: ShoppingCart,
    label: "POS",
    path: "/pos",
    subItems: [
      { label: "Dashboard", tab: "dashboard" },
      { label: "Terminal", tab: "terminal" },
      { label: "History", tab: "history" },
      { label: "Reports", tab: "reports" },
    ]
  },
  {
    icon: Package,
    label: "Inventory",
    path: "/inventory",
    subItems: [
      { label: "Items", tab: "items" },
      { label: "Categories", tab: "categories" },
      { label: "Suppliers", tab: "suppliers" },
      { label: "Orders", tab: "orders" },
      { label: "Movements", tab: "movements" },
      { label: "Transfers", tab: "transfers" },
      { label: "Reports", tab: "reports" },
    ]
  },
  { icon: Globe, label: "Channel Manager", path: "/channel-manager" },
  {
    icon: DollarSign,
    label: "Finance/Account",
    path: "/finance",
    subItems: [
      { label: "Dashboard", tab: "dashboard" },
      { label: "Setup", tab: "setup" },
      { label: "Transactions", tab: "transactions" },
      { label: "Reports", tab: "reports" },
    ]
  },
  { icon: PartyPopper, label: "Banquet", path: "/banquet" },
  { icon: BarChart3, label: "Reports", path: "/reports" },
];

const operationsNavItems = [
  { icon: Moon, label: "Night Audit", path: "/night-audit" },
  { icon: Lock, label: "Day Close", path: "/day-close" },
];

const adminNavItems: NavItemConfig[] = [
  { icon: UserCog, label: "User Management", path: "/users" },
  {
    icon: Users,
    label: "Staff Management",
    path: "/staff",
    subItems: [
      { label: "Directory", tab: "directory" },
      { label: "Attendance", tab: "attendance" },
      { label: "Schedules", tab: "schedules" },
      { label: "Alerts", tab: "alerts" },
      { label: "Logs", tab: "logs" },
      { label: "Security", tab: "security" },
      { label: "About", tab: "about" },
    ]
  },
  { icon: UserCheck, label: "HR", path: "/hr" },
  { icon: Settings, label: "Settings", path: "/settings" },
  { icon: ShieldCheck, label: "Admin Console", path: "/admin-console" },
  { icon: Code2, label: "Dev Panel", path: "/dev" },
];

function NavItem({
  item,
  isActive,
  collapsed,
  isMobile,
  onNavClick,
  dropdownsEnabled
}: {
  item: NavItemConfig;
  isActive: boolean;
  collapsed: boolean;
  isMobile: boolean;
  onNavClick?: () => void;
  dropdownsEnabled: boolean;
}) {
  const { openGroups, toggleGroup, setOpenGroups } = useSidebar();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isExpanded = openGroups.includes(item.label);
  const hasSubItems = item.subItems && item.subItems.length > 0 && dropdownsEnabled;

  useEffect(() => {
    if (isActive && hasSubItems && !isExpanded) {
      setOpenGroups([...openGroups, item.label]);
    }
  }, [isActive, hasSubItems]);

  const isSubActive = (subTab: string) => {
    return isActive && searchParams.get("tab") === subTab;
  };

  const handleSubItemClick = (e: React.MouseEvent, subTab: string) => {
    if (isActive) {
      e.preventDefault();
      setSearchParams(prev => {
        prev.set("tab", subTab);
        return prev;
      });
    }
    if (onNavClick) onNavClick();
  };

  const link = (
    <div className="flex flex-col w-full">
      <div className="flex items-center w-full group">
        <Link
          to={item.path}
          onClick={(e) => {
            if (hasSubItems && !collapsed) {
              // On desktop, clicking the label just navigates
              // The chevron handles the toggle
            }
            if (onNavClick) onNavClick();
          }}
          className={cn(
            "flex-1 flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200 relative",
            isActive
              ? "bg-sidebar-accent text-primary"
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-foreground",
            collapsed && !isMobile && "justify-center px-2",
            hasSubItems && !collapsed && "rounded-r-none"
          )}
        >
          {isActive && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-primary" />
          )}
          <item.icon className={cn("h-[18px] w-[18px] flex-shrink-0", isActive && "text-primary")} />
          {(!collapsed || isMobile) && <span className="truncate">{item.label}</span>}
        </Link>

        {hasSubItems && !collapsed && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleGroup(item.label);
            }}
            className={cn(
              "px-2 py-2 rounded-lg rounded-l-none transition-colors",
              isActive ? "bg-sidebar-accent text-primary" : "text-sidebar-foreground/40 hover:bg-sidebar-accent/60 hover:text-foreground"
            )}
          >
            <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isExpanded && "rotate-180")} />
          </button>
        )}
      </div>

      {hasSubItems && isExpanded && !collapsed && (
        <div className="ml-9 mt-1 flex flex-col gap-0.5 border-l border-sidebar-border/40 pl-2">
          {item.subItems?.map((sub) => (
            <Link
              key={sub.tab}
              to={`${item.path}?tab=${sub.tab}`}
              onClick={(e) => handleSubItemClick(e, sub.tab)}
              className={cn(
                "px-3 py-1.5 text-xs rounded-md transition-colors",
                isSubActive(sub.tab)
                  ? "text-primary font-medium bg-sidebar-accent/50"
                  : "text-sidebar-foreground/60 hover:text-foreground hover:bg-sidebar-accent/30"
              )}
            >
              {sub.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );

  if (collapsed && !isMobile) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <Link
            to={item.path}
            className={cn(
              "flex items-center justify-center rounded-lg h-9 w-9 transition-all duration-200 relative",
              isActive
                ? "bg-sidebar-accent text-primary"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-foreground"
            )}
          >
            {isActive && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-primary" />
            )}
            <item.icon className={cn("h-[18px] w-[18px] flex-shrink-0", isActive && "text-primary")} />
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8} className="text-xs">
          {item.label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return link;
}

function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  const { collapsed, toggleCollapsed, isMobile } = useSidebar();
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { data: uiPrefs } = useUIPreferences();
  const dropdownsEnabled = uiPrefs?.sidebar_dropdowns_enabled ?? true;

  const getInitials = () => {
    const first = profile?.first_name || "";
    const last = profile?.last_name || "";
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || "U";
  };

  const isItemActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-14 items-center justify-between px-4 border-b border-sidebar-border/60">
        <Link to="/" className="flex items-center gap-2.5" onClick={onNavClick}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-gold flex-shrink-0">
            <Hotel className="h-4 w-4 text-primary-foreground" />
          </div>
          {(!collapsed || isMobile) && (
            <span className="font-display text-lg font-semibold text-gradient-gold">
              LuxeStay
            </span>
          )}
        </Link>
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapsed}
            className="h-7 w-7 text-sidebar-foreground/50 hover:text-foreground hover:bg-sidebar-accent flex-shrink-0"
          >
            {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-0.5 p-2 overflow-y-auto scrollbar-hide">
        {navItems.map((item) => (
          <NavItem
            key={item.path}
            item={item}
            isActive={isItemActive(item.path)}
            collapsed={collapsed}
            isMobile={isMobile}
            onNavClick={onNavClick}
            dropdownsEnabled={dropdownsEnabled}
          />
        ))}

        {/* Operations Section */}
        {(!collapsed || isMobile) && (
          <div className="mt-4 mb-1 px-3">
            <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest">
              Operations
            </p>
          </div>
        )}
        {collapsed && !isMobile && <div className="mt-3 mb-1 mx-2 border-t border-sidebar-border/40" />}
        {operationsNavItems.map((item) => (
          <NavItem
            key={item.path}
            item={item}
            isActive={isItemActive(item.path)}
            collapsed={collapsed}
            isMobile={isMobile}
            onNavClick={onNavClick}
            dropdownsEnabled={dropdownsEnabled}
          />
        ))}
        
        {/* Admin Section */}
        {isAdmin && (
          <>
            {(!collapsed || isMobile) && (
              <div className="mt-4 mb-1 px-3">
                <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest">
                  Admin
                </p>
              </div>
            )}
            {collapsed && !isMobile && <div className="mt-3 mb-1 mx-2 border-t border-sidebar-border/40" />}
            {adminNavItems.map((item) => (
              <NavItem
                key={item.path}
                item={item}
                isActive={isItemActive(item.path)}
                collapsed={collapsed}
                isMobile={isMobile}
                onNavClick={onNavClick}
                dropdownsEnabled={dropdownsEnabled}
              />
            ))}
          </>
        )}
      </nav>

      {/* User Section */}
      {(!collapsed || isMobile) && (
        <div className="p-3 border-t border-sidebar-border/60 mt-auto">
          <Link to="/profile" onClick={onNavClick} className="flex items-center gap-2.5 mb-2 hover:opacity-80 transition-opacity">
            <div className="h-8 w-8 rounded-full bg-gradient-gold flex items-center justify-center flex-shrink-0 ring-2 ring-primary/10">
              <span className="text-xs font-semibold text-primary-foreground">{getInitials()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">
                {profile?.first_name || "User"} {profile?.last_name || ""}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">Staff Member</p>
            </div>
          </Link>
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground/70 hover:text-foreground text-xs h-8" onClick={signOut}>
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </Button>
        </div>
      )}

      {/* Collapsed User Avatar */}
      {collapsed && !isMobile && (
        <div className="p-2 border-t border-sidebar-border/60 mt-auto flex flex-col items-center gap-1.5">
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Link to="/profile" className="h-8 w-8 rounded-full bg-gradient-gold flex items-center justify-center hover:opacity-80 ring-2 ring-primary/10">
                <span className="text-xs font-semibold text-primary-foreground">{getInitials()}</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8} className="text-xs">Profile</TooltipContent>
          </Tooltip>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground/60 hover:text-foreground" onClick={signOut}>
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8} className="text-xs">Sign Out</TooltipContent>
          </Tooltip>
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const { collapsed, isMobile, mobileOpen, setMobileOpen } = useSidebar();

  if (isMobile) {
    return (
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0 bg-gradient-sidebar border-sidebar-border">
          <SidebarContent onNavClick={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-gradient-sidebar border-r border-sidebar-border/60 transition-all duration-300",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <SidebarContent />
    </aside>
  );
}
