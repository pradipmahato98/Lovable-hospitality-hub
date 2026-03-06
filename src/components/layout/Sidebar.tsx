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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/hooks/use-sidebar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useUserRole";
import { usePermissions } from "@/hooks/usePermissions";

const navItems = [
  { icon: Users, label: "Guests", path: "/guests", permission: "guests:view" },
  { icon: LayoutDashboard, label: "Dashboard", path: "/", permission: "" },
  { icon: CalendarDays, label: "Reservations", path: "/reservations", permission: "reservations:view" },
  { icon: BedDouble, label: "Front Desk", path: "/front-desk", permission: "front_desk:view" },
  { icon: Sparkles, label: "Housekeeping", path: "/housekeeping", permission: "housekeeping:view" },
  { icon: Wrench, label: "Engineering", path: "/engineering", permission: "engineering:view" },
  { icon: ShoppingCart, label: "POS", path: "/pos", permission: "pos:view" },
  { icon: Package, label: "Inventory", path: "/inventory", permission: "inventory:view" },
  { icon: Globe, label: "Channel Manager", path: "/channel-manager", permission: "channel_manager:view" },
  { icon: DollarSign, label: "Finance/Account", path: "/finance", permission: "finance:view" },
  { icon: PartyPopper, label: "Banquet", path: "/banquet", permission: "banquet:view" },
  { icon: BarChart3, label: "Reports", path: "/reports", permission: "reports:view" },
];

const operationsNavItems = [
  { icon: Moon, label: "Night Audit", path: "/night-audit", permission: "operations:night_audit" },
  { icon: Lock, label: "Day Close", path: "/day-close", permission: "operations:day_close" },
];

const adminNavItems = [
  { icon: UserCog, label: "User Management", path: "/users", permission: "all" },
  { icon: Users, label: "Staff Management", path: "/staff", permission: "admin:staff" },
  { icon: UserCheck, label: "HR", path: "/hr", permission: "admin:hr" },
  { icon: Database, label: "Database", path: "/database", permission: "all" },
  { icon: Settings, label: "Settings", path: "/settings", permission: "all" },
  { icon: ShieldCheck, label: "Admin Console", path: "/admin-console", permission: "all" },
  { icon: Code2, label: "Dev Panel", path: "/dev", permission: "all" },
];

function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  const { collapsed, toggleCollapsed, isMobile } = useSidebar();
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { data: permissions } = usePermissions();

  const hasPermission = (permission?: string) => {
    if (!permission) return true;
    return permissions?.some(p => p.permission === "all" || p.permission === permission) ?? false;
  };

  const getInitials = () => {
    const first = profile?.first_name || "";
    const last = profile?.last_name || "";
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || "U";
  };

  const renderNavItem = (item: typeof navItems[0]) => {
    const isActive = location.pathname === item.path;
    return (
      <Link
        key={item.path}
        to={item.path}
        onClick={onNavClick}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
          isActive
            ? "bg-sidebar-accent text-primary shadow-glow"
            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground",
          collapsed && !isMobile && "justify-center px-2"
        )}
      >
        <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-primary")} />
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
      <nav className="flex-1 flex flex-col gap-1 p-3 overflow-y-auto min-h-0 scrollbar-hide">
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
            {operationsNavItems.filter(item => hasPermission(item.permission)).map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onNavClick}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-sidebar-accent text-primary shadow-glow"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground",
                    collapsed && !isMobile && "justify-center px-2"
                  )}
                >
                  <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-primary")} />
                  {(!collapsed || isMobile) && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
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
