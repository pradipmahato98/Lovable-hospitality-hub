import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Filter, Plus, MoreVertical, LogIn, LogOut, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { NewReservationDialog } from "@/components/reservations/NewReservationDialog";
import { CheckInOutDialog } from "@/components/reservations/CheckInOutDialog";

interface Reservation {
  id: string;
  reservation_code: string;
  check_in_date: string;
  check_out_date: string;
  status: string;
  total_amount: number;
  guest: {
    first_name: string;
    last_name: string;
  } | null;
  room: {
    room_number: string;
    room_type: string;
  } | null;
}

const statusColors: Record<string, string> = {
  confirmed: "bg-success/20 text-success border-success/30",
  pending: "bg-warning/20 text-warning border-warning/30",
  "checked-in": "bg-primary/20 text-primary border-primary/30",
  "checked-out": "bg-muted text-muted-foreground border-border",
  cancelled: "bg-destructive/20 text-destructive border-destructive/30",
};

const Reservations = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [checkInOutDialog, setCheckInOutDialog] = useState<{
    open: boolean;
    mode: "check-in" | "check-out";
    reservationId: string;
  }>({ open: false, mode: "check-in", reservationId: "" });

  const fetchReservations = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("reservations")
      .select(`
        id,
        reservation_code,
        check_in_date,
        check_out_date,
        status,
        total_amount,
        guest:guests(first_name, last_name),
        room:rooms(room_number, room_type)
      `)
      .order("check_in_date", { ascending: false });

    if (!error && data) {
      setReservations(data as unknown as Reservation[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const filteredReservations = reservations.filter((res) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      res.reservation_code.toLowerCase().includes(query) ||
      `${res.guest?.first_name} ${res.guest?.last_name}`.toLowerCase().includes(query) ||
      res.room?.room_number.toLowerCase().includes(query)
    );
  });

  return (
    <MainLayout title="Reservations" subtitle="Manage all bookings and reservations">
      <Card variant="elevated" className="animate-fade-in overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle>All Reservations</CardTitle>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search reservations..."
                className="w-full sm:w-48 lg:w-64 pl-9 bg-secondary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filter</span>
            </Button>
            <Button variant="gold" size="sm" className="gap-2" onClick={() => setNewDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Reservation</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="whitespace-nowrap">Reservation ID</TableHead>
                    <TableHead className="whitespace-nowrap">Guest</TableHead>
                    <TableHead className="whitespace-nowrap hidden md:table-cell">Room</TableHead>
                    <TableHead className="whitespace-nowrap hidden lg:table-cell">Check In</TableHead>
                    <TableHead className="whitespace-nowrap hidden lg:table-cell">Check Out</TableHead>
                    <TableHead className="whitespace-nowrap">Status</TableHead>
                    <TableHead className="whitespace-nowrap hidden sm:table-cell">Total</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReservations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                        No reservations found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredReservations.map((reservation) => (
                      <TableRow key={reservation.id} className="border-border hover:bg-secondary/50">
                        <TableCell className="font-mono text-sm text-primary whitespace-nowrap">
                          {reservation.reservation_code}
                        </TableCell>
                        <TableCell className="font-medium whitespace-nowrap">
                          {reservation.guest
                            ? `${reservation.guest.first_name} ${reservation.guest.last_name}`
                            : "Unknown"}
                        </TableCell>
                        <TableCell className="text-muted-foreground hidden md:table-cell">
                          {reservation.room
                            ? `${reservation.room.room_number} - ${reservation.room.room_type}`
                            : "N/A"}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {format(new Date(reservation.check_in_date), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {format(new Date(reservation.check_out_date), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={statusColors[reservation.status] || statusColors.pending}
                          >
                            {reservation.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold hidden sm:table-cell">
                          ${reservation.total_amount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {(reservation.status === "confirmed" || reservation.status === "pending") && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    setCheckInOutDialog({
                                      open: true,
                                      mode: "check-in",
                                      reservationId: reservation.id,
                                    })
                                  }
                                >
                                  <LogIn className="h-4 w-4 mr-2" />
                                  Check In
                                </DropdownMenuItem>
                              )}
                              {reservation.status === "checked-in" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    setCheckInOutDialog({
                                      open: true,
                                      mode: "check-out",
                                      reservationId: reservation.id,
                                    })
                                  }
                                >
                                  <LogOut className="h-4 w-4 mr-2" />
                                  Check Out
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <NewReservationDialog
        open={newDialogOpen}
        onOpenChange={setNewDialogOpen}
        onSuccess={fetchReservations}
      />

      <CheckInOutDialog
        open={checkInOutDialog.open}
        onOpenChange={(open) => setCheckInOutDialog({ ...checkInOutDialog, open })}
        mode={checkInOutDialog.mode}
        reservationId={checkInOutDialog.reservationId}
        onSuccess={fetchReservations}
      />
    </MainLayout>
  );
};

export default Reservations;
