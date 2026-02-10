import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, Plus, MoreVertical, LogIn, LogOut, CalendarDays, List, UserPlus } from "lucide-react";
import { NewReservationDialog } from "@/components/reservations/NewReservationDialog";
import { CheckInOutDialog } from "@/components/reservations/CheckInOutDialog";
import { ReservationCalendar } from "@/components/reservations/ReservationCalendar";
import { ReservationsTable } from "@/components/reservations/ReservationsTable";
import { useReservations } from "@/hooks/useReservations";
import { useRealtimeReservations } from "@/hooks/useRealtimeReservations";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const Reservations = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("list");
  const [walkInDialogOpen, setWalkInDialogOpen] = useState(false);
  const [checkInOutDialog, setCheckInOutDialog] = useState<{
    open: boolean;
    mode: "check-in" | "check-out";
    reservationId: string;
  }>({ open: false, mode: "check-in", reservationId: "" });

  const { isLoading, refetch, filterReservations } = useReservations();
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
                </div>
              </CardHeader>
              <CardContent className="p-0 sm:p-6">
                <ReservationsTable
                  reservations={filteredReservations}
                  isLoading={isLoading}
                  onCheckIn={(id) => setCheckInOutDialog({ open: true, mode: "check-in", reservationId: id })}
                  onCheckOut={(id) => setCheckInOutDialog({ open: true, mode: "check-out", reservationId: id })}
                />
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
      </ErrorBoundary>
    </MainLayout>
  );
};

export default Reservations;
