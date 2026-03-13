import { Link, useLocation, useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, CalendarDays, Users, BedDouble, Receipt, Package, BarChart3, Settings,
  ChevronLeft, ChevronRight, Hotel, LogOut, UserCog, Code2, ShoppingCart, UserCheck,
  Globe, Sparkles, Wrench, DollarSign, PartyPopper, ShieldCheck, Moon, Lock, ChevronDown, LucideIcon,
  Target, Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSidebar } from "@/hooks/use-sidebar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useUserRole";
import { useUIPreferences } from "@/hooks/useSettings";
import { useEffect } from "react";
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
      { label: "Communications", tab: "communications" },
      { label: "Documents", tab: "documents" },
      { label: "History", tab: "history" },
      { label: "Messaging", tab: "messaging" },
      { label: "De-dup", tab: "dedup" },
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
      { label: "Queue", tab: "queue" },
      { label: "Messages", tab: "messages" },
      { label: "Upgrades", tab: "upgrades" },
      { label: "Wake-Up", tab: "wakeup" },
      { label: "Group", tab: "group" },
      { label: "Key Cards", tab: "keycards" },
    ]
  },
  {
    icon: Sparkles,
    label: "Housekeeping",
    path: "/housekeeping",
    defaultTab: "rooms",
    subItems: [
      { label: "Rooms", tab: "rooms" },
      { label: "Tasks", tab: "tasks" },
      { label: "Inspections", tab: "inspections" },
      { label: "Lost & Found", tab: "lost-found" },
      { label: "Supplies", tab: "supplies" },
      { label: "Reports", tab: "reports" },
    ]
  },
  {
    icon: Wrench,
    label: "Engineering",
    path: "/engineering",
    defaultTab: "requests",
    subItems: [
      { label: "Requests", tab: "requests" },
      { label: "Preventive", tab: "preventive" },
      { label: "Assets", tab: "assets" },
      { label: "Reports", tab: "reports" },
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
      { label: "Reports", path: "/pos/reports" },
    ]
  },
  {
    icon: Package,
    label: "Inventory",
    path: "/inventory",
    defaultTab: "items",
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
  {
    icon: Globe,
    label: "Channel Manager",
    path: "/channel-manager",
    defaultTab: "channels",
    subItems: [
      { label: "Channels", tab: "channels" },
      { label: "Rate Calendar", tab: "rates" },
      { label: "Sync Logs", tab: "logs" },
      { label: "Reports", tab: "reports" },
    ]
  },
  {
    icon: DollarSign,
    label: "Finance/Account",
    path: "/finance",
    defaultTab: "dashboard",
    subItems: [
      { label: "Dashboard", tab: "dashboard" },
      { label: "Setup", tab: "setup" },
      { label: "Transactions", tab: "transactions" },
      { label: "Reports", tab: "reports" },
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
      { label: "Catering", tab: "catering" },
      { label: "Venue Setup", tab: "venue" },
      { label: "Reports", tab: "reports" },
    ]
  },
  {
    icon: Target,
    label: "Sales & Marketing",
    path: "/marketing",
    defaultTab: "inquiries",
    subItems: [
      { label: "Inquiries", tab: "inquiries" },
      { label: "Activities", tab: "activities" },
      { label: "Accounts", tab: "accounts" },
    ]
  },
  {
    icon: Briefcase,
    label: "Management",
    path: "/management",
    defaultTab: "performance",
    subItems: [
      { label: "Performance", tab: "performance" },
      { label: "Forecasting", tab: "forecasting" },
      { label: "Analysis", tab: "segmentation" },
    ]
  },
  {
    icon: BarChart3,
    label: "Reports",
    path: "/reports",
    defaultTab: "overview",
    subItems: [
      { label: "Overview", tab: "overview" },
      { label: "DMR Executive", tab: "dmr" },
      { label: "Daily Stats", tab: "daily" },
      { label: "Monthly Summary", tab: "monthly" },
    ]
  },
];

const operationsNavItems: NavItemConfig[] = [
  {
    icon: Moon,
    label: "Night Audit",
    path: "/night-audit",
    defaultTab: "audit",
    subItems: [
      { label: "Run Audit", tab: "audit" },
      { label: "Audit History", tab: "history" },
    ]
  },
  { icon: Lock, label: "Day Close", path: "/day-close" },
];

