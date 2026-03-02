import { useState, useEffect, useCallback } from "react";
import {
  Search,
  User,
  Users,
  LayoutDashboard,
  CalendarDays,
  Calendar,
  BedDouble,
  Receipt,
  Package,
  BarChart3,
  Settings,
  Hotel,
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
  History,
  UtensilsCrossed,
  CreditCard
} from "lucide-react";
import { useGuests } from "@/hooks/useGuests";
import { useStaff } from "@/hooks/useStaff";
import { useNavigate } from "react-router-dom";
import { useIsAdmin } from "@/hooks/useUserRole";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";

const PAGES_DATA = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/", keywords: ["home", "main", "overview"] },
  { icon: CalendarDays, label: "Reservations", path: "/reservations", keywords: ["booking", "stays", "calendar"] },
  { icon: Calendar, label: "Reservation Calendar", path: "/calendar", keywords: ["bookings", "schedule", "occupancy"] },
  { icon: Users, label: "Guests", path: "/guests", keywords: ["customers", "profiles", "visitors"] },
  { icon: BedDouble, label: "Front Desk", path: "/front-desk", keywords: ["reception", "checkin", "checkout", "arrivals", "departures"] },
  { icon: Receipt, label: "Billing", path: "/billing", keywords: ["invoice", "payment", "folio", "checkout"] },
  { icon: Sparkles, label: "Housekeeping", path: "/housekeeping", keywords: ["cleaning", "rooms", "maintenance"] },
  { icon: Wrench, label: "Engineering", path: "/engineering", keywords: ["maintenance", "repairs", "work orders"] },
  { icon: ShoppingCart, label: "POS", path: "/pos", keywords: ["point of sale", "restaurant", "bar", "dining"] },
  { icon: Terminal, label: "POS Terminal", path: "/pos/terminal", keywords: ["order", "sale", "cashier"] },
  { icon: History, label: "POS History", path: "/pos/history", keywords: ["transactions", "orders", "past sales"] },
  { icon: BarChart3, label: "POS Reports", path: "/pos/reports", keywords: ["analytics", "sales data"] },
  { icon: UtensilsCrossed, label: "Kitchen Display", path: "/pos/kitchen", keywords: ["orders", "chef", "cooking"] },
  { icon: Package, label: "Inventory", path: "/inventory", keywords: ["stock", "supplies", "items"] },
  { icon: Globe, label: "Channel Manager", path: "/channel-manager", keywords: ["ota", "booking.com", "expedia", "sync"] },
  { icon: Moon, label: "Night Audit", path: "/night-audit", keywords: ["day close", "reconciliation", "rollover"] },
  { icon: Lock, label: "Day Close", path: "/day-close", keywords: ["end of day", "settlement"] },
  { icon: BarChart3, label: "Reports", path: "/reports", keywords: ["analytics", "statistics", "business intelligence"] },
  { icon: Settings, label: "Settings", path: "/settings", keywords: ["configuration", "preferences", "system"] },
  { icon: UserCog, label: "User Management", path: "/users", keywords: ["accounts", "permissions", "access"], isAdmin: true },
  { icon: Users, label: "Staff Management", path: "/staff", keywords: ["employees", "profiles"], isAdmin: true },
  { icon: UserCheck, label: "HR", path: "/hr", keywords: ["human resources", "recruitment", "payroll"], isAdmin: true },
  { icon: DollarSign, label: "Finance/Account", path: "/finance", keywords: ["accounting", "ledger", "expenses"] },
  { icon: Receipt, label: "New Journal Entry", path: "/finance/journal/new", keywords: ["accounting", "journal", "voucher", "entry"] },
  { icon: CreditCard, label: "Payments", path: "/payments", keywords: ["transactions", "gateway", "eSewa", "Khalti"] },
  { icon: PartyPopper, label: "Banquet", path: "/banquet", keywords: ["events", "functions", "meetings"] },
  { icon: Database, label: "Database", path: "/database", keywords: ["sql", "tables", "data"], isAdmin: true },
  { icon: ShieldCheck, label: "Admin Console", path: "/admin-console", keywords: ["system admin", "dashboard"], isAdmin: true },
  { icon: Code2, label: "Dev Panel", path: "/dev", keywords: ["developer", "debug", "logs"], isAdmin: true },
  { icon: User, label: "My Profile", path: "/profile", keywords: ["account", "me", "avatar"] },
  { icon: Hotel, label: "LuxeStay Home", path: "/", keywords: ["home", "main", "start"] },
];

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { isAdmin } = useIsAdmin();

  const { data: guests = [] } = useGuests();
  const { data: staff = [] } = useStaff();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-full justify-start rounded-[0.5rem] bg-background text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-40 lg:w-64"
        onClick={() => setOpen(true)}
      >
        <span className="hidden lg:inline-flex">Search modules...</span>
        <span className="inline-flex lg:hidden">Search...</span>
        <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Pages & Modules">
            {PAGES_DATA.filter(p => !p.isAdmin || isAdmin).map((page) => (
              <CommandItem
                key={page.path}
                value={`${page.label} ${page.keywords.join(" ")}`}
                onSelect={() => {
                  runCommand(() => navigate(page.path));
                }}
              >
                <page.icon className="mr-2 h-4 w-4" />
                <span>{page.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Guests">
            {guests.slice(0, 10).map((guest) => (
              <CommandItem
                key={guest.id}
                value={`${guest.first_name} ${guest.last_name}`}
                onSelect={() => {
                  runCommand(() => navigate(`/guests?guestId=${guest.id}`));
                }}
              >
                <Users className="mr-2 h-4 w-4" />
                <span>{guest.first_name} {guest.last_name}</span>
                <span className="ml-auto text-xs text-muted-foreground">{guest.email}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Staff">
            {staff.slice(0, 10).map((member) => (
              <CommandItem
                key={member.id}
                value={`${member.first_name} ${member.last_name}`}
                onSelect={() => {
                  runCommand(() => navigate(`/staff?staffId=${member.id}`));
                }}
              >
                <User className="mr-2 h-4 w-4" />
                <span>{member.first_name} {member.last_name}</span>
                <span className="ml-auto text-xs text-muted-foreground">{member.position}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
