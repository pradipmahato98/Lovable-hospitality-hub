import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  BedDouble,
  Receipt,
  Package,
  BarChart3,
  Settings,
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
  Database,
  ChevronRight,
  User
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useUserRole";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  { icon: Receipt, label: "Journal Entry", path: "/finance/journal/new" },
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

export function AppSidebar() {
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();

  const getInitials = () => {
    const first = profile?.first_name || "";
    const last = profile?.last_name || "";
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || "U";
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-gold text-primary-foreground shadow-glow">
                  <Hotel className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-display font-semibold text-gradient-gold">LuxeStay</span>
                  <span className="text-xs text-muted-foreground">Property Management</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    asChild
                    isActive={item.path === "/" ? location.pathname === "/" : location.pathname.startsWith(item.path)}
                    tooltip={item.label}
                  >
                    <Link to={item.path}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {operationsNavItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname.startsWith(item.path)}
                    tooltip={item.label}
                  >
                    <Link to={item.path}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNavItems.map((item) => (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname.startsWith(item.path)}
                      tooltip={item.label}
                    >
                      <Link to={item.path}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <div className="flex aspect-square size-8 items-center justify-center rounded-full bg-gradient-gold text-primary-foreground shadow-glow">
                    <span className="text-xs font-semibold">{getInitials()}</span>
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {profile?.first_name} {profile?.last_name}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">Staff Member</span>
                  </div>
                  <ChevronRight className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center gap-2 cursor-pointer w-full">
                    <User className="size-4" />
                    My Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signOut} className="text-destructive cursor-pointer">
                  <LogOut className="size-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

export { AppSidebar as Sidebar };
