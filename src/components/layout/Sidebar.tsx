import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CalendarDays,
  Calendar,
  Users,
  BedDouble,
  Receipt,
  Package,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Hotel,
  LogOut,
  UserCog,
  Code2,
  ShoppingCart,
  UserCheck,
  Globe,
  Sparkles,
  Wrench,
  DollarSign,
  PartyPopper,
  ShieldCheck,
  Terminal,
  Moon,
  Lock,
  Database,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/hooks/use-sidebar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useUserRole";
import { usePermissions } from "@/hooks/usePermissions";
import { useUIPreferences } from "@/hooks/useSettings";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState, useEffect } from "react";

interface NavSubItem {
  label: string;
  path: string;
}

interface NavItem {
  icon: LucideIcon;
  label: string;
  path: string;
  permission: string;
  subItems?: NavSubItem[];
}

const navItems: NavItem[] = [
  {
    icon: Users,
    label: "Guests",
    path: "/guests",
    permission: "guests:view",
    subItems: [
      { label: "Overview", path: "/guests?tab=guests" },
      { label: "Feedback", path: "/guests?tab=feedback" },
      { label: "Loyalty", path: "/guests?tab=loyalty" },
    ]
  },
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    path: "/",
    permission: "",
    subItems: [
      { label: "Overview", path: "/" },
      { label: "Real-time Stats", path: "/?tab=stats" },
    ]
  },
  {
    icon: CalendarDays,
    label: "Reservations",
    path: "/reservations",
    permission: "reservations:view",
    subItems: [
      { label: "List View", path: "/reservations?tab=list" },
      { label: "Calendar", path: "/reservations?tab=calendar" },
    ]
  },
  {
    icon: BedDouble,
    label: "Front Desk",
    path: "/front-desk",
    permission: "front_desk:view",
    subItems: [
      { label: "Rooms", path: "/front-desk?tab=rooms" },
      { label: "Billing", path: "/front-desk?tab=billing" },
      { label: "Guest Folios", path: "/front-desk?tab=folios" },
      { label: "Queue", path: "/front-desk?tab=queue" },
      { label: "Messages", path: "/front-desk?tab=messages" },
      { label: "Housekeeping", path: "/front-desk?tab=housekeeping" },
    ]
  },
  {
    icon: Sparkles,
    label: "Housekeeping",
    path: "/housekeeping",
    permission: "housekeeping:view",
    subItems: [
      { label: "Rooms Status", path: "/housekeeping?tab=rooms" },
      { label: "Tasks", path: "/housekeeping?tab=tasks" },
      { label: "Lost & Found", path: "/housekeeping?tab=lost-found" },
    ]
  },
  {
    icon: Wrench,
    label: "Engineering",
    path: "/engineering",
    permission: "engineering:view",
    subItems: [
      { label: "Maintenance Requests", path: "/engineering" },
    ]
  },
  {
    icon: ShoppingCart,
    label: "POS",
    path: "/pos",
    permission: "pos:view",
    subItems: [
      { label: "Dashboard", path: "/pos" },
      { label: "Reports", path: "/pos-reports" },
      { label: "History", path: "/pos-history" },
      { label: "Terminal", path: "/pos-terminal" },
    ]
  },
  {
    icon: Package,
    label: "Inventory",
    path: "/inventory",
    permission: "inventory:view",
    subItems: [
      { label: "Dashboard", path: "/inventory?tab=dashboard" },
      { label: "Items", path: "/inventory?tab=items" },
      { label: "Categories", path: "/inventory?tab=categories" },
      { label: "Requisitions", path: "/inventory?tab=requisitions" },
      { label: "Orders", path: "/inventory?tab=orders" },
      { label: "Suppliers", path: "/inventory?tab=suppliers" },
      { label: "Locations", path: "/inventory?tab=locations" },
      { label: "Transfers", path: "/inventory?tab=transfers" },
      { label: "Audits", path: "/inventory?tab=audits" },
      { label: "Recipes", path: "/inventory?tab=recipes" },
      { label: "Movements", path: "/inventory?tab=movements" },
      { label: "Wastage", path: "/inventory?tab=wastage" },
      { label: "Reports", path: "/inventory?tab=reports" },
    ]
  },
  {
    icon: Globe,
    label: "Channel Manager",
    path: "/channel-manager",
    permission: "channel_manager:view",
    subItems: [
      { label: "Channels", path: "/channel-manager" },
    ]
  },
  {
    icon: DollarSign,
    label: "Finance/Account",
    path: "/finance",
    permission: "finance:view",
    subItems: [
      { label: "Dashboard", path: "/finance?tab=dashboard" },
      { label: "Setup", path: "/finance?tab=setup" },
      { label: "Transactions", path: "/finance?tab=transactions" },
      { label: "Reporting", path: "/finance?tab=reporting" },
      { label: "Infrastructure", path: "/finance?tab=infrastructure" },
    ]
  },
  {
    icon: PartyPopper,
    label: "Banquet",
    path: "/banquet",
    permission: "banquet:view",
    subItems: [
      { label: "Events", path: "/banquet?tab=events" },
      { label: "Calendar", path: "/banquet?tab=calendar" },
      { label: "Catering", path: "/banquet?tab=catering" },
      { label: "Venue Setup", path: "/banquet?tab=venue" },
      { label: "Reports", path: "/banquet?tab=reports" },
    ]
  },
  {
    icon: BarChart3,
    label: "Reports",
    path: "/reports",
    permission: "reports:view",
    subItems: [
      { label: "Overview", path: "/reports?tab=overview" },
      { label: "Daily Report", path: "/reports?tab=daily" },
      { label: "Weekend Analysis", path: "/reports?tab=weekend" },
      { label: "Monthly Summary", path: "/reports?tab=monthly" },
    ]
  },
];

