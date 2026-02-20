import { useState, useMemo, useCallback } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Users, Wifi, Tv, Coffee, Bath, Grid, List, Bed, Receipt, Search, Filter, Download, FileText, UserPlus, MessageSquare, DollarSign, TrendingUp, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRooms } from "@/hooks/useRooms";
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

type Room = Tables<"rooms">;

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
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  const handleRoomClick = useCallback((room: Room) => {
    setSelectedRoom(room);
  }, []);
  const [activeTab, setActiveTab] = useState("rooms");
  const { setNewRoomOpen } = useQuickActions();

  const stats = useMemo(() => {
    return {
      available: rooms.filter((r) => r.status === "available").length,
      occupied: rooms.filter((r) => r.status === "occupied").length,
      cleaning: rooms.filter((r) => r.status === "cleaning").length,
      maintenance: rooms.filter((r) => r.status === "maintenance").length,
    };
  }, [rooms]);

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
          </TabsList>

          {/* Rooms Tab */}
          <TabsContent value="rooms">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-3 space-y-6">
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
                  <Button variant="gold" size="sm" className="gap-2 w-full sm:w-auto" onClick={() => setNewRoomOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Add Room
                  </Button>
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
                        data={rooms}
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
                    {rooms.map((room, index) => (
                      <RoomCard
                        key={room.id}
                        room={room}
                        index={index}
                        isSelected={selectedRoom?.id === room.id}
                        onClick={handleRoomClick}
                      />
                    ))}
                    {rooms.length === 0 && (
                      <div className="col-span-full text-center py-12 text-muted-foreground">
                        No rooms found
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

          {/* Billing Tab */}
          <TabsContent value="billing">
            <div className="space-y-6">
              {/* Billing Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <MetricCard
                  title="Total Revenue (MTD)"
                  value="$124,580"
                  change="+12.5% vs last month"
                  changeType="positive"
                  icon={DollarSign}
                  delay={0}
                />
                <MetricCard
                  title="Pending Payments"
                  value="$8,240"
                  change="12 invoices"
                  changeType="neutral"
                  icon={Receipt}
                  delay={50}
                />
                <MetricCard
                  title="Avg. Daily Revenue"
                  value="$6,229"
                  change="+8.2% vs avg"
                  changeType="positive"
                  icon={TrendingUp}
                  delay={100}
                />
                <MetricCard
                  title="Payment Success Rate"
                  value="94.5%"
                  change="+2.1% this week"
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
                    <div className="relative flex-1 sm:flex-initial">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input placeholder="Search invoices..." className="w-full sm:w-48 lg:w-64 pl-9 bg-secondary" />
                    </div>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Filter className="h-4 w-4" />
                      <span className="hidden sm:inline">Filter</span>
                    </Button>
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
                          <TableHead className="whitespace-nowrap">Invoice ID</TableHead>
                          <TableHead className="whitespace-nowrap">Guest</TableHead>
                          <TableHead className="whitespace-nowrap hidden md:table-cell">Reservation</TableHead>
                          <TableHead className="whitespace-nowrap hidden lg:table-cell">Date</TableHead>
                          <TableHead className="whitespace-nowrap">Amount</TableHead>
                          <TableHead className="whitespace-nowrap">Status</TableHead>
                          <TableHead className="whitespace-nowrap hidden xl:table-cell">Payment Method</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoices.map((invoice) => (
                          <TableRow key={invoice.id} className="border-border hover:bg-secondary/50">
                            <TableCell className="font-mono text-sm text-primary whitespace-nowrap">
                              {invoice.id}
                            </TableCell>
                            <TableCell className="font-medium whitespace-nowrap">{invoice.guest}</TableCell>
                            <TableCell className="text-muted-foreground hidden md:table-cell">{invoice.reservation}</TableCell>
                            <TableCell className="hidden lg:table-cell">{invoice.date}</TableCell>
                            <TableCell className="font-semibold whitespace-nowrap">{invoice.amount}</TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={invoiceStatusColors[invoice.status as keyof typeof invoiceStatusColors]}
                              >
                                {invoice.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground hidden xl:table-cell">{invoice.method}</TableCell>
                          </TableRow>
                        ))}
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
