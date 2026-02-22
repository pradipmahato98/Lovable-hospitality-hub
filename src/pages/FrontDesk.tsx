import { useState, useMemo, useCallback } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Users, Wifi, Tv, Coffee, Bath, Grid, List, Bed, Receipt, Search, Filter, Download, FileText, UserPlus, MessageSquare, DollarSign, TrendingUp, CreditCard, Sparkles, CheckCircle2, Clock, Star, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRooms } from "@/hooks/useRooms";
import { useReservations } from "@/hooks/useReservations";
import { useLoyaltyMembers } from "@/hooks/useGuestManagement";
import { useInvoices, useFinancialStats } from "@/hooks/useFinanceExtended";
import { useGuests } from "@/hooks/useGuests";
import { useHousekeepingTasks } from "@/hooks/useHousekeeping";
import { GuestFolioManager } from "@/components/front-desk/GuestFolioManager";
import { RoomCard, roomStatusStyles, amenityIcons } from "@/components/front-desk/RoomCard";
import { QueueManager } from "@/components/front-desk/QueueManager";
import { FrontDeskMessages } from "@/components/front-desk/FrontDeskMessages";
import { DataTable, Column } from "@/components/ui/data-table";
import { TableSkeleton } from "@/components/skeletons";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Tables } from "@/integrations/supabase/types";
import { RoomActionsPanel } from "@/components/rooms/RoomActionsPanel";
import { useQuickActions } from "@/contexts/QuickActionsContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MetricCard } from "@/components/dashboard/MetricCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { jsPDF } from "jspdf";

type Room = Tables<"rooms">;

const statusStyles = {
  available: "bg-success/20 text-success border-success/30",
  occupied: "bg-primary/20 text-primary border-primary/30",
  cleaning: "bg-warning/20 text-warning border-warning/30",
  maintenance: "bg-destructive/20 text-destructive border-destructive/30",
};

const amenityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  wifi: Wifi,
  tv: Tv,
  minibar: Coffee,
  jacuzzi: Bath,
};

// Sample invoice data for billing tab
const invoices = [
  { id: "INV-001", guest: "Sarah Johnson", reservation: "RES-001", date: "2024-12-20", amount: "$1,560", status: "paid", method: "Credit Card" },
  { id: "INV-002", guest: "Michael Chen", reservation: "RES-002", date: "2024-12-19", amount: "$480", status: "pending", method: "-" },
  { id: "INV-003", guest: "Emma Wilson", reservation: "RES-003", date: "2024-12-18", amount: "$360", status: "paid", method: "Cash" },
  { id: "INV-004", guest: "James Brown", reservation: "RES-004", date: "2024-12-17", amount: "$2,400", status: "partial", method: "Credit Card" },
  { id: "INV-005", guest: "Lisa Anderson", reservation: "RES-005", date: "2024-12-16", amount: "$520", status: "paid", method: "Bank Transfer" },
];

const invoiceStatusColors = {
  paid: "bg-success/20 text-success border-success/30",
  pending: "bg-warning/20 text-warning border-warning/30",
  partial: "bg-primary/20 text-primary border-primary/30",
  overdue: "bg-destructive/20 text-destructive border-destructive/30",
};

