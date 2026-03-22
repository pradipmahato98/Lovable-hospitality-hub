import {
  LayoutDashboard, CalendarDays, Users, BedDouble, Sparkles, Wrench,
  ShoppingCart, Package, Globe, DollarSign, PartyPopper, Target, Briefcase,
  BarChart3, Moon, Lock, UserCog, UserCheck, Settings, ShieldCheck, Code2,
  LucideIcon
} from "lucide-react";

export interface NavSubItem {
  label: string;
  tab?: string;
  path?: string;
}

export interface NavItemConfig {
  icon: LucideIcon;
  label: string;
  path: string;
  subItems?: NavSubItem[];
  defaultTab?: string;
}

export const navItems: NavItemConfig[] = [
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
    icon: Package,
    label: "Inventory",
    path: "/inventory",
    defaultTab: "items",
    subItems: [
      { label: "Item Master", tab: "items" },
      { label: "Suppliers", tab: "suppliers" },
      { label: "Purchase Orders", tab: "orders" },
      { label: "Stock Issues", tab: "issue" },
      { label: "Movements", tab: "movements" },
      { label: "Stock Count", tab: "stock-count" },
      { label: "Reports", tab: "stock-on-hand" },
    ]
  },
  { icon: Lock, label: "Day Close", path: "/day-close" },
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

export const operationsNavItems: NavItemConfig[] = [];

export const adminNavItems: NavItemConfig[] = [
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
      { label: "UI", tab: "ui" },
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