const operationsNavItems: NavItem[] = [
  {
    icon: Moon,
    label: "Night Audit",
    path: "/night-audit",
    permission: "operations:night_audit",
    subItems: [
      { label: "Overview", path: "/night-audit" },
    ]
  },
  {
    icon: Lock,
    label: "Day Close",
    path: "/day-close",
    permission: "operations:day_close",
    subItems: [
      { label: "Vouchers", path: "/day-close" },
    ]
  },
];

const adminNavItems: NavItem[] = [
  {
    icon: UserCog,
    label: "User Management",
    path: "/users",
    permission: "all",
    subItems: [
      { label: "Active Users", path: "/users" },
    ]
  },
  {
    icon: Users,
    label: "Staff Management",
    path: "/staff",
    permission: "admin:staff",
    subItems: [
      { label: "Details", path: "/staff?tab=about&sub=details" },
      { label: "Preferences", path: "/staff?tab=about&sub=preferences" },
      { label: "Alerts", path: "/staff?tab=about&sub=alerts" },
      { label: "Security", path: "/staff?tab=about&sub=security" },
      { label: "Logs", path: "/staff?tab=logs" },
    ]
  },
  {
    icon: UserCheck,
    label: "HR",
    path: "/hr",
    permission: "admin:hr",
    subItems: [
      { label: "Directory", path: "/hr?tab=employees&sub=directory" },
      { label: "Records", path: "/hr?tab=employees&sub=records" },
      { label: "Payroll", path: "/hr?tab=payroll" },
      { label: "Leave", path: "/hr?tab=leave" },
      { label: "Schedules", path: "/hr?tab=schedules" },
      { label: "Performance", path: "/hr?tab=performance" },
    ]
  },
  {
    icon: Database,
    label: "Database",
    path: "/database",
    permission: "all",
    subItems: [
      { label: "Schema Explorer", path: "/database" },
    ]
  },
  {
    icon: Settings,
    label: "Settings",
    path: "/settings",
    permission: "all",
    subItems: [
      { label: "Property", path: "/settings" },
    ]
  },
  {
    icon: ShieldCheck,
    label: "Admin Console",
    path: "/admin-console",
    permission: "all",
    subItems: [
      { label: "Overview", path: "/admin-console?tab=overview" },
      { label: "Analytics", path: "/admin-console?tab=analytics" },
      { label: "Rooms", path: "/admin-console?tab=rooms" },
      { label: "Users", path: "/admin-console?tab=users" },
      { label: "Security", path: "/admin-console?tab=security" },
      { label: "RBAC", path: "/admin-console?tab=permissions" },
      { label: "Audit", path: "/admin-console?tab=audit" },
      { label: "Integrations", path: "/admin-console?tab=integrations" },
      { label: "Database", path: "/admin-console?tab=database" },
      { label: "Design System", path: "/admin-console?tab=design_system" },
    ]
  },
  {
    icon: Code2,
    label: "Dev Panel",
    path: "/dev",
    permission: "all",
    subItems: [
      { label: "Sandbox", path: "/dev" },
    ]
  },
];

