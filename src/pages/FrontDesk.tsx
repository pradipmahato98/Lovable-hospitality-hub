import { useState, useMemo, useEffect } from "react";
import { useInvoices } from "@/hooks/useBillingData";
import { MainLayout } from "@/components/layout/MainLayout";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Users, Wifi, Tv, Coffee, Bath, Grid, List, Bed, Receipt, Search, Filter, Download, FileText, UserPlus, MessageSquare, DollarSign, TrendingUp, CreditCard, ArrowUpCircle, AlarmClock, LogIn, Key } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { useRooms } from "@/hooks/useRooms";
import { GuestFolioManager } from "@/components/front-desk/GuestFolioManager";
import { QueueManager } from "@/components/front-desk/QueueManager";
import { FrontDeskMessages } from "@/components/front-desk/FrontDeskMessages";
import { RoomUpgradeManager } from "@/components/front-desk/RoomUpgradeManager";
import { WakeUpCallScheduler } from "@/components/front-desk/WakeUpCallScheduler";
import { GroupCheckInOut } from "@/components/front-desk/GroupCheckInOut";
import { KeyCardManagement } from "@/components/front-desk/KeyCardManagement";
import { DataTable, Column } from "@/components/ui/data-table";
import { TableSkeleton } from "@/components/skeletons";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Tables } from "@/integrations/supabase/types";
import { RoomActionsPanel } from "@/components/rooms/RoomActionsPanel";
import { useQuickActions } from "@/contexts/QuickActionsContext";
import { FrontDeskReportsTab } from "@/components/front-desk/FrontDeskReportsTab";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { exportToExcel } from "@/lib/reportExport";
import { formatAD } from "@/lib/utils";

type Room = Tables<"rooms">;

const statusStyles = {
  available: "bg-success/20 text-success border-success/30",
  occupied: "bg-primary/20 text-primary border-primary/30",
  cleaning: "bg-warning/20 text-warning border-warning/30",
  maintenance: "bg-destructive/20 text-destructive border-destructive/30",
};

const amenityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  wifi: Wifi, tv: Tv, minibar: Coffee, jacuzzi: Bath,
};

const invoiceStatusColors = {
  paid: "bg-success/20 text-success border-success/30",
  pending: "bg-warning/20 text-warning border-warning/30",
  partial: "bg-primary/20 text-primary border-primary/30",
  overdue: "bg-destructive/20 text-destructive border-destructive/30",
};

