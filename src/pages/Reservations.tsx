import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, Plus, MoreVertical, LogIn, LogOut, CalendarDays, List, UserPlus, Receipt, CheckCircle, XCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { NewReservationDialog } from "@/components/reservations/NewReservationDialog";
import { CheckInOutDialog } from "@/components/reservations/CheckInOutDialog";
import { ReservationCalendar } from "@/components/reservations/ReservationCalendar";
import { ReservationDetailsDialog } from "@/components/reservations/ReservationDetailsDialog";
import { useReservations, useUpdateReservation } from "@/hooks/useReservations";
import { useRealtimeReservations } from "@/hooks/useRealtimeReservations";
import { TableSkeleton } from "@/components/skeletons";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const statusColors: Record<string, string> = {
  confirmed: "bg-success/20 text-success border-success/30",
  pending: "bg-warning/20 text-warning border-warning/30",
  "checked-in": "bg-primary/20 text-primary border-primary/30",
  "checked-out": "bg-muted text-muted-foreground border-border",
  cancelled: "bg-destructive/20 text-destructive border-destructive/30",
  rejected: "bg-destructive/10 text-destructive/70 border-destructive/20",
};

const Reservations = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("list");
  const [walkInDialogOpen, setWalkInDialogOpen] = useState(false);
  const [checkInOutDialog, setCheckInOutDialog] = useState<{
    open: boolean;
    mode: "check-in" | "check-out";
    reservationId: string;
  }>({ open: false, mode: "check-in", reservationId: "" });
  const [detailsDialog, setDetailsDialog] = useState<{ open: boolean; reservation: any }>({
    open: false,
    reservation: null
  });
  const [rejectingReservationId, setRejectingReservationId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const { isLoading, refetch, filterReservations } = useReservations();
  const updateReservation = useUpdateReservation();
  const filteredReservations = filterReservations(searchQuery);

  // Enable realtime updates
  useRealtimeReservations({
    onInsert: refetch,
    onUpdate: refetch,
    onDelete: refetch,
  });

  return (
    <MainLayout title="Reservations" subtitle="Manage all bookings and reservations">
      <ErrorBoundary>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <TabsList>
              <TabsTrigger value="list" className="gap-2">
                <List className="h-4 w-4" />
                List View
              </TabsTrigger>
              <TabsTrigger value="calendar" className="gap-2">
                <CalendarDays className="h-4 w-4" />
                Calendar
              </TabsTrigger>
            </TabsList>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setWalkInDialogOpen(true)} className="gap-2">
                <UserPlus className="h-4 w-4" />
                Walk-in
              </Button>
              <Button variant="gold" className="gap-2" onClick={() => setNewDialogOpen(true)}>
                <Plus className="h-4 w-4" />
                New Reservation
              </Button>
            </div>
          </div>

          {/* List View Tab */}
          <TabsContent value="list">
            <Card variant="elevated" className="animate-fade-in overflow-hidden">
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>All Reservations</CardTitle>
                  <Badge variant="outline" className="mt-2 text-[10px] font-bold uppercase tracking-wider">Status Management</Badge>
                </div>
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
                </div>
              </CardHeader>
              <CardContent className="p-0 sm:p-6">
                {isLoading ? (
                  <div className="p-6"><TableSkeleton columns={7} rows={5} /></div>
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
                                {reservation.guest ? `${reservation.guest.first_name} ${reservation.guest.last_name}` : "Unknown"}
                              </TableCell>
                              <TableCell className="text-muted-foreground hidden md:table-cell">
                                {reservation.room ? `${reservation.room.room_number} - ${reservation.room.room_type}` : "N/A"}
                              </TableCell>
                              <TableCell className="hidden lg:table-cell">
                                {format(new Date(reservation.check_in_date), "MMM dd, yyyy")}
                              </TableCell>
                              <TableCell className="hidden lg:table-cell">
                                {format(new Date(reservation.check_out_date), "MMM dd, yyyy")}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={statusColors[reservation.status] || statusColors.pending}>
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
                                      <DropdownMenuItem onClick={() => setCheckInOutDialog({ open: true, mode: "check-in", reservationId: reservation.id })}>
                                        <LogIn className="h-4 w-4 mr-2" />Check In
                                      </DropdownMenuItem>
                                    )}
                                    {reservation.status === "checked-in" && (
                                      <DropdownMenuItem onClick={() => setCheckInOutDialog({ open: true, mode: "check-out", reservationId: reservation.id })}>
                                        <LogOut className="h-4 w-4 mr-2" />Check Out
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem onClick={() => setDetailsDialog({ open: true, reservation })}>
                                      <Search className="h-4 w-4 mr-2" />View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => navigate(`/front-desk?reservationId=${reservation.id}`)}>
                                      <Receipt className="h-4 w-4 mr-2" />View Folio
                                    </DropdownMenuItem>
                                    {reservation.status === "pending" && (
                                      <DropdownMenuItem
                                        className="text-success"
                                        onClick={() => updateReservation.mutate({ id: reservation.id, status: "confirmed" })}
                                      >
                                        <CheckCircle className="h-4 w-4 mr-2" />Confirm Booking
                                      </DropdownMenuItem>
                                    )}
                                    {reservation.status === "pending" && (
                                      <DropdownMenuItem
                                        className="text-destructive"
                                        onClick={() => setRejectingReservationId(reservation.id)}
                                      >
                                        <XCircle className="h-4 w-4 mr-2" />Reject Booking
                                      </DropdownMenuItem>
                                    )}
                                    {(reservation.status === "confirmed" || reservation.status === "pending") && (
                                      <DropdownMenuItem
                                        className="text-destructive"
                                        onClick={() => updateReservation.mutate({ id: reservation.id, status: "cancelled" })}
                                      >
                                        <XCircle className="h-4 w-4 mr-2" />Cancel Booking
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
          </TabsContent>

          {/* Calendar View Tab */}
          <TabsContent value="calendar">
            <ReservationCalendar />
          </TabsContent>
        </Tabs>

        <NewReservationDialog open={newDialogOpen} onOpenChange={setNewDialogOpen} onSuccess={refetch} />
        <CheckInOutDialog
          open={checkInOutDialog.open}
          onOpenChange={(open) => setCheckInOutDialog({ ...checkInOutDialog, open })}
          mode={checkInOutDialog.mode}
          reservationId={checkInOutDialog.reservationId}
          onSuccess={refetch}
        />
        <CheckInOutDialog
          open={walkInDialogOpen}
          onOpenChange={setWalkInDialogOpen}
          mode="walk-in"
        />
        <ReservationDetailsDialog
          open={detailsDialog.open}
          onOpenChange={(open) => setDetailsDialog({ ...detailsDialog, open })}
          reservation={detailsDialog.reservation}
        />

        <Dialog open={!!rejectingReservationId} onOpenChange={(open) => !open && setRejectingReservationId(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Reject Booking</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting this reservation.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="reject-reason" className="text-sm font-medium">Reason</label>
                <Input
                  id="reject-reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g., No availability, Maintenance issue"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectingReservationId(null)}>Cancel</Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (rejectingReservationId) {
                    updateReservation.mutate({
                      id: rejectingReservationId,
                      status: "rejected",
                      rejection_reason: rejectionReason
                    }, {
                      onSuccess: () => {
                        setRejectingReservationId(null);
                        setRejectionReason("");
                      }
                    });
                  }
                }}
                disabled={!rejectionReason || updateReservation.isPending}
              >
                Reject Booking
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </ErrorBoundary>
    </MainLayout>
  );
};

export default Reservations;
