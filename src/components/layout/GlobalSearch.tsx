import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Search, User, Users, CheckCircle2, LogOut, ExternalLink, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useGuests, Guest } from "@/hooks/useGuests";
import { useStaff } from "@/hooks/useStaff";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { data: guests = [], isLoading: loadingGuests } = useGuests();
  const { data: staff = [], isLoading: loadingStaff } = useStaff();

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
    if (!query.trim()) return { guests: [], staff: [] };
    const q = query.toLowerCase();

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

    return { guests: filteredGuests, staff: filteredStaff };
  }, [query, guests, staff]);

  const hasResults = results.guests.length > 0 || results.staff.length > 0;

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
    if (e.key === "Enter") {
      if (results.guests.length > 0) {
        handleGuestAction({ stopPropagation: () => {} }, results.guests[0], "profile");
      } else if (results.staff.length > 0) {
        setIsOpen(false);
        setQuery("");
        navigate(`/staff?staffId=${results.staff[0].id}`);
      }
    }
  };

  return (
    <div className="relative w-full max-w-md" ref={containerRef}>
      <div className="relative w-full sm:w-48 xl:w-64 transition-all duration-300 sm:focus-within:w-64 xl:focus-within:w-80 group/search">
        {(loadingGuests || loadingStaff) ? (
          <Loader2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground animate-spin" />
        ) : (
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        )}
        <Input
          ref={inputRef}
          placeholder="Search modules, guests, or staff..."
          className="w-full pl-9 bg-secondary/50 border-border focus-visible:ring-primary"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
        />
        {!query && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 pointer-events-none opacity-50 transition-opacity group-focus-within/search:opacity-0">
            <kbd className="h-5 min-w-[20px] items-center justify-center rounded border bg-muted px-1.5 font-sans text-[10px] font-medium flex gap-0.5">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>
        )}
      </div>

      {isOpen && query.trim() && (
        <div className="absolute top-full left-0 mt-2 w-full md:w-[450px] bg-background border rounded-lg shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
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

              {results.guests.length > 0 && (
                <div className="mb-4">
                  <h5 className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <Users className="h-3 w-3" /> Guests
                  </h5>
                  <div className="space-y-1">
                    {results.guests.map((g) => (
                      <div
                        key={g.id}
                        className="group flex flex-col p-3 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => handleGuestAction({ stopPropagation: () => {} } as any, g, "profile")}
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
                    ))}
                  </div>
                </div>
              )}

              {results.staff.length > 0 && (
                <div>
                  <h5 className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-t mt-2 pt-4">
                    <User className="h-3 w-3" /> Staff
                  </h5>
                  <div className="space-y-1">
                    {results.staff.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between p-3 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => {
                          setIsOpen(false);
                          navigate(`/staff?staffId=${s.id}`);
                        }}
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
                    ))}
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