const FrontDesk = () => {
  const queryClient = useQueryClient();
  const { data: rooms = [], isLoading } = useRooms();
  const { data: invoices = [] } = useInvoices();
  const [searchParams, setSearchParams] = useSearchParams();

  // Real-time room status sync
  useEffect(() => {
    const channel = supabase
      .channel('room-status-sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rooms'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['rooms'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
  const activeTab = searchParams.get("tab") || "rooms";
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  const handleTabChange = (value: string) => {
    setSearchParams(prev => {
      prev.set("tab", value);
      return prev;
    });
  };
  const [roomStatusFilter, setRoomStatusFilter] = useState("all");
  const [billingSearch, setBillingSearch] = useState("");
  const [billingStatusFilter, setBillingStatusFilter] = useState("all");
  const { setNewRoomOpen } = useQuickActions();

  const filteredRooms = useMemo(() => {
    if (roomStatusFilter === "all") return rooms;
    return rooms.filter((r) => r.status === roomStatusFilter);
  }, [rooms, roomStatusFilter]);

  const filteredInvoices = useMemo(() => {
    let result = invoices as any[];
    if (billingStatusFilter !== "all") {
      result = result.filter((i: any) => i.status === billingStatusFilter);
    }
    if (billingSearch) {
      const s = billingSearch.toLowerCase();
      result = result.filter((i: any) =>
        i.invoice_number?.toLowerCase().includes(s) ||
        `${i.guest?.first_name || ""} ${i.guest?.last_name || ""}`.toLowerCase().includes(s)
      );
    }
    return result;
  }, [invoices, billingSearch, billingStatusFilter]);

  const stats = useMemo(() => ({
    available: rooms.filter((r) => r.status === "available").length,
    occupied: rooms.filter((r) => r.status === "occupied").length,
    cleaning: rooms.filter((r) => r.status === "cleaning").length,
    maintenance: rooms.filter((r) => r.status === "maintenance").length,
  }), [rooms]);

  const handleExportInvoices = () => {
    exportToExcel({
      title: "Invoices_Report",
      headers: ["Invoice #", "Guest", "Date", "Total", "Paid", "Balance", "Status"],
      rows: filteredInvoices.map((i: any) => [
        i.invoice_number, i.guest ? `${i.guest.first_name} ${i.guest.last_name}` : "—",
        i.invoice_date, i.total || 0, i.amount_paid || 0, i.balance_due || 0, i.status,
      ]),
    });
  };

  const columns: Column<Room>[] = [
    { key: "room_number", header: "Room", render: (room) => <span className="font-mono font-bold text-primary">{room.room_number}</span> },
    { key: "room_type", header: "Type", render: (room) => <span>{room.room_type}</span> },
    { key: "floor", header: "Floor", render: (room) => <span>Floor {room.floor}</span> },
    { key: "capacity", header: "Capacity", render: (room) => <div className="flex items-center gap-1"><Users className="h-4 w-4 text-muted-foreground" /><span>{room.capacity}</span></div> },
    { key: "price_per_night", header: "Price/Night", render: (room) => <span className="font-semibold text-primary">{formatCurrency(room.price_per_night)}</span> },
    { key: "status", header: "Status", render: (room) => <Badge variant="outline" className={statusStyles[room.status as keyof typeof statusStyles] || statusStyles.available}>{room.status}</Badge> },
    { key: "amenities", header: "Amenities", sortable: false, searchable: false, render: (room) => (
      <div className="flex gap-1">
        {(room.amenities || []).slice(0, 4).map((amenity) => { const Icon = amenityIcons[amenity.toLowerCase()]; return Icon ? <div key={amenity} className="h-6 w-6 rounded bg-secondary flex items-center justify-center" title={amenity}><Icon className="h-3 w-3 text-muted-foreground" /></div> : null; })}
      </div>
    )},
  ];

  return (
    <MainLayout title="Front Desk" subtitle="Manage room inventory, check-ins, and billing">
      <ErrorBoundary>
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="w-full">
            <TabsTrigger value="rooms" className="gap-2"><Bed className="h-4 w-4" />Rooms</TabsTrigger>
            <TabsTrigger value="billing" className="gap-2"><Receipt className="h-4 w-4" />Billing</TabsTrigger>
            <TabsTrigger value="folios" className="gap-2"><FileText className="h-4 w-4" />Guest Folios</TabsTrigger>
            <TabsTrigger value="queue" className="gap-2"><UserPlus className="h-4 w-4" />Queue</TabsTrigger>
            <TabsTrigger value="messages" className="gap-2"><MessageSquare className="h-4 w-4" />Messages</TabsTrigger>
            <TabsTrigger value="upgrades" className="gap-2"><ArrowUpCircle className="h-4 w-4" />Upgrades</TabsTrigger>
            <TabsTrigger value="wakeup" className="gap-2"><AlarmClock className="h-4 w-4" />Wake-Up</TabsTrigger>
            <TabsTrigger value="group" className="gap-2"><LogIn className="h-4 w-4" />Group</TabsTrigger>
            <TabsTrigger value="keycards" className="gap-2"><Key className="h-4 w-4" />Key Cards</TabsTrigger>
            <TabsTrigger value="reports" className="gap-2"><TrendingUp className="h-4 w-4" />Reports</TabsTrigger>
          </TabsList>

          {/* Rooms Tab */}
          <TabsContent value="rooms">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3 space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Button variant={viewMode === "grid" ? "default" : "outline"} size="sm" onClick={() => setViewMode("grid")}><Grid className="h-4 w-4" /></Button>
                    <Button variant={viewMode === "table" ? "default" : "outline"} size="sm" onClick={() => setViewMode("table")}><List className="h-4 w-4" /></Button>
                    <Select value={roomStatusFilter} onValueChange={setRoomStatusFilter}>
                      <SelectTrigger className="w-[140px] bg-secondary">
                        <Filter className="h-4 w-4 mr-2" /><SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="occupied">Occupied</SelectItem>
                        <SelectItem value="cleaning">Cleaning</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="blue" size="sm" className="gap-2 w-full sm:w-auto" onClick={() => setNewRoomOpen(true)}>
                    <Plus className="h-4 w-4" />Add Room
                  </Button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  {[
                    { label: "Available", count: stats.available, color: "text-success" },
                    { label: "Occupied", count: stats.occupied, color: "text-primary" },
                    { label: "Cleaning", count: stats.cleaning, color: "text-warning" },
                    { label: "Maintenance", count: stats.maintenance, color: "text-destructive" },
                  ].map((stat) => (
                    <Card key={stat.label} variant="glass" className="p-3 sm:p-4 cursor-pointer" onClick={() => setRoomStatusFilter(stat.label.toLowerCase())}>
                      <p className="text-xs sm:text-sm text-muted-foreground">{stat.label}</p>
                      <p className={cn("text-xl sm:text-2xl font-bold font-display", stat.color)}>{isLoading ? "-" : stat.count}</p>
                    </Card>
                  ))}
                </div>

                {isLoading ? <TableSkeleton columns={7} rows={5} /> : viewMode === "table" ? (
                  <Card variant="elevated">
                    <CardHeader><CardTitle>All Rooms ({filteredRooms.length})</CardTitle></CardHeader>
                    <CardContent>
                      <DataTable data={filteredRooms} columns={columns} keyExtractor={(room) => room.id} searchPlaceholder="Search rooms..." emptyMessage="No rooms found." pageSize={10} onRowClick={(room) => setSelectedRoom(room)} />
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                    {filteredRooms.map((room, index) => (
                      <Card key={room.id} variant="elevated" className={cn("animate-slide-up overflow-hidden hover:shadow-glow transition-all cursor-pointer group", selectedRoom?.id === room.id && "ring-2 ring-primary")} style={{ animationDelay: `${index * 50}ms` }} onClick={() => setSelectedRoom(room)}>
                        <div className="h-32 bg-gradient-card flex items-center justify-center relative">
                          <span className="text-5xl font-display font-bold text-gradient-blue">{room.room_number}</span>
                          <Badge variant="outline" className={cn("absolute top-3 right-3", statusStyles[room.status as keyof typeof statusStyles] || statusStyles.available)}>{room.status}</Badge>
                        </div>
                        <CardContent className="p-4">
                          <div className="mb-3"><h3 className="font-semibold text-foreground">{room.room_type}</h3><p className="text-sm text-muted-foreground">Floor {room.floor}</p></div>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground"><Users className="h-4 w-4" /><span>Up to {room.capacity}</span></div>
                            <div className="text-right"><span className="text-xl font-bold text-primary">{formatCurrency(room.price_per_night)}</span><span className="text-xs text-muted-foreground">/night</span></div>
                          </div>
                          <div className="flex gap-2 pt-3 border-t border-border">
                            {(room.amenities || []).map((amenity) => { const Icon = amenityIcons[amenity.toLowerCase()]; return Icon ? <div key={amenity} className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center" title={amenity}><Icon className="h-4 w-4 text-muted-foreground" /></div> : null; })}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {filteredRooms.length === 0 && <div className="col-span-full text-center py-12 text-muted-foreground">No rooms found</div>}
                  </div>
                )}
              </div>
              <div className="lg:col-span-1"><RoomActionsPanel selectedRoom={selectedRoom} onClearSelection={() => setSelectedRoom(null)} /></div>
            </div>
          </TabsContent>

          <TabsContent value="folios"><GuestFolioManager /></TabsContent>
          <TabsContent value="queue"><QueueManager /></TabsContent>
          <TabsContent value="messages"><FrontDeskMessages /></TabsContent>
          <TabsContent value="upgrades"><RoomUpgradeManager /></TabsContent>
          <TabsContent value="wakeup"><WakeUpCallScheduler /></TabsContent>
          <TabsContent value="group"><GroupCheckInOut /></TabsContent>
          <TabsContent value="keycards"><KeyCardManagement /></TabsContent>
          <TabsContent value="reports"><FrontDeskReportsTab /></TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing">
            <div className="space-y-6">
              {(() => {
                const totalRevenue = invoices.reduce((s: number, i: any) => s + (i.total || 0), 0);
                const pendingInvoices = invoices.filter((i: any) => i.status === "pending" || i.status === "partial");
                const pendingAmount = pendingInvoices.reduce((s: number, i: any) => s + (i.balance_due || 0), 0);
                const paidCount = invoices.filter((i: any) => i.status === "paid").length;
                const successRate = invoices.length > 0 ? ((paidCount / invoices.length) * 100).toFixed(1) : "0";
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    <MetricCard title="Total Invoiced" value={formatCurrency(totalRevenue)} change={`${invoices.length} invoices`} changeType="neutral" icon={DollarSign} delay={0} />
                    <MetricCard title="Pending Payments" value={formatCurrency(pendingAmount)} change={`${pendingInvoices.length} invoices`} changeType="neutral" icon={Receipt} delay={50} />
                    <MetricCard title="Paid Invoices" value={`${paidCount}`} change={`of ${invoices.length} total`} changeType="positive" icon={TrendingUp} delay={100} />
                    <MetricCard title="Payment Success Rate" value={`${successRate}%`} change="based on paid/total" changeType="positive" icon={CreditCard} delay={150} />
                  </div>
                );
              })()}

              <Card variant="elevated" className="animate-fade-in overflow-hidden">
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <CardTitle>Recent Invoices ({filteredInvoices.length})</CardTitle>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-initial">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input placeholder="Search invoices..." className="w-full sm:w-48 lg:w-64 pl-9 bg-secondary" value={billingSearch} onChange={(e) => setBillingSearch(e.target.value)} />
                    </div>
                    <Select value={billingStatusFilter} onValueChange={setBillingStatusFilter}>
                      <SelectTrigger className="w-[120px] bg-secondary">
                        <Filter className="h-4 w-4 mr-2" /><SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="partial">Partial</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" className="gap-2" onClick={handleExportInvoices}>
                      <Download className="h-4 w-4" /><span className="hidden sm:inline">Export</span>
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
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredInvoices.length === 0 ? (
                          <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No invoices found.</TableCell></TableRow>
                        ) : filteredInvoices.map((invoice: any) => (
                          <TableRow key={invoice.id} className="border-border hover:bg-secondary/50">
                            <TableCell className="font-mono text-sm text-primary whitespace-nowrap">{invoice.invoice_number}</TableCell>
                            <TableCell className="font-medium whitespace-nowrap">{invoice.guest ? `${invoice.guest.first_name} ${invoice.guest.last_name}` : "—"}</TableCell>
                            <TableCell className="text-muted-foreground hidden md:table-cell">{invoice.reservation?.reservation_code || "—"}</TableCell>
                            <TableCell className="hidden lg:table-cell">{invoice.invoice_date}</TableCell>
                            <TableCell className="font-semibold whitespace-nowrap">{formatCurrency(invoice.total || 0)}</TableCell>
                            <TableCell><Badge variant="outline" className={invoiceStatusColors[invoice.status as keyof typeof invoiceStatusColors] || ""}>{invoice.status}</Badge></TableCell>
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