const adminNavItems: NavItemConfig[] = [
  {
    icon: UserCog,
    label: "User Management",
    path: "/users",
    defaultTab: "users",
    subItems: [
      { label: "Users", tab: "users" },
      { label: "Activity", tab: "activity" },
      { label: "Bulk Actions", tab: "bulk" },
      { label: "Audit Log", tab: "audit" },
    ]
  },
  {
    icon: Users,
    label: "Staff Management",
    path: "/staff",
    defaultTab: "directory",
    subItems: [
      { label: "Directory", tab: "directory" },
      { label: "My Profile", tab: "details" },
      { label: "Preferences", tab: "preferences" },
      { label: "Attendance", tab: "attendance" },
      { label: "Schedules", tab: "schedules" },
      { label: "Alerts", tab: "alerts" },
      { label: "Security", tab: "security" },
      { label: "Logs", tab: "logs" },
    ]
  },
  {
    icon: UserCheck,
    label: "HR",
    path: "/hr",
    defaultTab: "employees",
    subItems: [
      { label: "Employees", tab: "employees" },
      { label: "Payroll", tab: "payroll" },
      { label: "Leave", tab: "leave" },
      { label: "Reports", tab: "reports" },
    ]
  },
  {
    icon: Settings,
    label: "Settings",
    path: "/settings",
    defaultTab: "checkin",
    subItems: [
      { label: "Check-in", tab: "checkin" },
      { label: "Payment", tab: "payment" },
      { label: "Sources", tab: "sources" },
      { label: "Rates", tab: "rates" },
      { label: "Quick Menu", tab: "quickmenu" },
      { label: "Property", tab: "property" },
      { label: "Notifications", tab: "notifications" },
      { label: "Broadcast", tab: "broadcast" },
      { label: "Configure", tab: "configure" },
      { label: "Security", tab: "security" },
    ]
  },
  {
    icon: ShieldCheck,
    label: "Admin Console",
    path: "/admin-console",
    defaultTab: "overview",
    subItems: [
      { label: "Overview", tab: "overview" },
      { label: "Users", tab: "users" },
      { label: "Security", tab: "security" },
      { label: "Permissions", tab: "permissions" },
      { label: "Audit", tab: "audit" },
      { label: "Integrations", tab: "integrations" },
      { label: "Design System", tab: "design_system" },
      { label: "Security Breach", tab: "security_breach" },
    ]
  },
  {
    icon: Code2,
    label: "Dev Panel",
    path: "/dev",
    defaultTab: "status",
    subItems: [
      { label: "Status", tab: "status" },
      { label: "Seeder", tab: "seeder" },
      { label: "Cleanup", tab: "cleanup" },
      { label: "Email", tab: "email" },
      { label: "Logs", tab: "logs" },
      { label: "MCP", tab: "mcp" },
      { label: "Security", tab: "security" },
    ]
  },
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
  const { t } = useTranslation();
  const { openGroups, toggleGroup, setOpenGroups } = useSidebar();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isExpanded = openGroups.includes(item.label);
  const hasSubItems = item.subItems && item.subItems.length > 0 && dropdownsEnabled;

  const translationKey = `nav.${item.label.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  const translatedLabel = t(translationKey, item.label);

  const isSubActive = (sub: NavSubItem, defaultTab?: string) => {
    if (sub.path) {
      // If the sub-item has a path, check if it matches the current pathname
      // But also handle the case where the main item is active but we're on a sub-path
      return location.pathname === sub.path;
    }
    // If it's a tab, check if the main path matches and the tab param matches
    // Or if there is no tab param and this is the default tab
    const currentTab = searchParams.get("tab") || defaultTab;
    return isActive && currentTab === sub.tab;
  };

  const handleSubItemClick = (e: React.MouseEvent, sub: NavSubItem) => {
    if (sub.path) {
      // If it's a direct path, let the Link handle it
      if (onNavClick) onNavClick();
      return;
    }

    if (isActive && sub.tab) {
      e.preventDefault();
      setSearchParams(prev => {
        prev.set("tab", sub.tab!);
        return prev;
      });
    }
    if (onNavClick) onNavClick();
  };

  const link = (
    <div className="flex flex-col w-full">
      <div className={cn(
        "flex items-center w-full group rounded-lg transition-all duration-200",
        isActive
          ? "bg-sidebar-accent text-primary"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-foreground"
      )}>
        <Link
          to={item.path}
          onClick={(e) => {
            if (onNavClick) onNavClick();
          }}
          className={cn(
            "flex-1 flex items-center gap-3 px-3 py-2 text-[13px] font-medium transition-all duration-200 relative",
            collapsed && !isMobile && "justify-center px-2"
          )}
        >
          {isActive && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-primary" />
          )}
          <item.icon className={cn("h-[18px] w-[18px] flex-shrink-0", isActive && "text-primary")} />
          {(!collapsed || isMobile) && <span className="truncate">{translatedLabel}</span>}
        </Link>

        {hasSubItems && !collapsed && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleGroup(item.label);
            }}
            className={cn(
              "px-2 py-2 transition-colors",
              isActive ? "text-primary" : "text-sidebar-foreground/40"
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
              key={sub.path || sub.tab}
              to={sub.path || `${item.path}?tab=${sub.tab}`}
              onClick={(e) => handleSubItemClick(e, sub)}
              className={cn(
                "px-3 py-1.5 text-xs rounded-md transition-colors font-bold",
                isSubActive(sub, item.defaultTab)
                  ? "text-primary bg-sidebar-accent/50"
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

  const { t } = useTranslation();

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-14 items-center justify-between px-4 border-b border-sidebar-border/60">
        <Link to="/" className="flex items-center gap-2.5" onClick={onNavClick}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-blue flex-shrink-0">
            <Hotel className="h-4 w-4 text-primary-foreground" />
          </div>
          {(!collapsed || isMobile) && (
            <span className="font-display text-lg font-semibold text-gradient-blue">
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
              {t('common.operations', 'Operations')}
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
                  {t('common.admin', 'Admin')}
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
            <div className="h-8 w-8 rounded-full bg-gradient-blue flex items-center justify-center flex-shrink-0 ring-2 ring-primary/10">
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
              <Link to="/profile" className="h-8 w-8 rounded-full bg-gradient-blue flex items-center justify-center hover:opacity-80 ring-2 ring-primary/10">
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