const columns: Column<Room>[] = [
  {
    key: "room_number",
    header: "Room",
    render: (room) => (
      <span className="font-mono font-bold text-primary">{room.room_number}</span>
    ),
  },
  {
    key: "room_type",
    header: "Type",
    render: (room) => <span>{room.room_type}</span>,
  },
  {
    key: "floor",
    header: "Floor",
    render: (room) => <span>Floor {room.floor}</span>,
  },
  {
    key: "capacity",
    header: "Capacity",
    render: (room) => (
      <div className="flex items-center gap-1">
        <Users className="h-4 w-4 text-muted-foreground" />
        <span>{room.capacity}</span>
      </div>
    ),
  },
  {
    key: "price_per_night",
    header: "Price/Night",
    render: (room) => (
      <span className="font-semibold text-primary">${room.price_per_night}</span>
    ),
  },
  {
    key: "status",
    header: "Status",
    render: (room) => (
      <Badge
        variant="outline"
          className={roomStatusStyles[room.status as keyof typeof roomStatusStyles] || roomStatusStyles.available}
      >
        {room.status}
      </Badge>
    ),
  },
  {
    key: "amenities",
    header: "Amenities",
    sortable: false,
    searchable: false,
    render: (room) => (
      <div className="flex gap-1">
        {(room.amenities || []).slice(0, 4).map((amenity) => {
          const Icon = amenityIcons[amenity.toLowerCase()];
          return Icon ? (
            <div
              key={amenity}
              className="h-6 w-6 rounded bg-secondary flex items-center justify-center"
              title={amenity}
            >
              <Icon className="h-3 w-3 text-muted-foreground" />
            </div>
          ) : null;
        })}
      </div>
    ),
  },
];

