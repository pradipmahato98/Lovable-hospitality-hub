import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: CalendarDays, label: "Reservations", path: "/reservations" },
  { icon: Users, label: "Guests", path: "/guests" },
  { icon: BedDouble, label: "Front Desk", path: "/front-desk" },
  { icon: Sparkles, label: "Housekeeping", path: "/housekeeping" },
  { icon: Wrench, label: "Engineering", path: "/engineering" },
  { icon: ShoppingCart, label: "POS", path: "/pos" },
  { icon: Package, label: "Inventory", path: "/inventory" },
  { icon: Globe, label: "Channel Manager", path: "/channel-manager" },
  { icon: DollarSign, label: "Finance/Account", path: "/finance" },
  { icon: PartyPopper, label: "Banquet", path: "/banquet" },
  { icon: BarChart3, label: "Reports", path: "/reports" },
];

const operationsNavItems = [
  { icon: Moon, label: "Night Audit", path: "/night-audit" },
  { icon: Lock, label: "Day Close", path: "/day-close" },
];

const adminNavItems = [
  { icon: UserCog, label: "User Management", path: "/users" },
  { icon: Users, label: "Staff Management", path: "/staff" },
  { icon: UserCheck, label: "HR", path: "/hr" },
  { icon: Database, label: "Database", path: "/database" },
  { icon: Settings, label: "Settings", path: "/settings" },
  { icon: ShieldCheck, label: "Admin Console", path: "/admin-console" },
  { icon: Code2, label: "Dev Panel", path: "/dev" },
];

function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  const { collapsed, toggleCollapsed, isMobile } = useSidebar();
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();

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
          collapsed && "justify-center px-2"
        )}
      >
        <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-primary")} />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </Link>
    );
  };

  return (
    <div className="flex flex-col h-full w-full min-h-0">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border flex-shrink-0">
        <Link to="/" className="flex items-center gap-3" onClick={onNavClick}>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-gold shadow-glow flex-shrink-0">
            <Hotel className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
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
        {navItems.map(renderNavItem)}

        {/* Operations Section */}
        {!collapsed && (
          <div className="mt-4 mb-2 px-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Operations
            </p>
          </div>
        )}
        {operationsNavItems.map((item) => {
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
                collapsed && "justify-center px-2"
              )}
            >
              <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-primary")} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
        
        {/* Admin Section */}
        {isAdmin && (
          <>
            {!collapsed && (
              <div className="mt-4 mb-2 px-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Admin
                </p>
              </div>
            )}
            {adminNavItems.map(renderNavItem)}
          </>
        )}
      </nav>

      {/* User Section */}
      <div className="mt-auto border-t border-sidebar-border flex-shrink-0 bg-sidebar-background/50 backdrop-blur-sm">
        {!collapsed ? (
          <div className="p-4">
            <Link to="/profile" onClick={onNavClick} className="flex items-center gap-3 mb-3 hover:opacity-80">
              <Avatar className="h-10 w-10 border-2 border-primary/20 shadow-glow shrink-0">
                <AvatarImage src={profile?.avatar_url || ""} alt={profile?.first_name || "User"} />
                <AvatarFallback className="bg-gradient-gold text-primary-foreground font-semibold">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
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
            <Link to="/profile" onClick={onNavClick} className="hover:opacity-80">
              <Avatar className="h-10 w-10 border-2 border-primary/20 shadow-glow">
                <AvatarImage src={profile?.avatar_url || ""} alt={profile?.first_name || "User"} />
                <AvatarFallback className="bg-gradient-gold text-primary-foreground font-semibold">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
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
  const { collapsed } = useSidebar();

  // Always visible fixed sidebar
  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r border-sidebar-border transition-all duration-300 bg-gradient-sidebar overflow-hidden",
        collapsed ? "w-16 sm:w-20" : "w-64"
      )}
    >
      <SidebarContent />
    </aside>
  );
}
