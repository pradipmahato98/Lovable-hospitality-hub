import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, startOfWeek, eachDayOfInterval, isSameDay, isWithinInterval, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CheckInOutDialog } from "./CheckInOutDialog";

interface Reservation {
  id: string;
  reservation_code: string;
  check_in_date: string;
  check_out_date: string;
  status: string;
  guest: {
    first_name: string;
    last_name: string;
  };
  room: {
    room_number: string;
    room_type: string;
  };
}

interface Room {
  id: string;
  room_number: string;
  room_type: string;
  status: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-warning/80",
  confirmed: "bg-success/80",
  "checked-in": "bg-primary/80",
  "checked-out": "bg-muted",
  cancelled: "bg-destructive/80",
  "no-show": "bg-destructive/60",
};

export function ReservationCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReservation, setSelectedReservation] = useState<string | null>(null);
  const [dialogMode, setDialogMode] = useState<"walk-in" | "check-in" | "check-out">("check-in");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draggedReservation, setDraggedReservation] = useState<string | null>(null);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({
    start: weekStart,
    end: addDays(weekStart, 13), // Show 2 weeks
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    
    const startDate = format(weekStart, "yyyy-MM-dd");
    const endDate = format(addDays(weekStart, 13), "yyyy-MM-dd");

    const [reservationsResult, roomsResult] = await Promise.all([
      supabase
        .from("reservations")
        .select(`
          id,
          reservation_code,
          check_in_date,
          check_out_date,
          status,
          guest:guests(first_name, last_name),
          room:rooms(room_number, room_type)
        `)
        .gte("check_out_date", startDate)
        .lte("check_in_date", endDate)
        .neq("status", "cancelled"),
      supabase
        .from("rooms")
        .select("id, room_number, room_type, status")
        .order("room_number"),
    ]);

    if (reservationsResult.data) {
      setReservations(reservationsResult.data as unknown as Reservation[]);
    }
    if (roomsResult.data) {
      setRooms(roomsResult.data);
    }
    setIsLoading(false);
  }, [weekStart]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getReservationsForRoomAndDate = (roomNumber: string, date: Date) => {
    return reservations.filter((res) => {
      if (res.room?.room_number !== roomNumber) return false;
      const checkIn = parseISO(res.check_in_date);
      const checkOut = parseISO(res.check_out_date);
      return isWithinInterval(date, { start: checkIn, end: addDays(checkOut, -1) }) ||
             isSameDay(date, checkIn);
    });
  };

  const isCheckInDate = (reservation: Reservation, date: Date) => {
    return isSameDay(parseISO(reservation.check_in_date), date);
  };

  const isCheckOutDate = (reservation: Reservation, date: Date) => {
    return isSameDay(parseISO(reservation.check_out_date), date);
  };

  const handleDragStart = (e: React.DragEvent, reservationId: string) => {
    setDraggedReservation(reservationId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, roomId: string, date: Date) => {
    e.preventDefault();
    if (!draggedReservation) return;

    const reservation = reservations.find((r) => r.id === draggedReservation);
    if (!reservation) return;

    const checkInDate = parseISO(reservation.check_in_date);
    const checkOutDate = parseISO(reservation.check_out_date);
    const stayDuration = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

    const newCheckIn = format(date, "yyyy-MM-dd");
    const newCheckOut = format(addDays(date, stayDuration), "yyyy-MM-dd");

    const { error } = await supabase
      .from("reservations")
      .update({
        room_id: roomId,
        check_in_date: newCheckIn,
        check_out_date: newCheckOut,
      })
      .eq("id", draggedReservation);

    if (!error) {
      fetchData();
    }
    setDraggedReservation(null);
  };

  const handleReservationClick = (reservation: Reservation) => {
    setSelectedReservation(reservation.id);
    if (reservation.status === "confirmed" || reservation.status === "pending") {
      setDialogMode("check-in");
    } else if (reservation.status === "checked-in") {
      setDialogMode("check-out");
    }
    setDialogOpen(true);
  };

  const goToPreviousWeek = () => setCurrentDate(addDays(currentDate, -7));
  const goToNextWeek = () => setCurrentDate(addDays(currentDate, 7));
  const goToToday = () => setCurrentDate(new Date());

  if (isLoading) {
    return (
      <Card variant="elevated">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card variant="elevated" className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Reservation Calendar
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-32 text-center">
              {format(weekStart, "MMM d")} - {format(addDays(weekStart, 13), "MMM d, yyyy")}
            </span>
            <Button variant="outline" size="icon" onClick={goToNextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="sticky left-0 bg-card z-10 p-3 text-left text-sm font-medium text-muted-foreground min-w-24">
                    Room
                  </th>
                  {weekDays.map((day) => (
                    <th
                      key={day.toISOString()}
                      className={cn(
                        "p-2 text-center text-xs font-medium min-w-20",
                        isSameDay(day, new Date()) && "bg-primary/10"
                      )}
                    >
                      <div className="text-muted-foreground">{format(day, "EEE")}</div>
                      <div className={cn(
                        "text-sm",
                        isSameDay(day, new Date()) && "text-primary font-bold"
                      )}>
                        {format(day, "d")}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rooms.map((room) => (
                  <tr key={room.id} className="border-b border-border hover:bg-secondary/30">
                    <td className="sticky left-0 bg-card z-10 p-3 border-r border-border">
                      <div className="font-medium">{room.room_number}</div>
                      <div className="text-xs text-muted-foreground capitalize">{room.room_type}</div>
                    </td>
                    {weekDays.map((day) => {
                      const dayReservations = getReservationsForRoomAndDate(room.room_number, day);
                      
                      return (
                        <td
                          key={day.toISOString()}
                          className={cn(
                            "p-1 h-16 relative",
                            isSameDay(day, new Date()) && "bg-primary/5"
                          )}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, room.id, day)}
                        >
                          {dayReservations.map((res) => (
                            <div
                              key={res.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, res.id)}
                              onClick={() => handleReservationClick(res)}
                              className={cn(
                                "absolute inset-x-0.5 inset-y-1 rounded-md px-1.5 py-0.5 cursor-pointer transition-all",
                                "hover:ring-2 hover:ring-primary/50 hover:z-20",
                                statusColors[res.status] || "bg-secondary",
                                isCheckInDate(res, day) && "rounded-l-lg ml-0.5",
                                isCheckOutDate(res, day) && "rounded-r-lg mr-0.5",
                                draggedReservation === res.id && "opacity-50"
                              )}
                            >
                              {isCheckInDate(res, day) && (
                                <div className="truncate text-xs font-medium text-white">
                                  {res.guest?.first_name} {res.guest?.last_name?.charAt(0)}.
                                </div>
                              )}
                            </div>
                          ))}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Legend */}
          <div className="p-4 border-t border-border flex flex-wrap gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Badge className="bg-warning/80">Pending</Badge>
              <Badge className="bg-success/80">Confirmed</Badge>
              <Badge className="bg-primary/80">Checked-in</Badge>
              <Badge className="bg-muted text-muted-foreground">Checked-out</Badge>
            </div>
            <div className="text-xs text-muted-foreground ml-auto">
              Tip: Drag reservations to move them
            </div>
          </div>
        </CardContent>
      </Card>

      <CheckInOutDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        reservationId={selectedReservation || undefined}
        onSuccess={fetchData}
      />
    </>
  );
}