const FrontDesk = () => {
  const { data: rooms = [], isLoading } = useRooms();
  const { data: reservations = [] } = useReservations();
  const { data: loyaltyMembers = [] } = useLoyaltyMembers();
  const { data: housekeepingTasks = [], updateTaskStatus } = useHousekeepingTasks();
  const { data: invoices = [], isLoading: isLoadingInvoices, createInvoice } = useInvoices();
  const financialStats = useFinancialStats();
  const { data: guests = [] } = useGuests();

  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [filters, setFilters] = useState({
    status: "all",
    type: "all",
    floor: "all",
    amenity: "all",
    search: "",
  });
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  const handleRoomClick = useCallback((room: Room) => {
    setSelectedRoom(room);
  }, []);
  const [activeTab, setActiveTab] = useState("rooms");
  const { setNewRoomOpen } = useQuickActions();

  // Create Invoice State
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);
  const [newInvoiceData, setNewInvoiceData] = useState({
    guest_id: "",
    amount: "",
    description: "Manual Charge",
  });

  const handleCreateInvoice = async () => {
    if (!newInvoiceData.guest_id || !newInvoiceData.amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await createInvoice.mutateAsync({
        guest_id: newInvoiceData.guest_id,
        reservation_id: null,
        company_id: null,
        invoice_date: new Date().toISOString().split("T")[0],
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        status: "pending",
        discount_amount: 0,
        amount_paid: 0,
        notes: newInvoiceData.description,
        terms: "Payable within 7 days",
        items: [
          {
            description: newInvoiceData.description,
            quantity: 1,
            unit_price: parseFloat(newInvoiceData.amount),
            tax_rate: 0,
            tax_amount: 0,
            total: parseFloat(newInvoiceData.amount),
          }
        ]
      });
      toast.success("Invoice created successfully");
      setIsCreateInvoiceOpen(false);
      setNewInvoiceData({ guest_id: "", amount: "", description: "Manual Charge" });
    } catch (error) {
      toast.error("Failed to create invoice");
    }
  };

  const handlePrintInvoice = (invoice: any) => {
    try {
      const doc = new jsPDF();

      // Header
      doc.setFontSize(20);
      doc.text("LuxeStay ERP - Invoice", 105, 20, { align: "center" });

      // Invoice Details
      doc.setFontSize(12);
      doc.text(`Invoice #: ${invoice.invoice_number}`, 20, 40);
      doc.text(`Date: ${invoice.invoice_date}`, 20, 50);
      doc.text(`Guest: ${invoice.guest ? `${invoice.guest.first_name} ${invoice.guest.last_name}` : "N/A"}`, 20, 60);

      // Table Header
      doc.line(20, 70, 190, 70);
      doc.text("Description", 25, 78);
      doc.text("Amount", 160, 78);
      doc.line(20, 82, 190, 82);

      // Sample Item (In a real app, we'd loop through invoice items)
      doc.text(invoice.notes || "Room Charges & Incidentals", 25, 90);
      doc.text(`$${invoice.total.toLocaleString()}`, 160, 90);

      // Totals
      doc.line(20, 100, 190, 100);
      doc.setFont("helvetica", "bold");
      doc.text("Total Amount:", 120, 110);
      doc.text(`$${invoice.total.toLocaleString()}`, 160, 110);
      doc.text("Balance Due:", 120, 120);
      doc.text(`$${invoice.balance_due.toLocaleString()}`, 160, 120);

      // Footer
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("Thank you for staying with us!", 105, 140, { align: "center" });

      doc.save(`Invoice_${invoice.invoice_number}.pdf`);
      toast.success(`Invoice ${invoice.invoice_number} exported as PDF`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF invoice");
    }
  };

  const stats = useMemo(() => {
    return {
      available: rooms.filter((r) => r.status === "available").length,
      occupied: rooms.filter((r) => r.status === "occupied").length,
      cleaning: rooms.filter((r) => r.status === "cleaning").length,
      maintenance: rooms.filter((r) => r.status === "maintenance").length,
    };
  }, [rooms]);

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const matchesStatus = filters.status === "all" || room.status === filters.status;
      const matchesType = filters.type === "all" || room.room_type === filters.type;
      const matchesFloor = filters.floor === "all" || room.floor.toString() === filters.floor;
      const matchesAmenity = filters.amenity === "all" || (room.amenities || []).includes(filters.amenity);
      const matchesSearch = filters.search === "" ||
        room.room_number.toLowerCase().includes(filters.search.toLowerCase()) ||
        room.room_type.toLowerCase().includes(filters.search.toLowerCase());

      return matchesStatus && matchesType && matchesFloor && matchesAmenity && matchesSearch;
    });
  }, [rooms, filters]);

  const columns: Column<Room>[] = [
    {
      key: "room_number",
      header: "Room",
      render: (room) => (
        <span className="font-mono font-bold text-primary">{room.room_number}</span>
      ),
    },
    {
      key: "room_type",
      header: "Type",
      render: (room) => <span>{room.room_type}</span>,
    },
    {
      key: "floor",
      header: "Floor",
      render: (room) => <span>Floor {room.floor}</span>,
    },
    {
      key: "capacity",
      header: "Capacity",
      render: (room) => (
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span>{room.capacity}</span>
        </div>
      ),
    },
    {
      key: "price_per_night",
      header: "Price/Night",
      render: (room) => (
        <span className="font-semibold text-primary">${room.price_per_night}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (room) => (
        <Badge
          variant="outline"
          className={statusStyles[room.status as keyof typeof statusStyles] || statusStyles.available}
        >
          {room.status}
        </Badge>
      ),
    },
    {
      key: "amenities",
      header: "Amenities",
      sortable: false,
      searchable: false,
      render: (room) => (
        <div className="flex gap-1">
          {(room.amenities || []).slice(0, 4).map((amenity) => {
            const Icon = amenityIcons[amenity.toLowerCase()];
            return Icon ? (
              <div
                key={amenity}
                className="h-6 w-6 rounded bg-secondary flex items-center justify-center"
                title={amenity}
              >
                <Icon className="h-3 w-3 text-muted-foreground" />
              </div>
            ) : null;
          })}
        </div>
      ),
    },
  ];

  return (
    <MainLayout title="Front Desk" subtitle="Manage room inventory, check-ins, and billing">
      <ErrorBoundary>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="rooms" className="gap-2">
              <Bed className="h-4 w-4" />
              Rooms
            </TabsTrigger>
            <TabsTrigger value="billing" className="gap-2">
              <Receipt className="h-4 w-4" />
              Billing
            </TabsTrigger>
            <TabsTrigger value="folios" className="gap-2">
              <FileText className="h-4 w-4" />
              Guest Folios
            </TabsTrigger>
            <TabsTrigger value="queue" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Queue
            </TabsTrigger>
            <TabsTrigger value="messages" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="housekeeping" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Housekeeping
            </TabsTrigger>
          </TabsList>

          {/* Rooms Tab */}
          <TabsContent value="rooms">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-3 space-y-6">
                <div className="flex flex-col space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant={viewMode === "grid" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode("grid")}
                      >
                        <Grid className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === "table" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode("table")}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Search rooms..."
                          className="pl-9 h-9"
                          value={filters.search}
                          onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                        />
                      </div>
                      <Button variant="gold" size="sm" className="gap-2 shrink-0" onClick={() => setNewRoomOpen(true)}>
                        <Plus className="h-4 w-4" />
                        Add Room
                      </Button>
                    </div>
                  </div>

                  {/* Advanced Filters */}
                  <div className="flex flex-wrap gap-2 p-4 bg-secondary/20 rounded-lg border border-border">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Filters:</span>
                    </div>
                    <Select value={filters.status} onValueChange={(val) => setFilters(prev => ({ ...prev, status: val }))}>
                      <SelectTrigger className="h-8 w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="occupied">Occupied</SelectItem>
                        <SelectItem value="cleaning">Cleaning</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={filters.type} onValueChange={(val) => setFilters(prev => ({ ...prev, type: val }))}>
                      <SelectTrigger className="h-8 w-[130px]"><SelectValue placeholder="Room Type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {Array.from(new Set(rooms.map(r => r.room_type))).map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={filters.floor} onValueChange={(val) => setFilters(prev => ({ ...prev, floor: val }))}>
                      <SelectTrigger className="h-8 w-[110px]"><SelectValue placeholder="Floor" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Floors</SelectItem>
                        {Array.from(new Set(rooms.map(r => r.floor.toString()))).sort().map(floor => (
                          <SelectItem key={floor} value={floor}>Floor {floor}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={filters.amenity} onValueChange={(val) => setFilters(prev => ({ ...prev, amenity: val }))}>
                      <SelectTrigger className="h-8 w-[130px]"><SelectValue placeholder="Amenity" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any Amenity</SelectItem>
                        {Array.from(new Set(rooms.flatMap(r => r.amenities || []))).sort().map(amenity => (
                          <SelectItem key={amenity} value={amenity}>{amenity}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {(filters.status !== "all" || filters.type !== "all" || filters.floor !== "all" || filters.amenity !== "all" || filters.search !== "") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs text-muted-foreground"
                        onClick={() => setFilters({ status: "all", type: "all", floor: "all", amenity: "all", search: "" })}
                      >
                        Reset
                      </Button>
                    )}
                  </div>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  {[
                    { label: "Available", count: stats.available, color: "text-success" },
                    { label: "Occupied", count: stats.occupied, color: "text-primary" },
                    { label: "Cleaning", count: stats.cleaning, color: "text-warning" },
                    { label: "Maintenance", count: stats.maintenance, color: "text-destructive" },
                  ].map((stat) => (
                    <Card key={stat.label} variant="glass" className="p-3 sm:p-4">
                      <p className="text-xs sm:text-sm text-muted-foreground">{stat.label}</p>
                      <p className={cn("text-xl sm:text-2xl font-bold font-display", stat.color)}>
                        {isLoading ? "-" : stat.count}
                      </p>
                    </Card>
                  ))}
                </div>

                {isLoading ? (
                  <TableSkeleton columns={7} rows={5} />
                ) : viewMode === "table" ? (
                  <Card variant="elevated">
                    <CardHeader>
                      <CardTitle>All Rooms</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <DataTable
                        data={filteredRooms}
                        columns={columns}
                        keyExtractor={(room) => room.id}
                        searchPlaceholder="Search rooms..."
                        emptyMessage="No rooms found."
                        pageSize={10}
                        onRowClick={(room) => setSelectedRoom(room)}
                      />
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                    {filteredRooms.map((room, index) => {
                      const activeRes = reservations.find(r => r.room_id === room.id && r.status === "checked_in");
                      const guest = guests.find(g => g.id === activeRes?.guest_id);
                      const loyalty = loyaltyMembers.find(m => m.guest_id === guest?.id);

                      return (
                        <RoomCard
                          key={room.id}
                          room={room}
                          index={index}
                          isSelected={selectedRoom?.id === room.id}
                          onClick={handleRoomClick}
                        />
                      );
                    })}
                    {filteredRooms.length === 0 && (
                      <div className="col-span-full text-center py-12 text-muted-foreground">
                        No rooms match the selected filters
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Actions Panel */}
              <div className="lg:col-span-1">
                <RoomActionsPanel
                  selectedRoom={selectedRoom}
                  onClearSelection={() => setSelectedRoom(null)}
                />
              </div>
            </div>
          </TabsContent>

          {/* Guest Folios Tab */}
          <TabsContent value="folios">
            <GuestFolioManager />
          </TabsContent>

          {/* Queue Tab */}
          <TabsContent value="queue">
            <QueueManager />
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages">
            <FrontDeskMessages />
          </TabsContent>

          {/* Housekeeping Tab */}
          <TabsContent value="housekeeping">
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <MetricCard
                  title="Pending Tasks"
                  value={housekeepingTasks.filter(t => t.status === "pending").length.toString()}
                  icon={Clock}
                  delay={0}
                />
                <MetricCard
                  title="In Progress"
                  value={housekeepingTasks.filter(t => t.status === "in_progress").length.toString()}
                  icon={Sparkles}
                  delay={50}
                />
                <MetricCard
                  title="Completed Today"
                  value={housekeepingTasks.filter(t => t.status === "completed").length.toString()}
                  icon={CheckCircle2}
                  delay={100}
                />
              </div>

              <Card variant="elevated">
                <CardHeader>
                  <CardTitle>Housekeeping Status</CardTitle>
                </CardHeader>
                <CardContent className="p-0 sm:p-6">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Room</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {housekeepingTasks.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8">No active housekeeping tasks</TableCell>
                          </TableRow>
                        ) : (
                          housekeepingTasks.map((task) => (
                            <TableRow key={task.id}>
                              <TableCell className="font-bold">{task.room?.room_number}</TableCell>
                              <TableCell>{task.task_type}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className={cn(
                                  task.priority === "urgent" ? "bg-destructive/20 text-destructive border-destructive/30" :
                                  task.priority === "high" ? "bg-warning/20 text-warning border-warning/30" :
                                  "bg-secondary text-muted-foreground"
                                )}>
                                  {task.priority}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge className={cn(
                                  task.status === "completed" ? "bg-success/20 text-success border-success/30" :
                                  task.status === "in_progress" ? "bg-primary/20 text-primary border-primary/30" :
                                  "bg-warning/20 text-warning border-warning/30"
                                )}>
                                  {task.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {task.status !== "completed" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateTaskStatus.mutate({ id: task.id, status: task.status === "pending" ? "in_progress" : "completed" })}
                                  >
                                    {task.status === "pending" ? "Start" : "Finish"}
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing">
            <div className="space-y-6">
              {/* Billing Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <MetricCard
                  title="Total Revenue"
                  value={`$${financialStats.totalRevenue.toLocaleString()}`}
                  change="MTD"
                  changeType="positive"
                  icon={DollarSign}
                  delay={0}
                />
                <MetricCard
                  title="Outstanding"
                  value={`$${financialStats.outstandingReceivables.toLocaleString()}`}
                  change={`${financialStats.invoiceCount} invoices`}
                  changeType="neutral"
                  icon={Receipt}
                  delay={50}
                />
                <MetricCard
                  title="Total Collected"
                  value={`$${financialStats.totalCollected.toLocaleString()}`}
                  change={`${financialStats.paymentCount} payments`}
                  changeType="positive"
                  icon={TrendingUp}
                  delay={100}
                />
                <MetricCard
                  title="Net Income"
                  value={`$${financialStats.netIncome.toLocaleString()}`}
                  change="Realized"
                  changeType="positive"
                  icon={CreditCard}
                  delay={150}
                />
              </div>

              {/* Invoices Table */}
              <Card variant="elevated" className="animate-fade-in overflow-hidden">
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <CardTitle>Recent Invoices</CardTitle>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
                    <Dialog open={isCreateInvoiceOpen} onOpenChange={setIsCreateInvoiceOpen}>
                      <DialogTrigger asChild>
                        <Button variant="gold" size="sm" className="gap-2">
                          <Plus className="h-4 w-4" />
                          New Invoice
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create New Invoice</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="guest">Guest</Label>
                            <Select
                              value={newInvoiceData.guest_id}
                              onValueChange={(val) => setNewInvoiceData(prev => ({ ...prev, guest_id: val }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select guest" />
                              </SelectTrigger>
                              <SelectContent>
                                {guests.map(guest => (
                                  <SelectItem key={guest.id} value={guest.id}>
                                    {guest.first_name} {guest.last_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="amount">Amount</Label>
                            <Input
                              id="amount"
                              type="number"
                              placeholder="0.00"
                              value={newInvoiceData.amount}
                              onChange={(e) => setNewInvoiceData(prev => ({ ...prev, amount: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Input
                              id="description"
                              value={newInvoiceData.description}
                              onChange={(e) => setNewInvoiceData(prev => ({ ...prev, description: e.target.value }))}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsCreateInvoiceOpen(false)}>Cancel</Button>
                          <Button variant="gold" onClick={handleCreateInvoice}>Create Invoice</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <div className="relative flex-1 sm:flex-initial">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input placeholder="Search invoices..." className="w-full sm:w-48 lg:w-64 pl-9 bg-secondary" />
                    </div>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Download className="h-4 w-4" />
                      <span className="hidden sm:inline">Export</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0 sm:p-6">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border hover:bg-transparent">
                          <TableHead className="whitespace-nowrap">Invoice #</TableHead>
                          <TableHead className="whitespace-nowrap">Guest</TableHead>
                          <TableHead className="whitespace-nowrap hidden lg:table-cell">Date</TableHead>
                          <TableHead className="whitespace-nowrap">Total</TableHead>
                          <TableHead className="whitespace-nowrap">Balance</TableHead>
                          <TableHead className="whitespace-nowrap">Status</TableHead>
                          <TableHead className="whitespace-nowrap">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoadingInvoices ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8">Loading invoices...</TableCell>
                          </TableRow>
                        ) : invoices.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8">No invoices found</TableCell>
                          </TableRow>
                        ) : (
                          invoices.map((invoice) => (
                            <TableRow key={invoice.id} className="border-border hover:bg-secondary/50">
                              <TableCell className="font-mono text-sm text-primary whitespace-nowrap">
                                {invoice.invoice_number}
                              </TableCell>
                              <TableCell className="font-medium whitespace-nowrap">
                                {invoice.guest ? `${invoice.guest.first_name} ${invoice.guest.last_name}` : "N/A"}
                              </TableCell>
                              <TableCell className="hidden lg:table-cell">{invoice.invoice_date}</TableCell>
                              <TableCell className="font-semibold whitespace-nowrap">${invoice.total.toLocaleString()}</TableCell>
                              <TableCell className="text-destructive whitespace-nowrap">${invoice.balance_due.toLocaleString()}</TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={invoiceStatusColors[invoice.status as keyof typeof invoiceStatusColors]}
                                >
                                  {invoice.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => handlePrintInvoice(invoice)}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </ErrorBoundary>
    </MainLayout>
  );
};

export default FrontDesk;
