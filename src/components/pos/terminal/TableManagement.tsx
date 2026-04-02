import React, { useState } from "react";
import { usePOSTerminal } from "@/hooks/pos/usePOSTerminal";
import { ThreeDTableMap } from "@/components/pos/ThreeDTableMap";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LayoutGrid,
  Box,
  Users,
  Clock,
  AlertCircle,
  Plus,
  Search,
  History,
  Timer
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGuests } from "@/hooks/useGuests";
import { useReservations } from "@/hooks/useReservations";
import { cn } from "@/lib/utils";

interface TableManagementProps {
  onSelectTable: (orderId: string, tableId: string) => void;
}

export const TableManagement: React.FC<TableManagementProps> = ({ onSelectTable }) => {
  const { tables, activeOrders, waitlist, openTable, addToWaitlist } = usePOSTerminal();
  const [viewMode, setViewMode] = useState<"2d" | "3d">("2d");
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);
  const [isOpenTableDialogOpen, setIsOpenTableDialogOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<any>(null);

  // PMS Lookup
  const [pmsSearch, setPmsSearch] = useState("");
  const { data: allGuests = [] } = useGuests();
  const { data: allReservations = [] } = useReservations();

  const filteredGuests = allGuests.filter(g =>
    `${g.first_name} ${g.last_name}`.toLowerCase().includes(pmsSearch.toLowerCase()) ||
    g.id_number?.includes(pmsSearch)
  );

  const handleOpenTable = async (table: any, guest?: any) => {
    const res = await openTable.mutateAsync({
      tableId: table.id,
      guests: table.capacity, // Default
      serverName: "Current User", // Should come from auth
      guestId: guest?.id,
      reservationId: allReservations.find(r => r.guest_id === guest?.id && r.status === 'checked-in')?.id
    });

    if (res) {
      onSelectTable(res.id, table.id);
      setIsOpenTableDialogOpen(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "occupied": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "reserved": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "dirty": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getTimer = (startTime: string | null) => {
    if (!startTime) return null;
    const diff = Math.floor((Date.now() - new Date(startTime).getTime()) / 60000);
    return `${diff}m`;
  };

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 bg-background p-1 rounded-lg border shadow-sm">
          <Button
            variant={viewMode === "2d" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("2d")}
            className="gap-2"
          >
            <LayoutGrid className="h-4 w-4" />
            2D Floor Plan
          </Button>
          <Button
            variant={viewMode === "3d" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("3d")}
            className="gap-2"
          >
            <Box className="h-4 w-4" />
            3D Map
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setIsWaitlistOpen(true)} className="gap-2">
            <Users className="h-4 w-4" />
            Waitlist ({waitlist.length})
          </Button>
          <div className="flex items-center gap-2 px-3 py-1 bg-background rounded-full border text-xs font-medium">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            System Live
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
        {/* Main Floor Plan */}
        <Card className="lg:col-span-3 flex flex-col overflow-hidden">
          <CardHeader className="pb-2 border-bottom">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Main Dining Hall</CardTitle>
              <div className="flex gap-2">
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">4 Available</Badge>
                <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">8 Occupied</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 bg-muted/10 relative overflow-hidden">
            {viewMode === "2d" ? (
              <ScrollArea className="h-full p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {tables.map((table) => {
                    const activeOrder = activeOrders.find(o => o.table_id === table.id);
                    return (
                      <div
                        key={table.id}
                        onClick={() => {
                          if (table.status === 'occupied' && activeOrder) {
                            onSelectTable(activeOrder.id, table.id);
                          } else {
                            setSelectedTable(table);
                            setIsOpenTableDialogOpen(true);
                          }
                        }}
                        className={cn(
                          "relative group aspect-square p-4 rounded-xl border-2 transition-all cursor-pointer hover:shadow-lg",
                          table.status === 'available' ? "bg-background border-dashed border-muted-foreground/30 hover:border-primary" : "bg-background border-primary shadow-sm"
                        )}
                      >
                        <div className="flex flex-col h-full justify-between">
                          <div className="flex justify-between items-start">
                            <span className="text-2xl font-bold text-muted-foreground group-hover:text-primary">#{table.table_number}</span>
                            <Badge className={cn("capitalize", getStatusColor(table.status))}>
                              {table.status}
                            </Badge>
                          </div>

                          {table.status === 'occupied' && activeOrder && (
                            <div className="space-y-1">
                              <p className="text-sm font-semibold truncate">
                                {activeOrder.guest?.first_name} {activeOrder.guest?.last_name || "Guest"}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Users className="h-3 w-3" />
                                {table.guests} Guests
                                <Timer className="h-3 w-3 ml-2" />
                                {getTimer(table.start_time)}
                              </div>
                            </div>
                          )}

                          {table.status === 'available' && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Users className="h-3 w-3" />
                              Cap: {table.capacity}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            ) : (
              <div className="h-full flex items-center justify-center p-6">
                 <ThreeDTableMap
                    tables={tables.map(t => ({
                      id: t.id,
                      number: t.table_number,
                      status: t.status as any,
                      capacity: t.capacity,
                      x: 100, // Dummy coordinates for demo
                      y: 100
                    }))}
                 />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sidebar: Waitlist & Quick Stats */}
        <div className="space-y-6 overflow-y-auto">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Waitlist Queue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {waitlist.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic text-center py-4">Queue is empty</p>
                ) : (
                  waitlist.map((item) => (
                    <div key={item.id} className="p-3 bg-muted/30 rounded-lg border flex flex-col gap-1">
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-bold truncate">{item.guest_name}</span>
                        <Badge variant="outline" className="text-[10px] h-4">{item.party_size}p</Badge>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {getTimer(item.created_at)}
                        </span>
                        <Button size="icon" variant="ghost" className="h-6 w-6">
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Occupancy Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-xs text-muted-foreground">Total Covers</span>
                  <span className="text-xl font-bold">24</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div className="bg-primary h-full rounded-full w-[65%]" />
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-xs text-muted-foreground">Avg. Turnover</span>
                  <span className="text-sm font-medium font-mono">42m</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Open Table Dialog with PMS Recognition */}
      <Dialog open={isOpenTableDialogOpen} onOpenChange={setIsOpenTableDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Open Table #{selectedTable?.table_number}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div className="space-y-4 border-r pr-6">
              <div className="space-y-2">
                <Label>Guest Search (PMS Sync)</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Name, Room, or ID..."
                    className="pl-9"
                    value={pmsSearch}
                    onChange={(e) => setPmsSearch(e.target.value)}
                  />
                </div>
              </div>

              <ScrollArea className="h-[300px] border rounded-md">
                <div className="p-2 space-y-1">
                  {filteredGuests.map(guest => (
                    <div
                      key={guest.id}
                      onClick={() => handleOpenTable(selectedTable, guest)}
                      className="p-3 hover:bg-primary/10 rounded-lg cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold group-hover:text-primary">{guest.first_name} {guest.last_name}</span>
                        {guest.is_vip && <Badge className="bg-amber-500 text-white border-none text-[10px] h-4">VIP</Badge>}
                      </div>
                      <div className="flex gap-2">
                        {guest.allergies && (
                          <Badge variant="outline" className="text-[10px] border-red-200 text-red-500 bg-red-50 uppercase">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {guest.allergies}
                          </Badge>
                        )}
                        <span className="text-[10px] text-muted-foreground uppercase">ID: {guest.id_number}</span>
                      </div>
                    </div>
                  ))}
                  {filteredGuests.length === 0 && (
                     <div
                        onClick={() => handleOpenTable(selectedTable)}
                        className="p-4 text-center border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50"
                     >
                        <p className="text-sm font-medium">Walk-in Guest</p>
                        <p className="text-xs text-muted-foreground">Skip PMS linkage</p>
                     </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            <div className="space-y-6">
               <div className="p-4 rounded-xl bg-muted/30 border space-y-4">
                  <h4 className="text-sm font-bold flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Resident Status & History
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Active Reservation</span>
                      <span className="font-medium text-green-500">None detected</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Meal Plan</span>
                      <Badge variant="outline" className="text-[10px]">Room Only</Badge>
                    </div>
                  </div>
               </div>

               <div className="space-y-3 pt-4">
                  <Button className="w-full h-12 text-lg font-bold" onClick={() => handleOpenTable(selectedTable)}>
                    Confirm Walk-in Open
                  </Button>
                  <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest">
                    Table #{selectedTable?.table_number} • {selectedTable?.capacity} Seats
                  </p>
               </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
