import { useState } from "react";
import { Bell, Search, Menu, Moon, Sun, User, X, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { Input } from "@/components/ui/input";
import { useSidebar } from "@/hooks/use-sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useNotifications } from "@/hooks/useNotifications";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  category: string;
  is_read: boolean;
  created_at: string;
}

const categoryColors: Record<string, string> = {
  booking: "bg-success",
  checkin: "bg-blue-500",
  settings: "bg-amber-500",
  alert: "bg-destructive",
  info: "bg-muted-foreground",
};

export function Header({ title, subtitle }: HeaderProps) {
  const { isMobile, setMobileOpen } = useSidebar();
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // Use the notifications hook with realtime
  const { notifications, unreadCount, markAsRead } = useNotifications();
  useRealtimeNotifications();

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  // Search functionality
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      // Search guests
      const { data: guests } = await supabase
        .from("guests")
        .select("id, first_name, last_name, email, phone")
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
        .limit(5);

      // Search rooms
      const { data: rooms } = await supabase
        .from("rooms")
        .select("id, room_number, room_type")
        .ilike("room_number", `%${query}%`)
        .limit(5);

      // Search reservations
      const { data: reservations } = await supabase
        .from("reservations")
        .select("id, reservation_code, status")
        .ilike("reservation_code", `%${query}%`)
        .limit(5);

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
    
    if (result.type === "guest") {
      navigate("/guests");
    } else if (result.type === "room") {
      navigate("/rooms");
    } else if (result.type === "reservation") {
      navigate("/reservations");
    }
  };

  const getInitials = () => {
    const first = profile?.first_name || "";
    const last = profile?.last_name || "";
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || "U";
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 backdrop-blur-xl px-4 lg:px-6 gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen(true)}
              className="flex-shrink-0 text-foreground hover:bg-secondary"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-display font-semibold text-foreground truncate">{title}</h1>
            {subtitle && <p className="text-xs sm:text-sm text-muted-foreground truncate">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Search Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setSearchOpen(true)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Search className="h-5 w-5" />
          </Button>

          {/* Theme Toggle */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme}
            className="text-muted-foreground hover:text-foreground"
          >
            {resolvedTheme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="text-xs">{unreadCount} new</Badge>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No notifications
                </div>
              ) : (
                <>
                  <div className="max-h-[300px] overflow-y-auto">
                    {notifications.slice(0, 5).map((notification) => (
                      <DropdownMenuItem
                        key={notification.id}
                        className="flex items-start gap-3 p-3 cursor-pointer"
                        onClick={() => markAsRead.mutate(notification.id)}
                      >
                        <div className={`h-2 w-2 rounded-full mt-2 ${categoryColors[notification.category] || categoryColors.info}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${notification.is_read ? 'text-muted-foreground' : 'text-foreground'}`}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{notification.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(notification.created_at), "MMM d, h:mm a")}
                          </p>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="justify-center text-primary font-medium cursor-pointer"
                    onClick={() => navigate("/staff?tab=about&sub=alert")}
                  >
                    View All Alerts
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <div className="h-8 w-8 rounded-full bg-gradient-gold flex items-center justify-center">
                  <span className="text-xs font-semibold text-primary-foreground">{getInitials()}</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div>
                  <p className="font-medium">{profile?.first_name} {profile?.last_name}</p>
                  <p className="text-xs text-muted-foreground">{profile?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/staff?tab=about&sub=details" className="flex items-center gap-2 cursor-pointer">
                  <User className="h-4 w-4" />
                  My Account
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-destructive cursor-pointer">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Search Dialog */}
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
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {searchResults.map((result, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg bg-secondary/50 hover:bg-secondary cursor-pointer"
                    onClick={() => handleResultClick(result)}
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs capitalize">{result.type}</Badge>
                      <span className="font-medium">
                        {result.type === "guest" && `${result.first_name} ${result.last_name}`}
                        {result.type === "room" && `Room ${result.room_number}`}
                        {result.type === "reservation" && result.reservation_code}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
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
