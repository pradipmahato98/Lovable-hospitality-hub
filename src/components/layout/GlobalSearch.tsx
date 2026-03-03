import { useState, useMemo, useEffect, useRef, useCallback } from "react";
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
  Layout,
  UtensilsCrossed,
  CreditCard
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useGuests, Guest } from "@/hooks/useGuests";
import { useStaff } from "@/hooks/useStaff";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsAdmin } from "@/hooks/useUserRole";
import { cn } from "@/lib/utils";

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
  { icon: DollarSign, label: "Finance/Account", path: "/finance", keywords: ["accounting", "ledger", "journal", "expenses"] },
  { icon: CreditCard, label: "Payments", path: "/payments", keywords: ["transactions", "gateway", "eSewa", "Khalti"] },
  { icon: PartyPopper, label: "Banquet", path: "/banquet", keywords: ["events", "functions", "meetings"] },
  { icon: Database, label: "Database", path: "/database", keywords: ["sql", "tables", "data"], isAdmin: true },
  { icon: ShieldCheck, label: "Admin Console", path: "/admin-console", keywords: ["system admin", "dashboard"], isAdmin: true },
  { icon: Code2, label: "Dev Panel", path: "/dev", keywords: ["developer", "debug", "logs"], isAdmin: true },
  { icon: User, label: "My Profile", path: "/profile", keywords: ["account", "me", "avatar"] },
  { icon: Hotel, label: "LuxeStay Home", path: "/", keywords: ["home", "main", "start"] },
];

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { isAdmin } = useIsAdmin();

  const { data: guests = [], isLoading: loadingGuests } = useGuests();
  const { data: staff = [], isLoading: loadingStaff } = useStaff();

  // Keyboard shortcut (Cmd+K or Ctrl+K) - only focus if it's already visible
  // or use an alternative shortcut if needed to avoid conflict with CommandPalette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const ctrlKey = isMac ? e.metaKey : e.ctrlKey;

      if (ctrlKey && e.key === "k") {
        // Only focus the search input if it exists in the DOM
        if (inputRef.current) {
          e.preventDefault();
          inputRef.current.focus();
          setIsOpen(true);
        }
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown, true); // Use capture to prioritize
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) {
      return { guests: [], staff: [], pages: [], all: [] };
    }
    const q = query.toLowerCase();

    // Filter pages
    const filteredPages = PAGES_DATA.filter(page => {
      if (page.isAdmin && !isAdmin) return false;
      return (
        page.label.toLowerCase().includes(q) ||
        page.keywords.some(k => k.toLowerCase().includes(q))
      );
    }).slice(0, 8);

    // Deduplicate guests by ID and signature to handle potential DB duplicates
    const guestMap = new Map<string, Guest>();
    const seenSignatures = new Set<string>();

    guests.forEach(g => {
      const matches =
        `${g.first_name} ${g.last_name}`.toLowerCase().includes(q) ||
        g.email?.toLowerCase().includes(q) ||
        g.phone?.includes(q) ||
        g.id_number?.includes(q);

      if (matches) {
        const signature = `${g.first_name}|${g.last_name}|${g.email || ''}`.toLowerCase();
        if (!guestMap.has(g.id) && !seenSignatures.has(signature)) {
          guestMap.set(g.id, g);
          seenSignatures.add(signature);
        }
      }
    });

    const filteredGuests = Array.from(guestMap.values()).slice(0, 5);

    // Deduplicate staff by ID and signature
    const staffMap = new Map<string, any>();
    const seenStaffSignatures = new Set<string>();

    staff.forEach(s => {
      const matches =
        `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) ||
        s.employee_id.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q);

      if (matches) {
        const signature = `${s.first_name}|${s.last_name}|${s.email || ''}`.toLowerCase();
        if (!staffMap.has(s.id) && !seenStaffSignatures.has(signature)) {
          staffMap.set(s.id, s);
          seenStaffSignatures.add(signature);
        }
      }
    });

    const filteredStaff = Array.from(staffMap.values()).slice(0, 3);

    const all = [
      ...filteredPages.map(p => ({ type: 'page' as const, data: p })),
      ...filteredGuests.map(g => ({ type: 'guest' as const, data: g })),
      ...filteredStaff.map(s => ({ type: 'staff' as const, data: s }))
    ];

    return { guests: filteredGuests, staff: filteredStaff, pages: filteredPages, all };
  }, [query, guests, staff, isAdmin]);

  const hasResults = results.all.length > 0;

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    // Escape special characters for regex
    const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escapedHighlight})`, "gi"));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <span key={i} className="bg-yellow-500/30 text-foreground font-bold">{part}</span>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  const handleGuestAction = useCallback((e: React.MouseEvent | { stopPropagation: () => void }, guest: Guest, action: "check-in" | "check-out" | "profile") => {
    e.stopPropagation();
    setIsOpen(false);
    setQuery("");
    if (action === "profile") {
      navigate(`/guests?guestId=${guest.id}`);
    } else {
      // Redirect to front desk or reservations with specific intent
      navigate(`/front-desk?guestId=${guest.id}&action=${action}`);
    }
  }, [navigate]);

  // Auto-redirect logic
  useEffect(() => {
    if (!query.trim()) return;

    const q = query.toLowerCase();

    // Check for exact matches in guests
    const exactGuest = results.guests.find(g =>
      g.email?.toLowerCase() === q ||
      g.phone === query ||
      g.id_number === query ||
      `${g.first_name} ${g.last_name}`.toLowerCase() === q
    );

    if (exactGuest && query.length >= 3) {
      setIsRedirecting(true);
      const timer = setTimeout(() => {
        setIsRedirecting(false);
        handleGuestAction({ stopPropagation: () => {} }, exactGuest, "profile");
      }, 1200);
      return () => {
        clearTimeout(timer);
        setIsRedirecting(false);
      };
    }
  }, [query, results.guests, navigate, handleGuestAction]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (results.all.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % results.all.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + results.all.length) % results.all.length);
    } else if (e.key === "Enter") {
      const selected = results.all[selectedIndex];
      if (selected) {
        if (selected.type === 'page') {
          setIsOpen(false);
          setQuery("");
          navigate(selected.data.path);
        } else if (selected.type === 'guest') {
          handleGuestAction({ stopPropagation: () => {} }, selected.data, "profile");
        } else if (selected.type === 'staff') {
          setIsOpen(false);
          setQuery("");
          navigate(`/staff?staffId=${selected.data.id}`);
        }
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative w-full sm:w-72 lg:w-96" ref={containerRef}>
      <div className="relative w-full group/search">
        {(loadingGuests || loadingStaff) ? (
          <Loader2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground animate-spin" />
        ) : (
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within/search:text-primary transition-colors" />
        )}
        <Input
          ref={inputRef}
          placeholder="Search modules, guests, or staff..."
          className="w-full pl-10 pr-12 bg-secondary/40 border-border focus-visible:ring-primary shadow-sm group-focus-within/search:shadow-glow group-focus-within/search:bg-background transition-all"
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
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setQuery("");
              requestAnimationFrame(() => {
                inputRef.current?.focus();
              });
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 flex items-center justify-center rounded-full bg-muted/60 hover:bg-muted active:bg-muted/80 transition-all text-muted-foreground hover:text-foreground active:scale-90 z-10"
            aria-label="Clear search"
            title="Clear search"
          >
            <X className="h-4 w-4" />
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
        <div className="absolute top-full left-0 mt-2 w-full bg-background border rounded-lg shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
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
