import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";
import { ErrorBoundary } from "@/components/ErrorBoundary";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  MoreVertical,
  ArrowUpDown,
  Filter,
  XCircle,
  AlertTriangle,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSearchParams } from "react-router-dom";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { usePersistentPopup } from "@/hooks/usePersistentPopup";
import { motion, AnimatePresence } from "framer-motion";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { 
  DraggableBanquetCalendar,
  EventReportsPanel,
  CateringManagementPanel,
  VenueSetupPanel,
} from "@/components/banquet";
import {
  useCateringOrders,
  useVenueSetups,
} from "@/hooks/useBanquetData";
import { useGuests } from "@/hooks/useGuests";

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
  const { data: cateringOrders = [] } = useCateringOrders();
  const { data: venueSetups = [] } = useVenueSetups();
  const { data: guests = [] } = useGuests();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "events";
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortConfig, setSortConfig] = useState<{ key: keyof BanquetEvent; direction: 'asc' | 'desc' } | null>(null);

  const { isBlocking, handlePointerDownOutside, handleEscapeKeyDown } = usePersistentPopup();

  const handleTabChange = (value: string) => {
    setSearchParams(prev => {
      prev.set("tab", value);
      return prev;
    });
  };
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedEventForDetails, setSelectedEventForDetails] = useState<BanquetEvent | null>(null);
   const [editingEvent, setEditingEvent] = useState<BanquetEvent | null>(null);
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

  const conflicts = events.filter((e) => {
    // Skip checking against the event being edited
    if (editingEvent && e.id === editingEvent.id) return false;

    // Check same date and venue
    if (e.event_date !== newEvent.event_date || e.venue !== newEvent.venue) return false;

    // Check time overlap: (StartA < EndB) and (EndA > StartB)
    return newEvent.start_time < e.end_time && newEvent.end_time > e.start_time;
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

   const handleViewDetails = (event: BanquetEvent) => {
     setSelectedEventForDetails(event);
     setDetailsDialogOpen(true);
   };

  const generateBEO = (event: BanquetEvent) => {
    const doc = new jsPDF();
    const catering = cateringOrders.find(c => c.event_id === event.id);
    const venue = venueSetups.find(v => v.event_id === event.id);

    // Header
    doc.setFontSize(22);
    doc.setTextColor(0, 102, 255);
    doc.text("LuxeStay Hospitality", 105, 20, { align: "center" });
    doc.setFontSize(16);
    doc.setTextColor(51, 65, 85);
    doc.text("Banquet Event Order (BEO)", 105, 30, { align: "center" });

    doc.setDrawColor(226, 232, 240);
    doc.line(20, 35, 190, 35);

    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, 42, { align: "center" });

    // Event Details Table
    autoTable(doc, {
      startY: 50,
      head: [['Event Information', '']],
      body: [
        ['Event Name', event.event_name],
        ['Event Type', event.event_type.toUpperCase()],
        ['Date', event.event_date],
        ['Time Slot', `${event.start_time} - ${event.end_time}`],
        ['Venue', event.venue],
        ['Expected Guests', event.guest_count.toString()],
        ['Booking Status', event.status.replace('_', ' ').toUpperCase()],
      ],
      theme: 'striped',
      headStyles: { fillColor: [0, 102, 255], fontSize: 12, fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } }
    });

    // Client Details Table
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['Client Contact Details', '']],
      body: [
        ['Contact Name', event.client_name],
        ['Phone Number', event.client_phone || 'N/A'],
        ['Email Address', event.client_email || 'N/A'],
      ],
      theme: 'striped',
      headStyles: { fillColor: [0, 102, 255], fontSize: 12, fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } }
    });

    // Catering & Requirements
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['Catering Details', '']],
      body: [
        ['Menu Package', catering?.menu_package || event.menu_package || 'Not selected'],
        ['Serving Style', catering?.serving_style || 'Not specified'],
        ['Dietary Requirements', catering?.dietary_requirements?.join(', ') || 'None'],
        ['Beverages', catering?.beverages?.join(', ') || 'None'],
        ['Special Notes', catering?.special_notes || event.special_requests || 'None specified.'],
      ],
      theme: 'striped',
      headStyles: { fillColor: [0, 102, 255], fontSize: 12, fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } }
    });

    // Venue Setup Details
    if (venue) {
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 10,
        head: [['Venue Setup Details', '']],
        body: [
          ['Layout Type', venue.layout_type],
          ['Tables / Chairs', `${venue.table_count} Tables / ${venue.chair_count} Chairs`],
          ['Features', `${venue.stage_required ? 'Stage, ' : ''}${venue.dance_floor ? 'Dance Floor' : ''}`.replace(/, $/, '') || 'Standard'],
          ['Equipment', venue.equipment?.join(', ') || 'None'],
          ['Decorations', venue.decorations?.join(', ') || 'None'],
        ],
        theme: 'striped',
        headStyles: { fillColor: [0, 102, 255], fontSize: 12, fontStyle: 'bold' },
        styles: { fontSize: 10, cellPadding: 3 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } }
      });
    }

    // Financials
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['Financial Summary', '']],
      body: [
        ['Total Quoted Amount', formatCurrency(event.total_amount)],
        ['Advance Deposit Paid', formatCurrency(event.deposit_amount || 0)],
        ['Current Balance Due', formatCurrency(event.total_amount - (event.deposit_amount || 0))],
      ],
      theme: 'grid',
      headStyles: { fillColor: [34, 197, 94], fontSize: 12, fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 }, 1: { halign: 'right', fontStyle: 'bold' } }
    });

    // Footer
    const finalY = (doc as any).lastAutoTable.finalY;
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text("Thank you for choosing LuxeStay Hospitality for your event.", 105, finalY + 20, { align: "center" });
    doc.text("For any queries, please contact the Banquet Manager.", 105, finalY + 25, { align: "center" });

    doc.save(`BEO_${event.event_name.replace(/\s+/g, '_')}_${event.event_date}.pdf`);
    toast.success("BEO PDF generated successfully");
  };
 
   const getPreviousDue = (clientName: string, currentEventId?: string) => {
     return events
       .filter(e => e.client_name === clientName && e.id !== currentEventId && e.status !== 'cancelled')
       .reduce((sum, e) => sum + (e.total_amount - (e.deposit_amount || 0)), 0);
   };

   const handleSaveEvent = () => {
     if (!newEvent.event_name || !newEvent.client_name || !newEvent.venue) {
       toast.error("Please fill in event name, client name, and venue");
       return;
     }

     if (conflicts.length > 0) {
       toast.error(`Venue Conflict: ${conflicts[0].event_name} is already scheduled at this time.`);
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

  // Filter and sort events
  const filteredEvents = events
    .filter((e) => {
      const matchesSearch = e.event_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          e.client_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || e.status === statusFilter;
      const matchesType = typeFilter === "all" || e.event_type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    })
    .sort((a, b) => {
      if (!sortConfig) return 0;
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

  const handleSort = (key: keyof BanquetEvent) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
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
    <ErrorBoundary>
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
            value={formatCurrency(totalRevenue)}
            change="From completed events"
            changeType="positive"
            icon={DollarSign}
            delay={100}
          />
          <MetricCard
            title="Pending Deposits"
            value={formatCurrency(pendingDeposits)}
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
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <TabsList className="flex-wrap h-auto mb-4">
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
          </motion.div>

          <AnimatePresence mode="wait">
            <TabsContent key="events" value="events" className="space-y-4 focus-visible:outline-none focus-visible:ring-0">
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex flex-1 items-center gap-2 max-w-2xl">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search events or clients..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[140px]">
                        <div className="flex items-center gap-2">
                          <Filter className="h-4 w-4 text-muted-foreground" />
                          <SelectValue placeholder="Status" />
                        </div>
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
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Event Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="wedding">Wedding</SelectItem>
                        <SelectItem value="corporate">Corporate</SelectItem>
                        <SelectItem value="birthday">Birthday</SelectItem>
                        <SelectItem value="conference">Conference</SelectItem>
                        <SelectItem value="social">Social</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={() => setEventDialogOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    New Event
                  </Button>
                </div>

                <Card>
                  <CardContent className="p-0">
                    {isLoading ? (
                      <div className="p-8 text-center text-muted-foreground">Loading events...</div>
                    ) : filteredEvents.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">No events found</div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12"></TableHead>
                            <TableHead
                              className="cursor-pointer hover:text-primary transition-colors"
                              onClick={() => handleSort("event_name")}
                            >
                              <div className="flex items-center gap-1">
                                Event
                                <ArrowUpDown className="h-3 w-3" />
                              </div>
                            </TableHead>
                            <TableHead
                              className="cursor-pointer hover:text-primary transition-colors"
                              onClick={() => handleSort("client_name")}
                            >
                              <div className="flex items-center gap-1">
                                Client
                                <ArrowUpDown className="h-3 w-3" />
                              </div>
                            </TableHead>
                            <TableHead
                              className="cursor-pointer hover:text-primary transition-colors"
                              onClick={() => handleSort("event_date")}
                            >
                              <div className="flex items-center gap-1">
                                Date & Time
                                <ArrowUpDown className="h-3 w-3" />
                              </div>
                            </TableHead>
                            <TableHead>Venue</TableHead>
                            <TableHead
                              className="cursor-pointer hover:text-primary transition-colors text-right"
                              onClick={() => handleSort("guest_count")}
                            >
                              <div className="flex items-center justify-end gap-1">
                                Guests
                                <ArrowUpDown className="h-3 w-3" />
                              </div>
                            </TableHead>
                            <TableHead
                              className="cursor-pointer hover:text-primary transition-colors text-right"
                              onClick={() => handleSort("total_amount")}
                            >
                              <div className="flex items-center justify-end gap-1">
                                Amount
                                <ArrowUpDown className="h-3 w-3" />
                              </div>
                            </TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-[100px] text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredEvents.map((event, index) => (
                            <motion.tr
                              key={event.id}
                              className="group border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.03 }}
                            >
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-primary"
                                  onClick={() => handleViewDetails(event)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium group-hover:text-primary transition-colors">{event.event_name}</p>
                                  <Badge
                                    variant="outline"
                                    className={`text-[10px] h-4 px-1.5 ${
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
                                <div className="flex items-center gap-1">
                                  <CalendarDays className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-sm font-medium">{event.event_date}</span>
                                </div>
                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
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
                              <TableCell className="text-right font-medium">{event.guest_count}</TableCell>
                              <TableCell className="text-right font-mono font-bold text-primary">
                                {formatCurrency(event.total_amount)}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={`${statusColors[event.status]} capitalize`}>
                                  {event.status.replace("_", " ")}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                      align="end"
                                      className={`w-52 ${isBlocking ? "animate-shake border-destructive/50" : ""}`}
                                      onPointerDownOutside={handlePointerDownOutside}
                                      onEscapeKeyDown={handleEscapeKeyDown}
                                    >
                                      <div className="flex items-center justify-between px-2 py-1.5">
                                        <DropdownMenuLabel className="p-0">Event Actions</DropdownMenuLabel>
                                        <DropdownMenuItem className="p-0 h-6 w-6 flex items-center justify-center rounded-full focus:bg-accent focus:text-accent-foreground">
                                          <XCircle className="h-4 w-4 text-muted-foreground" />
                                        </DropdownMenuItem>
                                      </div>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => handleViewDetails(event)}>
                                        <Eye className="mr-2 h-4 w-4" /> View Details
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleEditEvent(event)}>
                                        <FileText className="mr-2 h-4 w-4" /> Edit Event
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuLabel className="text-[10px] font-normal text-muted-foreground uppercase tracking-wider">Update Status</DropdownMenuLabel>
                                      <DropdownMenuItem onClick={() => updateStatus.mutate({ id: event.id, status: 'inquiry' })}>
                                        Inquiry
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => updateStatus.mutate({ id: event.id, status: 'confirmed' })}>
                                        Confirmed
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => updateStatus.mutate({ id: event.id, status: 'in_progress' })}>
                                        In Progress
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => updateStatus.mutate({ id: event.id, status: 'completed' })}>
                                        Completed
                                      </DropdownMenuItem>
                                      <DropdownMenuItem className="text-destructive" onClick={() => updateStatus.mutate({ id: event.id, status: 'cancelled' })}>
                                        Cancelled
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </TableCell>
                            </motion.tr>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent key="calendar" value="calendar" className="focus-visible:outline-none focus-visible:ring-0">
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
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
              </motion.div>
            </TabsContent>

            <TabsContent key="catering" value="catering" className="focus-visible:outline-none focus-visible:ring-0">
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
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
                  onViewDetails={handleViewDetails}
                />
              </motion.div>
            </TabsContent>

            <TabsContent key="venue" value="venue" className="focus-visible:outline-none focus-visible:ring-0">
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
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
                  onViewDetails={handleViewDetails}
                />
              </motion.div>
            </TabsContent>

            <TabsContent key="reports" value="reports" className="focus-visible:outline-none focus-visible:ring-0">
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
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
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </div>

      {/* Event Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl">{selectedEventForDetails?.event_name}</DialogTitle>
                <DialogDescription className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className={selectedEventForDetails ? statusColors[selectedEventForDetails.status] : ""}>
                    {selectedEventForDetails?.status.replace("_", " ")}
                  </Badge>
                  <Badge variant="outline" className={selectedEventForDetails ? eventTypeColors[selectedEventForDetails.event_type] : ""}>
                    {selectedEventForDetails?.event_type}
                  </Badge>
                </DialogDescription>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground font-medium">Total Amount</p>
                <p className="text-2xl font-bold text-primary">
                  {selectedEventForDetails && formatCurrency(selectedEventForDetails.total_amount)}
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  Event Schedule & Venue
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="font-medium">{selectedEventForDetails?.event_date}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Time</p>
                  <p className="font-medium">{selectedEventForDetails?.start_time} - {selectedEventForDetails?.end_time}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Venue</p>
                  <p className="font-medium">{selectedEventForDetails?.venue}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Guest Count</p>
                  <p className="font-medium">{selectedEventForDetails?.guest_count} guests</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  Client Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Name</p>
                  <p className="font-medium">{selectedEventForDetails?.client_name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedEventForDetails?.client_phone || "N/A"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium truncate">{selectedEventForDetails?.client_email || "N/A"}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-3">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
                  Catering & Requirements
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Menu Package</p>
                    <p className="font-medium">{selectedEventForDetails?.menu_package || "Not selected"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Special Requests</p>
                    <p className="text-sm italic">
                      {selectedEventForDetails?.special_requests || "No special requests."}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-sm text-muted-foreground">Deposit Paid</span>
                    <span className="font-mono font-medium text-success">
                      {selectedEventForDetails?.deposit_amount ? formatCurrency(selectedEventForDetails.deposit_amount) : formatCurrency(0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b pb-2 font-bold">
                    <span className="text-sm">Balance Due</span>
                    <span className="font-mono text-destructive">
                      {selectedEventForDetails && formatCurrency(selectedEventForDetails.total_amount - (selectedEventForDetails.deposit_amount || 0))}
                    </span>
                  </div>
                  {selectedEventForDetails && (
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-sm text-muted-foreground">Previous Due</span>
                      <span className="font-mono text-destructive">
                        {(() => {
                          const previousDue = events
                            .filter(e =>
                              e.client_name === selectedEventForDetails.client_name &&
                              e.id !== selectedEventForDetails.id &&
                              new Date(e.event_date) < new Date(selectedEventForDetails.event_date) &&
                              (e.status === 'completed' || e.status === 'confirmed')
                            )
                            .reduce((sum, e) => sum + (e.total_amount - (e.deposit_amount || 0)), 0);
                          return formatCurrency(previousDue);
                        })()}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>Close</Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => selectedEventForDetails && generateBEO(selectedEventForDetails)}
            >
              <Download className="h-4 w-4" />
              Download BEO
            </Button>
            <Button onClick={() => {
              setDetailsDialogOpen(false);
              if (selectedEventForDetails) handleEditEvent(selectedEventForDetails);
            }}>Edit Event</Button>
          </div>
        </DialogContent>
      </Dialog>

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
            <div className="space-y-2">
              <Label>Select Existing Guest (Optional)</Label>
              <Select
                onValueChange={(guestId) => {
                  const guest = guests.find(g => g.id === guestId);
                  if (guest) {
                    setNewEvent(p => ({
                      ...p,
                      client_name: `${guest.first_name} ${guest.last_name}`,
                      client_phone: guest.phone || "",
                      client_email: guest.email || ""
                    }));
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Search existing guest database..." />
                </SelectTrigger>
                <SelectContent>
                  {guests.slice(0, 10).map(guest => (
                    <SelectItem key={guest.id} value={guest.id}>
                      <div className="flex flex-col">
                        <span>{guest.first_name} {guest.last_name}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {guest.phone || guest.email || "No contact info"} • {guest.is_vip ? "VIP" : "Regular"}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
                  max={new Date().toISOString().slice(0, 10)}
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
                <Label className="flex items-center gap-2">
                  Venue *
                  {conflicts.length > 0 && (
                    <Badge variant="destructive" className="h-5 px-1.5 gap-1 animate-pulse">
                      <AlertTriangle className="h-3 w-3" />
                      Conflict
                    </Badge>
                  )}
                </Label>
                <Input
                  placeholder="Grand Ballroom"
                  value={newEvent.venue}
                  onChange={(e) => setNewEvent((p) => ({ ...p, venue: e.target.value }))}
                  className={conflicts.length > 0 ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {conflicts.length > 0 && (
                  <p className="text-[10px] text-destructive font-medium">
                    Overlaps with "{conflicts[0].event_name}"
                  </p>
                )}
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

            <div className="grid grid-cols-3 gap-4">
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
              <div className="space-y-2">
                <Label className="text-destructive">Previous Due ($)</Label>
                <div className="h-10 px-3 flex items-center rounded-md border border-input bg-muted/50 font-mono font-bold text-destructive">
                   {formatCurrency(getPreviousDue(newEvent.client_name, editingEvent?.id))}
                </div>
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
    </MainLayout>
    </ErrorBoundary>
  );
}
