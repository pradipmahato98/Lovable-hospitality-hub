import { useState, useEffect, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  CalendarDays,
  Users,
  DollarSign,
  Plus,
  Search,
  Clock,
  MapPin,
  FileText,
  Wifi,
  WifiOff,
  UtensilsCrossed,
  Layout,
  BarChart3,
  Eye,
  X,
  ArrowUpDown,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { 
  DraggableBanquetCalendar,
  EventReportsPanel,
  CateringManagementPanel,
  VenueSetupPanel,
} from "@/components/banquet";

interface BanquetEvent {
  id: string;
  event_name: string;
  event_type: string;
  client_name: string;
  client_phone: string | null;
  client_email: string | null;
  event_date: string;
  start_time: string;
  end_time: string;
  venue: string;
  guest_count: number;
  status: "inquiry" | "confirmed" | "in_progress" | "completed" | "cancelled";
  menu_package: string | null;
  special_requests: string | null;
  total_amount: number;
  deposit_amount: number | null;
  notes: string | null;
  created_at: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

const eventTypeColors: Record<string, string> = {
  wedding: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  corporate: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  birthday: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  conference: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  social: "bg-green-500/20 text-green-400 border-green-500/30",
  other: "bg-muted text-muted-foreground border-muted",
};

const statusColors: Record<string, string> = {
  inquiry: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  confirmed: "bg-success/20 text-success border-success/30",
  in_progress: "bg-primary/20 text-primary border-primary/30",
  completed: "bg-muted text-muted-foreground border-muted",
  cancelled: "bg-destructive/20 text-destructive border-destructive/30",
};

export default function Banquet() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("events");
  const [searchQuery, setSearchQuery] = useState("");
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<BanquetEvent | null>(null);
  const [editingEvent, setEditingEvent] = useState<BanquetEvent | null>(null);

  // Filtering & Sorting state
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [venueFilter, setVenueFilter] = useState<string>("all");
  const [sortConfig, setSortConfig] = useState<{ key: keyof BanquetEvent; direction: 'asc' | 'desc' } | null>(null);

  const [realtimeStatus, setRealtimeStatus] = useState<
    "connecting" | "connected" | "error"
  >("connecting");

  const [newEvent, setNewEvent] = useState({
    event_name: "",
    event_type: "corporate",
    client_name: "",
    client_phone: "",
    client_email: "",
    event_date: new Date().toISOString().slice(0, 10),
    start_time: "10:00",
    end_time: "14:00",
    venue: "",
    guest_count: 50,
    menu_package: "",
    special_requests: "",
    total_amount: 0,
    deposit_amount: 0,
  });

  // Fetch events
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["banquet-events"],
    queryFn: async () => {
      const { data, error } = await db
        .from("banquet_events")
        .select("*")
        .order("event_date", { ascending: true });

      if (error) {
        console.error("Error fetching banquet events:", error);
        return [];
      }

      return data as BanquetEvent[];
    },
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("banquet-events-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "banquet_events" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["banquet-events"] });
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setRealtimeStatus("connected");
        else if (status === "CHANNEL_ERROR") setRealtimeStatus("error");
        else setRealtimeStatus("connecting");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Create event mutation
  const createEvent = useMutation({
    mutationFn: async (
      event: Omit<BanquetEvent, "id" | "created_at" | "status">
    ) => {
      const { data, error } = await db
        .from("banquet_events")
        .insert({ ...event, status: "inquiry" })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banquet-events"] });
      toast.success("Event created successfully");
      setEventDialogOpen(false);
      resetNewEvent();
    },
    onError: () => {
      toast.error("Failed to create event");
    },
  });
 
   // Update event mutation
   const updateEvent = useMutation({
     mutationFn: async ({
       id,
       updates,
     }: {
       id: string;
       updates: Partial<BanquetEvent>;
     }) => {
       const { error } = await db
         .from("banquet_events")
         .update(updates)
         .eq("id", id);
 
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["banquet-events"] });
       toast.success("Event updated successfully");
       setEventDialogOpen(false);
       setEditingEvent(null);
       resetNewEvent();
     },
     onError: () => {
       toast.error("Failed to update event");
     },
   });

  // Update status mutation
  const updateStatus = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: BanquetEvent["status"];
    }) => {
      const { error } = await db
        .from("banquet_events")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banquet-events"] });
      toast.success("Status updated");
    },
    onError: () => {
      toast.error("Failed to update status");
    },
  });

  // Reschedule event mutation (for drag-and-drop)
  const rescheduleEvent = useMutation({
    mutationFn: async ({ id, newDate }: { id: string; newDate: string }) => {
      const { error } = await db
        .from("banquet_events")
        .update({ event_date: newDate })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banquet-events"] });
    },
    onError: () => {
      toast.error("Failed to reschedule event");
    },
  });

  const handleEventDrop = async (eventId: string, newDate: string) => {
    await rescheduleEvent.mutateAsync({ id: eventId, newDate });
  };

  const resetNewEvent = () => {
    setNewEvent({
      event_name: "",
      event_type: "corporate",
      client_name: "",
      client_phone: "",
      client_email: "",
      event_date: new Date().toISOString().slice(0, 10),
      start_time: "10:00",
      end_time: "14:00",
      venue: "",
      guest_count: 50,
      menu_package: "",
      special_requests: "",
      total_amount: 0,
      deposit_amount: 0,
    });
     setEditingEvent(null);
  };
 
   const handleEditEvent = (event: BanquetEvent) => {
     setEditingEvent(event);
     setNewEvent({
       event_name: event.event_name,
       event_type: event.event_type,
       client_name: event.client_name,
       client_phone: event.client_phone || "",
       client_email: event.client_email || "",
       event_date: event.event_date,
       start_time: event.start_time,
       end_time: event.end_time,
       venue: event.venue,
       guest_count: event.guest_count,
       menu_package: event.menu_package || "",
       special_requests: event.special_requests || "",
       total_amount: event.total_amount,
       deposit_amount: event.deposit_amount || 0,
     });
     setEventDialogOpen(true);
   };
 
   const handleSaveEvent = () => {
     if (!newEvent.event_name || !newEvent.client_name || !newEvent.venue) {
       toast.error("Please fill in event name, client name, and venue");
       return;
     }
 
     if (editingEvent) {
       updateEvent.mutate({
         id: editingEvent.id,
         updates: {
           event_name: newEvent.event_name,
           event_type: newEvent.event_type,
           client_name: newEvent.client_name,
           client_phone: newEvent.client_phone || null,
           client_email: newEvent.client_email || null,
           event_date: newEvent.event_date,
           start_time: newEvent.start_time,
           end_time: newEvent.end_time,
           venue: newEvent.venue,
           guest_count: newEvent.guest_count,
           menu_package: newEvent.menu_package || null,
           special_requests: newEvent.special_requests || null,
           total_amount: newEvent.total_amount,
           deposit_amount: newEvent.deposit_amount || null,
         },
       });
     } else {
       handleCreateEvent();
     }
   };

  const handleCreateEvent = () => {
    if (!newEvent.event_name || !newEvent.client_name || !newEvent.venue) {
      toast.error("Please fill in event name, client name, and venue");
      return;
    }

    createEvent.mutate({
      event_name: newEvent.event_name,
      event_type: newEvent.event_type,
      client_name: newEvent.client_name,
      client_phone: newEvent.client_phone || null,
      client_email: newEvent.client_email || null,
      event_date: newEvent.event_date,
      start_time: newEvent.start_time,
      end_time: newEvent.end_time,
      venue: newEvent.venue,
      guest_count: newEvent.guest_count,
      menu_package: newEvent.menu_package || null,
      special_requests: newEvent.special_requests || null,
      total_amount: newEvent.total_amount,
      deposit_amount: newEvent.deposit_amount || null,
      notes: null,
    });
  };

  // Filter and Sort events
  const filteredEvents = useMemo(() => {
    const result = events.filter((e) => {
      const matchesSearch =
        e.event_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.client_name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || e.status === statusFilter;
      const matchesType = typeFilter === "all" || e.event_type === typeFilter;
      const matchesVenue = venueFilter === "all" || e.venue === venueFilter;

      return matchesSearch && matchesStatus && matchesType && matchesVenue;
    });

    if (sortConfig) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [events, searchQuery, statusFilter, typeFilter, venueFilter, sortConfig]);

  const uniqueVenues = useMemo(() => {
    const venues = events.map(e => e.venue).filter(Boolean);
    return Array.from(new Set(venues));
  }, [events]);

  const handleSort = (key: keyof BanquetEvent) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setTypeFilter("all");
    setVenueFilter("all");
    setSortConfig(null);
  };

  // Metrics
  const upcomingEvents = events.filter(
    (e) =>
      e.status !== "completed" &&
      e.status !== "cancelled" &&
      new Date(e.event_date) >= new Date()
  );
  const totalRevenue = events
    .filter((e) => e.status === "completed")
    .reduce((sum, e) => sum + e.total_amount, 0);
  const pendingDeposits = events
    .filter((e) => e.status === "confirmed")
    .reduce((sum, e) => sum + (e.deposit_amount || 0), 0);

  return (
    <MainLayout title="Banquet & Events" subtitle="Manage events, bookings, and catering">
      <div className="space-y-6">
        {/* Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Upcoming Events"
            value={upcomingEvents.length.toString()}
            change={`${events.filter((e) => e.status === "inquiry").length} inquiries`}
            changeType="neutral"
            icon={CalendarDays}
            delay={0}
          />
          <MetricCard
            title="Total Guests Expected"
            value={upcomingEvents.reduce((s, e) => s + e.guest_count, 0).toString()}
            change="Across all events"
            changeType="neutral"
            icon={Users}
            delay={50}
          />
          <MetricCard
            title="Revenue (Completed)"
            value={`$${totalRevenue.toLocaleString()}`}
            change="From completed events"
            changeType="positive"
            icon={DollarSign}
            delay={100}
          />
          <MetricCard
            title="Pending Deposits"
            value={`$${pendingDeposits.toLocaleString()}`}
            change="Confirmed events"
            changeType="neutral"
            icon={FileText}
            delay={150}
          />
        </div>

        {/* Connection Status */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {realtimeStatus === "connected" ? (
            <Wifi className="h-4 w-4 text-success" />
          ) : (
            <WifiOff className="h-4 w-4 text-destructive" />
          )}
          <span>
            {realtimeStatus === "connected" ? "Real-time sync active" : "Connecting..."}
          </span>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="events" className="gap-2">
              <CalendarDays className="h-4 w-4" />
              Events
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-2">
              <Clock className="h-4 w-4" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="catering" className="gap-2">
              <UtensilsCrossed className="h-4 w-4" />
              Catering
            </TabsTrigger>
            <TabsTrigger value="venue" className="gap-2">
              <Layout className="h-4 w-4" />
              Venue Setup
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="space-y-4">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2 flex-1 max-w-md">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search events..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-9"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <Button variant="outline" size="sm" onClick={clearFilters} className="gap-2 whitespace-nowrap">
                    Clear Filters
                  </Button>
                </div>
                <Button onClick={() => setEventDialogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Event
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium uppercase text-muted-foreground">Event Type</Label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="wedding">Wedding</SelectItem>
                      <SelectItem value="corporate">Corporate</SelectItem>
                      <SelectItem value="birthday">Birthday</SelectItem>
                      <SelectItem value="conference">Conference</SelectItem>
                      <SelectItem value="social">Social</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium uppercase text-muted-foreground">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="inquiry">Inquiry</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium uppercase text-muted-foreground">Venue</Label>
                  <Select value={venueFilter} onValueChange={setVenueFilter}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="All Venues" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Venues</SelectItem>
                      {uniqueVenues.map(venue => (
                        <SelectItem key={venue} value={venue}>{venue}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead onClick={() => handleSort('event_name')} className="cursor-pointer hover:bg-muted/50 transition-colors group">
                        <div className="flex items-center gap-2">
                          Event
                          <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </TableHead>
                      <TableHead onClick={() => handleSort('client_name')} className="cursor-pointer hover:bg-muted/50 transition-colors group">
                        <div className="flex items-center gap-2">
                          Client
                          <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </TableHead>
                      <TableHead onClick={() => handleSort('event_date')} className="cursor-pointer hover:bg-muted/50 transition-colors group">
                        <div className="flex items-center gap-2">
                          Date & Time
                          <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </TableHead>
                      <TableHead onClick={() => handleSort('venue')} className="cursor-pointer hover:bg-muted/50 transition-colors group">
                        <div className="flex items-center gap-2">
                          Venue
                          <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </TableHead>
                      <TableHead onClick={() => handleSort('guest_count')} className="cursor-pointer hover:bg-muted/50 transition-colors group text-right">
                        <div className="flex items-center justify-end gap-2">
                          Guests
                          <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </TableHead>
                      <TableHead onClick={() => handleSort('total_amount')} className="cursor-pointer hover:bg-muted/50 transition-colors group text-right">
                        <div className="flex items-center justify-end gap-2">
                          Amount
                          <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </TableHead>
                      <TableHead onClick={() => handleSort('status')} className="cursor-pointer hover:bg-muted/50 transition-colors group">
                        <div className="flex items-center gap-2">
                          Status
                          <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                          Loading events...
                        </TableCell>
                      </TableRow>
                    ) : filteredEvents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                          No events found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredEvents.map((event) => (
                        <TableRow key={event.id}>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setSelectedEvent(event);
                                setDetailsDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{event.event_name}</p>
                              <Badge
                                variant="outline"
                                className={`text-xs ${
                                  eventTypeColors[event.event_type] || eventTypeColors.other
                                }`}
                              >
                                {event.event_type}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{event.client_name}</p>
                              {event.client_phone && (
                                <p className="text-xs text-muted-foreground">
                                  {event.client_phone}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <CalendarDays className="h-3 w-3 text-muted-foreground" />
                              <span>{event.event_date}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>
                                {event.start_time} - {event.end_time}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              {event.venue}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{event.guest_count}</TableCell>
                          <TableCell className="font-mono text-right">
                            ${event.total_amount.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={statusColors[event.status]}>
                              {event.status.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={event.status}
                              onValueChange={(v: BanquetEvent["status"]) =>
                                updateStatus.mutate({ id: event.id, status: v })
                              }
                            >
                              <SelectTrigger className="w-32 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="inquiry">Inquiry</SelectItem>
                                <SelectItem value="confirmed">Confirmed</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                           <TableCell>
                             <Button
                               variant="ghost"
                               size="sm"
                               onClick={() => handleEditEvent(event)}
                               className="h-8 text-xs"
                             >
                               Edit
                             </Button>
                           </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar">
            <DraggableBanquetCalendar 
              events={events.map(e => ({
                id: e.id,
                event_name: e.event_name,
                event_type: e.event_type,
                client_name: e.client_name,
                event_date: e.event_date,
                start_time: e.start_time,
                end_time: e.end_time,
                venue: e.venue,
                guest_count: e.guest_count,
                status: e.status,
                total_amount: e.total_amount,
              }))}
              onEventClick={(event) => {
                toast.info(`Selected: ${event.event_name}`);
              }}
              onDateClick={(date) => {
                setNewEvent(prev => ({ ...prev, event_date: date }));
                setEventDialogOpen(true);
              }}
              onEventDrop={handleEventDrop}
            />
          </TabsContent>

          <TabsContent value="catering">
            <CateringManagementPanel 
              events={events.map(e => ({
                id: e.id,
                event_name: e.event_name,
                event_type: e.event_type,
                client_name: e.client_name,
                event_date: e.event_date,
                venue: e.venue,
                guest_count: e.guest_count,
                status: e.status,
                menu_package: e.menu_package,
                special_requests: e.special_requests,
              }))}
            />
          </TabsContent>

          <TabsContent value="venue">
            <VenueSetupPanel 
              events={events.map(e => ({
                id: e.id,
                event_name: e.event_name,
                event_type: e.event_type,
                client_name: e.client_name,
                event_date: e.event_date,
                venue: e.venue,
                guest_count: e.guest_count,
                status: e.status,
              }))}
            />
          </TabsContent>

          <TabsContent value="reports">
            <EventReportsPanel 
              events={events.map(e => ({
                id: e.id,
                event_name: e.event_name,
                event_type: e.event_type,
                client_name: e.client_name,
                event_date: e.event_date,
                venue: e.venue,
                guest_count: e.guest_count,
                status: e.status,
                total_amount: e.total_amount,
              }))}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* New Event Dialog */}
      <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
             <DialogTitle>{editingEvent ? "Edit Event" : "Create New Event"}</DialogTitle>
             <DialogDescription>
               {editingEvent ? "Update the event details" : "Enter the details for the banquet event"}
             </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Event Name *</Label>
                <Input
                  placeholder="Annual Corporate Dinner"
                  value={newEvent.event_name}
                  onChange={(e) => setNewEvent((p) => ({ ...p, event_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Event Type</Label>
                <Select
                  value={newEvent.event_type}
                  onValueChange={(v) => setNewEvent((p) => ({ ...p, event_type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wedding">Wedding</SelectItem>
                    <SelectItem value="corporate">Corporate</SelectItem>
                    <SelectItem value="birthday">Birthday</SelectItem>
                    <SelectItem value="conference">Conference</SelectItem>
                    <SelectItem value="social">Social</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Client Name *</Label>
                <Input
                  placeholder="John Smith"
                  value={newEvent.client_name}
                  onChange={(e) => setNewEvent((p) => ({ ...p, client_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  placeholder="+1 234 567 8900"
                  value={newEvent.client_phone}
                  onChange={(e) => setNewEvent((p) => ({ ...p, client_phone: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="john@example.com"
                  value={newEvent.client_email}
                  onChange={(e) => setNewEvent((p) => ({ ...p, client_email: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Event Date *</Label>
                <Input
                  type="date"
                  value={newEvent.event_date}
                  onChange={(e) => setNewEvent((p) => ({ ...p, event_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={newEvent.start_time}
                  onChange={(e) => setNewEvent((p) => ({ ...p, start_time: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={newEvent.end_time}
                  onChange={(e) => setNewEvent((p) => ({ ...p, end_time: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Guests</Label>
                <Input
                  type="number"
                  value={newEvent.guest_count}
                  onChange={(e) =>
                    setNewEvent((p) => ({ ...p, guest_count: parseInt(e.target.value) || 0 }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Venue *</Label>
                <Input
                  placeholder="Grand Ballroom"
                  value={newEvent.venue}
                  onChange={(e) => setNewEvent((p) => ({ ...p, venue: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Menu Package</Label>
                <Input
                  placeholder="Premium Buffet"
                  value={newEvent.menu_package}
                  onChange={(e) => setNewEvent((p) => ({ ...p, menu_package: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Total Amount ($)</Label>
                <Input
                  type="number"
                  value={newEvent.total_amount}
                  onChange={(e) =>
                    setNewEvent((p) => ({ ...p, total_amount: parseFloat(e.target.value) || 0 }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Deposit Amount ($)</Label>
                <Input
                  type="number"
                  value={newEvent.deposit_amount}
                  onChange={(e) =>
                    setNewEvent((p) => ({
                      ...p,
                      deposit_amount: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Special Requests</Label>
              <Textarea
                placeholder="Any special requirements..."
                value={newEvent.special_requests}
                onChange={(e) => setNewEvent((p) => ({ ...p, special_requests: e.target.value }))}
              />
            </div>

            <div className="flex justify-end gap-2">
               <Button variant="outline" onClick={() => {
                 setEventDialogOpen(false);
                 resetNewEvent();
               }}>
                Cancel
              </Button>
               <Button onClick={handleSaveEvent} disabled={createEvent.isPending || updateEvent.isPending}>
                 {createEvent.isPending || updateEvent.isPending
                   ? (editingEvent ? "Updating..." : "Creating...")
                   : (editingEvent ? "Update Event" : "Create Event")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
            <DialogDescription>
              Read-only view of the banquet event
            </DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="grid grid-cols-2 gap-6 py-4">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground uppercase mb-1">Event Information</h4>
                  <p className="text-lg font-semibold">{selectedEvent.event_name}</p>
                  <Badge className={`mt-1 ${eventTypeColors[selectedEvent.event_type] || eventTypeColors.other}`}>
                    {selectedEvent.event_type}
                  </Badge>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground uppercase mb-1">Client Details</h4>
                  <p className="font-medium">{selectedEvent.client_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedEvent.client_phone}</p>
                  <p className="text-sm text-muted-foreground">{selectedEvent.client_email}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground uppercase mb-1">Status</h4>
                  <Badge variant="outline" className={statusColors[selectedEvent.status]}>
                    {selectedEvent.status.replace("_", " ")}
                  </Badge>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground uppercase mb-1">Date & Time</h4>
                  <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-muted-foreground" /> {selectedEvent.event_date}</p>
                  <p className="flex items-center gap-2 text-sm text-muted-foreground mt-1"><Clock className="h-4 w-4" /> {selectedEvent.start_time} - {selectedEvent.end_time}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground uppercase mb-1">Venue & Guests</h4>
                  <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /> {selectedEvent.venue}</p>
                  <p className="flex items-center gap-2 text-sm text-muted-foreground mt-1"><Users className="h-4 w-4" /> {selectedEvent.guest_count} Guests</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground uppercase mb-1">Financials</h4>
                  <p className="text-lg font-mono font-bold text-primary">${selectedEvent.total_amount.toLocaleString()}</p>
                  {selectedEvent.deposit_amount && (
                    <p className="text-sm text-muted-foreground mt-1">Deposit: ${selectedEvent.deposit_amount.toLocaleString()}</p>
                  )}
                </div>
              </div>

              {selectedEvent.special_requests && (
                <div className="col-span-2">
                  <h4 className="text-sm font-medium text-muted-foreground uppercase mb-1">Special Requests</h4>
                  <p className="text-sm p-3 rounded-md bg-muted/50 border italic">{selectedEvent.special_requests}</p>
                </div>
              )}
            </div>
          )}
          <div className="flex justify-end pt-4">
            <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
