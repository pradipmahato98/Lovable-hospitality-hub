import { useState, useEffect, useCallback } from "react";
import {
  Search,
  User,
  Users,
  CheckCircle2,
  LogOut,
  X,
  ExternalLink,
  Loader2,
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
    <div className="relative w-full max-w-4xl" ref={containerRef}>
      <div className="relative w-full sm:w-72 lg:w-96 transition-all duration-300 sm:focus-within:w-96 lg:focus-within:w-[700px] group/search">
        {(loadingGuests || loadingStaff) ? (
          <Loader2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground animate-spin" />
        ) : (
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within/search:text-primary transition-colors" />
        )}
        <Input
          ref={inputRef}
          placeholder="Search modules, guests, or staff..."
          className="w-full pl-10 pr-16 bg-secondary/40 border-border focus-visible:ring-primary shadow-sm group-focus-within/search:shadow-glow group-focus-within/search:bg-background transition-all"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
        />
        {query ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setQuery("");
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 pointer-events-none transition-opacity">
            <kbd className="h-6 min-w-[36px] items-center justify-center rounded-md border border-primary/30 bg-background px-2 font-sans text-[12px] font-bold flex gap-1 shadow-glow text-primary transition-all group-focus-within/search:scale-110">
              <span className="text-sm">⌘</span>K
            </kbd>
          </div>
        )}
      </div>

      {isOpen && query.trim() && (
        <div className="absolute top-full left-0 mt-2 w-full lg:w-[700px] bg-background border rounded-lg shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
          {isRedirecting && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px] z-[60] flex flex-col items-center justify-center animate-in fade-in duration-300">
              <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
              <p className="text-sm font-medium animate-pulse">Redirecting to profile...</p>
            </div>
          )}
          <ScrollArea className="max-h-[400px]">
            <div className="p-2">
              {!hasResults && !loadingGuests && (
                <div className="py-8 text-center text-muted-foreground">
                  No results found for "{query}"
                </div>
              )}

              {results.pages.length > 0 && (
                <div className="mb-4">
                  <h5 className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <Layout className="h-3 w-3" /> Pages & Modules
                  </h5>
                  <div className="space-y-1">
                    {results.pages.map((page, idx) => (
                      <div
                        key={page.path}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors group",
                          selectedIndex === idx ? "bg-muted" : "hover:bg-muted/50"
                        )}
                        onClick={() => {
                          setIsOpen(false);
                          setQuery("");
                          navigate(page.path);
                        }}
                        onMouseEnter={() => setSelectedIndex(idx)}
                      >
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          <page.icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">
                            {highlightText(page.label, query)}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            Navigate to {page.label}
                          </p>
                        </div>
                        <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.guests.length > 0 && (
                <div className="mb-4">
                  <h5 className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-t mt-2 pt-4">
                    <Users className="h-3 w-3" /> Guests
                  </h5>
                  <div className="space-y-1">
                    {results.guests.map((g, idx) => {
                      const absoluteIndex = results.pages.length + idx;
                      return (
                        <div
                          key={g.id}
                          className={cn(
                            "group flex flex-col p-3 rounded-md cursor-pointer transition-colors",
                            selectedIndex === absoluteIndex ? "bg-muted" : "hover:bg-muted/50"
                          )}
                          onClick={() => handleGuestAction({ stopPropagation: () => {} } as any, g, "profile")}
                          onMouseEnter={() => setSelectedIndex(absoluteIndex)}
                        >
                          <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="text-sm font-medium">
                              {highlightText(`${g.first_name} ${g.last_name}`, query)}
                            </p>
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {g.email ? highlightText(g.email, query) : "No email"} • {g.phone ? highlightText(g.phone, query) : "No phone"}
                            </p>
                          </div>
                          {g.is_vip && <Badge className="bg-gradient-gold text-primary-foreground border-transparent text-[10px] h-4">VIP</Badge>}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2 lg:mt-0 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 sm:h-7 px-3 sm:px-2 text-[11px] sm:text-[10px] gap-1 flex-1 lg:flex-initial"
                            onClick={(e) => handleGuestAction(e, g, "check-in")}
                          >
                            <CheckCircle2 className="h-3 w-3 text-success" /> <span className="lg:inline">Check-in</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 sm:h-7 px-3 sm:px-2 text-[11px] sm:text-[10px] gap-1 flex-1 lg:flex-initial"
                            onClick={(e) => handleGuestAction(e, g, "check-out")}
                          >
                            <LogOut className="h-3 w-3 text-destructive" /> <span className="lg:inline">Check-out</span>
                          </Button>
                          <Button
                            variant="gold"
                            size="sm"
                            className="h-8 sm:h-7 px-3 sm:px-2 text-[11px] sm:text-[10px] gap-1 flex-1 lg:flex-initial"
                            onClick={(e) => handleGuestAction(e, g, "profile")}
                          >
                            <ExternalLink className="h-3 w-3" /> <span className="lg:inline">Profile</span>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  </div>
                </div>
              )}

              {results.staff.length > 0 && (
                <div>
                  <h5 className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-t mt-2 pt-4">
                    <User className="h-3 w-3" /> Staff
                  </h5>
                  <div className="space-y-1">
                    {results.staff.map((s, idx) => {
                      const absoluteIndex = results.pages.length + results.guests.length + idx;
                      return (
                        <div
                          key={s.id}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-md cursor-pointer transition-colors",
                            selectedIndex === absoluteIndex ? "bg-muted" : "hover:bg-muted/50"
                          )}
                          onClick={() => {
                            setIsOpen(false);
                            setQuery("");
                            navigate(`/staff?staffId=${s.id}`);
                          }}
                          onMouseEnter={() => setSelectedIndex(absoluteIndex)}
                        >
                          <div>
                            <p className="text-sm font-medium">
                              {highlightText(`${s.first_name} ${s.last_name}`, query)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {s.position} • {highlightText(s.employee_id, query)}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-[10px]">{s.department}</Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      )}

    </div>
  );
}