function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  const { collapsed, toggleCollapsed, isMobile } = useSidebar();
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { data: permissions } = usePermissions();
  const { data: uiPrefs } = useUIPreferences();
  const [openGroups, setOpenGroups] = useState<string[]>([]);

  // Auto-open the active group only on initial load
  useEffect(() => {
    const allGroups = [...navItems, ...operationsNavItems, ...adminNavItems];
    const currentPath = location.pathname;
    const currentSearch = location.search;

    allGroups.forEach(group => {
      const isSubMatch = group.subItems?.some(sub => {
        const subUrl = new URL(sub.path, "http://localhost");
        if (subUrl.pathname !== currentPath) return false;

        if (subUrl.search) {
          const subParams = new URLSearchParams(subUrl.search);
          const currentParams = new URLSearchParams(currentSearch);
          let paramsMatch = true;
          subParams.forEach((value, key) => {
            if (currentParams.get(key) !== value) paramsMatch = false;
          });
          return paramsMatch;
        }

        return true;
      });

      if (isSubMatch) {
        setOpenGroups(prev => prev.includes(group.label) ? prev : [...prev, group.label]);
      }
    });
  }, []); // Only run once on mount

  const toggleGroup = (label: string) => {
    setOpenGroups(prev =>
      prev.includes(label)
        ? prev.filter(l => l !== label)
        : [...prev, label]
    );
  };

  const hasPermission = (permission?: string) => {
    if (import.meta.env.DEV) return true;
    if (!permission) return true;
    return permissions?.some(p => p.permission === "all" || p.permission === permission) ?? false;
  };

  const getInitials = () => {
    const first = profile?.first_name || "";
    const last = profile?.last_name || "";
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || "U";
  };

  const renderNavItem = (item: NavItem) => {
    const isActive = location.pathname === item.path || (item.subItems?.some(sub => location.pathname + location.search === sub.path));
    const isExactActive = location.pathname === item.path;
    const hasSubItems = item.subItems && item.subItems.length > 0 && uiPrefs?.sidebar_dropdowns_enabled;
    const isOpen = openGroups.includes(item.label);

    if (hasSubItems && !collapsed) {
      return (
        <Collapsible
          key={item.path}
          open={isOpen}
          onOpenChange={() => toggleGroup(item.label)}
          className="w-full"
        >
          <div className={cn(
            "flex items-center w-full gap-0.5 rounded-lg transition-all duration-200",
            isActive ? "bg-sidebar-accent" : "hover:bg-sidebar-accent"
          )}>
            <Link
              to={item.path}
              onClick={onNavClick}
              className={cn(
                "flex-1 flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive ? "text-primary" : "text-sidebar-foreground hover:text-foreground",
              )}
            >
              <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-primary")} />
              <span className="truncate">{item.label}</span>
            </Link>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-10 w-8 rounded-lg shrink-0",
                  isActive ? "text-primary" : "text-sidebar-foreground hover:text-foreground"
                )}
              >
                <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isOpen && "rotate-180")} />
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent className="pl-9 pr-2 space-y-1 mt-1 animate-in slide-in-from-top-1 duration-200">
            {item.subItems?.map((sub) => {
              const isSubActive = location.pathname + location.search === sub.path;
              return (
                <Link
                  key={sub.path}
                  to={sub.path}
                  onClick={onNavClick}
                  className={cn(
                    "block px-3 py-1.5 text-xs rounded-md transition-colors",
                    isSubActive
                      ? "text-primary font-medium bg-primary/5 shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"
                  )}
                >
                  {sub.label}
                </Link>
              );
            })}
          </CollapsibleContent>
        </Collapsible>
      );
    }

    return (
      <Link
        key={item.path}
        to={item.path}
        onClick={onNavClick}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
          isExactActive
            ? "bg-sidebar-accent text-primary shadow-glow"
            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground",
          collapsed && !isMobile && "justify-center px-2"
        )}
      >
        <item.icon className={cn("h-5 w-5 flex-shrink-0", isExactActive && "text-primary")} />
        {(!collapsed || isMobile) && <span className="truncate">{item.label}</span>}
      </Link>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gradient-sidebar border-l-0 -ml-[1px]">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border flex-shrink-0">
        <Link to="/" className="flex items-center gap-3" onClick={onNavClick}>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-gold shadow-glow flex-shrink-0">
            <Hotel className="h-5 w-5 text-primary-foreground" />
          </div>
          {(!collapsed || isMobile) && (
            <span className="font-display text-xl font-semibold text-gradient-gold truncate">
              LuxeStay
            </span>
          )}
        </Link>
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapsed}
            className="h-8 w-8 text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent flex-shrink-0 ml-auto"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1 p-3 overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-primary/10">
        {navItems.filter(item => hasPermission(item.permission)).map(renderNavItem)}

        {/* Operations Section */}
        {operationsNavItems.some(item => hasPermission(item.permission)) && (
          <>
            {(!collapsed || isMobile) && (
              <div className="mt-4 mb-2 px-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Operations
                </p>
              </div>
            )}
            {operationsNavItems.filter(item => hasPermission(item.permission)).map(renderNavItem)}
          </>
        )}

        {/* Admin Section */}
        {adminNavItems.some(item => hasPermission(item.permission)) && (
          <>
            {(!collapsed || isMobile) && (
              <div className="mt-4 mb-2 px-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Admin
                </p>
              </div>
            )}
            {adminNavItems.filter(item => hasPermission(item.permission)).map(renderNavItem)}
          </>
        )}
      </nav>

      {/* User Section */}
      <div className="mt-auto border-t border-sidebar-border flex-shrink-0 bg-sidebar-background/50 backdrop-blur-sm">
        {(!collapsed || isMobile) ? (
          <div className="p-4">
            <Link to="/profile" onClick={onNavClick} className="flex items-center gap-3 mb-3 hover:opacity-80">
              <div className="h-10 w-10 rounded-full bg-gradient-gold flex items-center justify-center flex-shrink-0 shadow-glow">
                <span className="text-sm font-semibold text-primary-foreground">{getInitials()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {profile?.first_name || "User"} {profile?.last_name || ""}
                </p>
                <p className="text-xs text-muted-foreground truncate">Staff Member</p>
              </div>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
              onClick={signOut}
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </Button>
          </div>
        ) : (
          <div className="p-3 flex flex-col items-center gap-2">
            <Link to="/profile" className="h-10 w-10 rounded-full bg-gradient-gold flex items-center justify-center hover:opacity-80 shadow-glow">
              <span className="text-sm font-semibold text-primary-foreground">{getInitials()}</span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
              onClick={signOut}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export function Sidebar() {
  const { collapsed, isMobile, mobileOpen, setMobileOpen } = useSidebar();

  // Mobile: Sheet overlay
  if (isMobile) {
    return (
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0 border-sidebar-border">
          <SidebarContent onNavClick={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Fixed sidebar
  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 border-r border-sidebar-border transition-all duration-300 overflow-hidden",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <SidebarContent />
    </aside>
  );
}
