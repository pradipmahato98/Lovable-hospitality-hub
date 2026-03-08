import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  BedDouble,
  Package,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
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
  Moon,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/hooks/use-sidebar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useUserRole";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const standaloneItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
];

const moduleItems: NavItem[] = [
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
  { icon: Moon, label: "Night Audit", path: "/night-audit" },
  { icon: Lock, label: "Day Close", path: "/day-close" },
  { icon: BarChart3, label: "Reports", path: "/reports" },
];

const adminNavItems: NavItem[] = [
  { icon: UserCog, label: "User Management", path: "/users" },
  { icon: Users, label: "Staff Management", path: "/staff" },
  { icon: UserCheck, label: "HR", path: "/hr" },
  { icon: Settings, label: "Settings", path: "/settings" },
  { icon: ShieldCheck, label: "Admin Console", path: "/admin-console" },
  { icon: Code2, label: "Dev Panel", path: "/dev" },
];

function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  const { collapsed, toggleCollapsed, isMobile } = useSidebar();
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const showLabels = !collapsed || isMobile;

  // Auto-open groups containing the active route
  const activeGroups = moduleGroups
    .filter((g) => g.items.some((i) => location.pathname === i.path))
    .map((g) => g.label);

  const [openGroups, setOpenGroups] = useState<Set<string>>(
    new Set([...activeGroups, "Admin"])
  );

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const getInitials = () => {
    const first = profile?.first_name || "";
    const last = profile?.last_name || "";
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || "U";
  };

  const renderNavItem = (item: NavItem) => {
    const isActive = location.pathname === item.path;
    return (
      <Link
        key={item.path}
        to={item.path}
        onClick={onNavClick}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
          isActive
            ? "bg-sidebar-accent text-primary shadow-glow"
            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground",
          collapsed && !isMobile && "justify-center px-2"
        )}
      >
        <item.icon className={cn("h-4 w-4 flex-shrink-0", isActive && "text-primary")} />
        {showLabels && <span>{item.label}</span>}
      </Link>
    );
  };

  const renderGroup = (group: NavGroup) => {
    const isOpen = openGroups.has(group.label);
    const hasActive = group.items.some((i) => location.pathname === i.path);

    if (!showLabels) {
      // Collapsed: just show icons
      return (
        <div key={group.label} className="space-y-0.5">
          {group.items.map(renderNavItem)}
        </div>
      );
    }

    return (
      <Collapsible
        key={group.label}
        open={isOpen}
        onOpenChange={() => toggleGroup(group.label)}
      >
        <CollapsibleTrigger asChild>
          <button
            className={cn(
              "flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors",
              hasActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span>{group.label}</span>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 transition-transform duration-200",
                isOpen && "rotate-180"
              )}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-0.5 pl-1">
          {group.items.map(renderNavItem)}
        </CollapsibleContent>
      </Collapsible>
    );
  };

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-3" onClick={onNavClick}>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-gold shadow-glow flex-shrink-0">
            <Hotel className="h-5 w-5 text-primary-foreground" />
          </div>
          {showLabels && (
            <span className="font-display text-xl font-semibold text-gradient-gold">
              LuxeStay
            </span>
          )}
        </Link>
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapsed}
            className="h-8 w-8 text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent flex-shrink-0"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-0.5 p-3 overflow-y-auto">
        {standaloneItems.map(renderNavItem)}

        <div className="mt-2 space-y-1">
          {moduleGroups.map(renderGroup)}
        </div>

        {/* Admin Section */}
        {isAdmin && (
          <div className="mt-2">
            {showLabels ? (
              <Collapsible
                open={openGroups.has("Admin")}
                onOpenChange={() => toggleGroup("Admin")}
              >
                <CollapsibleTrigger asChild>
                  <button
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors",
                      adminNavItems.some((i) => location.pathname === i.path)
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span>Admin</span>
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 transition-transform duration-200",
                        openGroups.has("Admin") && "rotate-180"
                      )}
                    />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-0.5 pl-1">
                  {adminNavItems.map(renderNavItem)}
                </CollapsibleContent>
              </Collapsible>
            ) : (
              <div className="space-y-0.5">
                {adminNavItems.map(renderNavItem)}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* User Section */}
      {showLabels && (
        <div className="p-4 border-t border-sidebar-border mt-auto">
          <Link to="/profile" onClick={onNavClick} className="flex items-center gap-3 mb-3 hover:opacity-80">
            <div className="h-10 w-10 rounded-full bg-gradient-gold flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-semibold text-primary-foreground">{getInitials()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {profile?.first_name || "User"} {profile?.last_name || ""}
              </p>
              <p className="text-xs text-muted-foreground truncate">Staff Member</p>
            </div>
          </Link>
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground" onClick={signOut}>
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      )}

      {/* Collapsed User Avatar */}
      {collapsed && !isMobile && (
        <div className="p-3 border-t border-sidebar-border mt-auto flex flex-col items-center gap-2">
          <Link to="/profile" className="h-10 w-10 rounded-full bg-gradient-gold flex items-center justify-center hover:opacity-80">
            <span className="text-sm font-semibold text-primary-foreground">{getInitials()}</span>
          </Link>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={signOut}>
            <LogOut className="h-4 w-4" />
          </Button>
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
        "fixed left-0 top-0 z-40 h-screen bg-gradient-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <SidebarContent />
    </aside>
  );
}
