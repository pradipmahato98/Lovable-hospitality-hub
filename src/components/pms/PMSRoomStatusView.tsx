import React, { useState, useMemo } from "react";
import { PMSRoomCard } from "./PMSRoomCard";
import { PMSOperationsSidebar } from "./PMSOperationsSidebar";
import { useRooms } from "@/hooks/useRooms";
import { useReservations } from "@/hooks/useReservations";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Search, Filter, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { PMSActionDialog } from "./PMSActionDialog";
import { usePMSRealtime } from "@/hooks/usePMSRealtime";
import { useQueryClient } from "@tanstack/react-query";
import { CheckInOutDialog } from "../reservations/CheckInOutDialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSearchParams } from "react-router-dom";

interface PMSRoomStatusViewProps {
  onTabChange?: (tab: string) => void;
}

export const PMSRoomStatusView = ({ onTabChange }: PMSRoomStatusViewProps) => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: rooms = [], isLoading: roomsLoading, refetch: refetchRooms } = useRooms();
  const { reservations = [], isLoading: resLoading, refetch: refetchRes } = useReservations();

  // Enable Real-time synchronization
  usePMSRealtime({
    onRoomUpdate: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["guest_folios"] });
      refetchRooms();
    },
    onReservationUpdate: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({ queryKey: ["guest_folios"] });
      refetchRes();
    }
  });

  const [activeModule, setActiveModule] = useState("room-status");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState("");
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [checkInOutOpen, setCheckInOutOpen] = useState(false);
  const [checkInOutMode, setCheckInOutMode] = useState<"walk-in" | "check-in" | "check-out">("walk-in");

  const isLoading = roomsLoading || resLoading;

  // Map reservations to rooms for occupied/arrival status
  const roomOccupancy = useMemo(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    const map: Record<string, { guestName: string; checkoutDate: string; keyIssued: boolean; arrivalToday: boolean }> = {};

    reservations.forEach(res => {
      if (res.status === 'checked-in' && res.room_id) {
        map[res.room_id] = {
          guestName: `${res.guest?.first_name} ${res.guest?.last_name}`,
          checkoutDate: res.check_out_date,
          keyIssued: true, // Mocking key issued if checked in
          arrivalToday: false
        };
      } else if (res.status === 'confirmed' && res.check_in_date === today && res.room_id) {
        if (!map[res.room_id]) {
          map[res.room_id] = {
            guestName: "",
            checkoutDate: "",
            keyIssued: false,
            arrivalToday: true
          };
        }
      }
    });
    return map;
  }, [reservations]);

  const filteredRooms = useMemo(() => {
    return rooms.filter(room => {
      const matchesStatus = statusFilter === 'all' || room.status.toLowerCase() === statusFilter;
      const matchesSearch = room.room_number.includes(searchQuery) ||
                           room.room_type.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [rooms, statusFilter, searchQuery]);

  const handleRefresh = async () => {
    try {
      await Promise.all([
        refetchRooms(),
        refetchRes(),
        queryClient.invalidateQueries({ queryKey: ["rooms"] }),
        queryClient.invalidateQueries({ queryKey: ["reservations"] }),
        queryClient.invalidateQueries({ queryKey: ["guest_folios"] })
      ]);
      toast.success("PMS Core Resynchronized");
    } catch (err) {
      toast.error("Resynchronization Failed");
    }
  };

  const handleAction = (action: string, room: any) => {
    setSelectedRoom(room);

    switch(action) {
      case 'checkin':
        setCheckInOutMode('walk-in');
        setCheckInOutOpen(true);
        break;
      case 'checkout':
        const resForCheckout = reservations.find(r => r.room_id === room.id && r.status === 'checked-in');
        if (resForCheckout) {
          setCheckInOutMode('check-out');
          setCheckInOutOpen(true);
        } else {
          toast.error("No active check-in found for this room.");
        }
        break;
      case 'advance-receipt':
      case 'rate-posting':
      case 'room-move':
      case 'change-rate':
      case 'move':
      case 'add-charge':
      case 'quick-payment':
        setActionType(action === 'move' ? 'room-move' : (action === 'add-charge' ? 'quick-charge' : action));
        setActionDialogOpen(true);
        break;
      case 'folio':
        onTabChange?.('folios');
        // Optional: set search params to filter folio for this guest
        if (room.id) {
          setSearchParams({ room: room.room_number });
        }
        break;
      case 'set_available':
        updateRoomStatus(room.id, 'available');
        break;
      case 'set_dirty':
        updateRoomStatus(room.id, 'dirty');
        break;
      case 'set_maintenance':
        updateRoomStatus(room.id, 'maintenance');
        break;
      case 'set_blocked':
        updateRoomStatus(room.id, 'blocked');
        break;
      default:
        console.log(`Action: ${action} on Room ${room.room_number}`);
        break;
    }
  };

  const updateRoomStatus = async (roomId: string, status: string) => {
    try {
      const { error } = await supabase.from('rooms').update({ status }).eq('id', roomId);
      if (error) throw error;
      toast.success(`Room status updated to ${status}`);
      refetchRooms();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleModuleChange = (moduleId: string) => {
    setActiveModule(moduleId);

    // Handle tab transitions for specific modules
    if (moduleId === 'guest-folios') {
      onTabChange?.('folios');
      return;
    }
    if (moduleId === 'reports') {
      onTabChange?.('reports');
      return;
    }
    if (moduleId === 'check-in') {
      setCheckInOutMode('walk-in');
      setCheckInOutOpen(true);
      return;
    }
    if (moduleId === 'reservation') {
      onTabChange?.('rooms'); // Or stay and maybe open new res dialog if we had one
      return;
    }

    if (moduleId !== 'room-status' && moduleId !== 'availability-grid') {
      setActionType(moduleId);
      setActionDialogOpen(true);
    }
  };

  return (
    <div className="flex h-full bg-background overflow-hidden border-border">
      <CheckInOutDialog
        open={checkInOutOpen}
        onOpenChange={setCheckInOutOpen}
        mode={checkInOutMode}
        reservationId={reservations.find(r => r.room_id === selectedRoom?.id && (r.status === 'checked-in' || r.status === 'confirmed'))?.id}
        onSuccess={() => {
          refetchRooms();
          refetchRes();
        }}
      />
      <PMSActionDialog
        open={actionDialogOpen}
        onOpenChange={setActionDialogOpen}
        type={actionType}
        room={selectedRoom}
      />
      {/* Sidebar */}
      <PMSOperationsSidebar
        activeModule={activeModule}
        onModuleChange={handleModuleChange}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header / Toolbar */}
        <div className="h-16 border-b border-border bg-card/50 flex items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <Tabs value={statusFilter} onValueChange={setStatusFilter} className="bg-transparent">
              <TabsList className="bg-secondary/50 border border-border p-1 h-9">
                {['all', 'available', 'occupied', 'dirty', 'maintenance', 'blocked'].map(status => (
                  <TabsTrigger
                    key={status}
                    value={status}
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-wider h-7 px-4",
                      "data-[state=active]:bg-cyan-500 data-[state=active]:text-black"
                    )}
                  >
                    {status}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="SEARCH ROOMS..."
                className="w-64 bg-secondary/50 border-border h-9 pl-9 text-[10px] font-bold tracking-wider focus:ring-primary focus:border-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 bg-secondary/50 border-border text-muted-foreground hover:text-foreground"
              onClick={handleRefresh}
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* Room Grid */}
        <ScrollArea className="flex-1 p-6">
          {isLoading ? (
            <div className="h-[400px] flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
              <p className="text-zinc-500 text-xs font-bold tracking-widest uppercase">Initializing PMS Core...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {filteredRooms.map((room) => {
                const occupancy = roomOccupancy[room.id];
                return (
                  <PMSRoomCard
                    key={room.id}
                    room={{
                      id: room.id,
                      room_number: room.room_number,
                      room_type: room.room_type,
                      status: room.status,
                      price_per_night: room.price_per_night
                    }}
                    currentGuest={occupancy ? {
                      name: occupancy.guestName,
                      checkoutDate: occupancy.checkoutDate,
                      keyIssued: occupancy.keyIssued
                    } : undefined}
                    arrivalToday={occupancy?.arrivalToday}
                    onAction={handleAction}
                  />
                );
              })}
            </div>
          )}

          {!isLoading && filteredRooms.length === 0 && (
            <div className="h-[400px] flex flex-col items-center justify-center gap-4 border-2 border-dashed border-border rounded-xl">
              <p className="text-muted-foreground text-xs font-bold tracking-widest uppercase">No rooms found matching filters</p>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
};
