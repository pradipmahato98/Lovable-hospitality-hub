import { useState } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export function HeaderSearch() {
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const [{ data: guests }, { data: rooms }, { data: reservations }] = await Promise.all([
        supabase
          .from("guests")
          .select("id, first_name, last_name, email, phone")
          .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
          .limit(5),
        supabase
          .from("rooms")
          .select("id, room_number, room_type")
          .ilike("room_number", `%${query}%`)
          .limit(5),
        supabase
          .from("reservations")
          .select("id, reservation_code, status")
          .ilike("reservation_code", `%${query}%`)
          .limit(5),
      ]);

      setSearchResults([
        ...(guests || []).map(g => ({ type: "guest", ...g })),
        ...(rooms || []).map(r => ({ type: "room", ...r })),
        ...(reservations || []).map(r => ({ type: "reservation", ...r })),
      ]);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setSearching(false);
    }
  };

  const handleResultClick = (result: any) => {
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
    
    if (result.type === "guest") navigate("/guests");
    else if (result.type === "room") navigate("/rooms");
    else if (result.type === "reservation") navigate("/reservations");
  };

  return (
    <>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => setSearchOpen(true)}
        className="text-muted-foreground hover:text-foreground hover:bg-secondary"
      >
        <Search className="h-4 w-4" />
      </Button>

      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Search</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search guests, rooms, reservations..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9"
                autoFocus
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => { setSearchQuery(""); setSearchResults([]); }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            {searching && (
              <p className="text-sm text-muted-foreground text-center py-4">Searching...</p>
            )}

            {!searching && searchResults.length > 0 && (
              <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                {searchResults.map((result, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg hover:bg-secondary cursor-pointer transition-colors"
                    onClick={() => handleResultClick(result)}
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs capitalize font-normal">{result.type}</Badge>
                      <span className="font-medium text-sm">
                        {result.type === "guest" && `${result.first_name} ${result.last_name}`}
                        {result.type === "room" && `Room ${result.room_number}`}
                        {result.type === "reservation" && result.reservation_code}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 ml-[calc(theme(spacing.2)+3.5rem)]">
                      {result.type === "guest" && (result.email || result.phone)}
                      {result.type === "room" && result.room_type}
                      {result.type === "reservation" && `Status: ${result.status}`}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {!searching && searchQuery.length >= 2 && searchResults.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No results found</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
