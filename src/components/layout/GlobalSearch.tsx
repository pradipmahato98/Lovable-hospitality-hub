import { useState, useMemo, useEffect, useRef } from "react";
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

    const filteredGuests = guests.filter(g =>
      `${g.first_name} ${g.last_name}`.toLowerCase().includes(q) ||
      g.email?.toLowerCase().includes(q) ||
      g.phone?.includes(q) ||
      g.id_number?.includes(q)
    ).slice(0, 5);

    const filteredStaff = staff.filter(s =>
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) ||
      s.employee_id.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q)
    ).slice(0, 3);

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

  const handleGuestAction = (e: React.MouseEvent, guest: Guest, action: "check-in" | "check-out" | "profile") => {
    e.stopPropagation();
    setIsOpen(false);
    if (action === "profile") {
      navigate(`/guests?guestId=${guest.id}`);
    } else {
      // Redirect to front desk or reservations with specific intent
      navigate(`/front-desk?guestId=${guest.id}&action=${action}`);
    }
  };

  return (
    <div className="relative w-full max-w-md" ref={containerRef}>
      <div className="relative">
        {(loadingGuests || loadingStaff) ? (
          <Loader2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground animate-spin" />
        ) : (
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        )}
        <Input
          placeholder="Search..."
          className="w-full sm:w-48 xl:w-64 pl-9 bg-secondary/50 border-border focus-visible:ring-primary transition-all duration-300 sm:focus:w-64 xl:focus:w-80"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
      </div>

      {isOpen && query.trim() && (
        <div className="absolute top-full left-0 mt-2 w-full md:w-[450px] bg-background border rounded-lg shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
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
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-[10px] gap-1"
                            onClick={(e) => handleGuestAction(e, g, "check-in")}
                          >
                            <CheckCircle2 className="h-3 w-3 text-success" /> Check-in
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-[10px] gap-1"
                            onClick={(e) => handleGuestAction(e, g, "check-out")}
                          >
                            <LogOut className="h-3 w-3 text-destructive" /> Check-out
                          </Button>
                          <Button
                            variant="gold"
                            size="sm"
                            className="h-7 px-2 text-[10px] gap-1"
                            onClick={(e) => handleGuestAction(e, g, "profile")}
                          >
                            <ExternalLink className="h-3 w-3" /> Profile
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
