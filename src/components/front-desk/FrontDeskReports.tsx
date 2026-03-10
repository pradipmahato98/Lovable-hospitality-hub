import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Download,
  Calendar,
  Users,
  CreditCard,
  AlertTriangle,
  BedDouble,
  UserX,
} from "lucide-react";
import { useReservations } from "@/hooks/useReservations";
import { useRooms } from "@/hooks/useRooms";
import { useInvoices } from "@/hooks/useBillingData";
import { formatCurrency } from "@/lib/utils";
import { format, isSameDay, parseISO } from "date-fns";
import { exportToExcel, exportToPDF } from "@/lib/reportExport";

export function FrontDeskReports() {
  const [reportDate, setReportDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const { reservations, isLoading: resLoading } = useReservations();
  const { data: rooms = [], isLoading: roomsLoading } = useRooms();
  const { data: invoices = [], isLoading: invLoading } = useInvoices();

  const selectedDate = parseISO(reportDate);

  // 1. Arrival / Departure List
  const arrivals = useMemo(() => {
    return reservations.filter((r) => r.check_in_date === reportDate);
  }, [reservations, reportDate]);

  const departures = useMemo(() => {
    return reservations.filter((r) => r.check_out_date === reportDate);
  }, [reservations, reportDate]);

  // 2. Occupancy & Availability
  const occupancyStats = useMemo(() => {
    const totalRooms = rooms.length;
    const occupiedRooms = rooms.filter((r) => r.status === "occupied").length;
    const oooRooms = rooms.filter((r) => r.status === "maintenance").length;
    const stayOvers = reservations.filter((r) => {
      const checkIn = parseISO(r.check_in_date);
      const checkOut = parseISO(r.check_out_date);
      return selectedDate > checkIn && selectedDate < checkOut && r.status === "confirmed";
    }).length;

    const occupancyRate = totalRooms > 0 ? ((occupiedRooms / (totalRooms - oooRooms)) * 100).toFixed(1) : "0";

    return {
      totalRooms,
      occupiedRooms,
      oooRooms,
      stayOvers,
      occupancyRate,
      availableRooms: totalRooms - occupiedRooms - oooRooms,
    };
  }, [rooms, reservations, selectedDate]);

  // 3. High Balance / Credit Limit Report
  // Assuming a fixed credit limit of $1000 if not specified, or using invoice balance
  const highBalanceGuests = useMemo(() => {
    return invoices
      .filter((inv) => inv.balance_due > 1000 && inv.status !== "paid")
      .map((inv) => ({
        guestName: inv.guest ? `${inv.guest.first_name} ${inv.guest.last_name}` : "Unknown",
        roomNumber: inv.reservation?.room?.room_number || "N/A",
        balance: inv.balance_due,
        limit: 1000, // Mock limit
      }));
  }, [invoices]);

  // 4. No-Show & Cancellation Report
  const noShows = useMemo(() => {
    return reservations.filter((r) =>
      (r.status === "no-show" || r.status === "cancelled") &&
      r.check_in_date === reportDate
    );
  }, [reservations, reportDate]);

  const handleExport = (title: string, data: any[], headers: string[]) => {
    exportToExcel({ title, headers, rows: data });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Card variant="glass">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label>Report Date</Label>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="w-40"
                />
              </div>
            </div>
            <Button variant="outline" onClick={() => setReportDate(format(new Date(), "yyyy-MM-dd"))}>
              Today
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Occupancy Rate</CardDescription>
            <CardTitle className="text-2xl">{occupancyStats.occupancyRate}%</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              {occupancyStats.occupiedRooms} of {occupancyStats.totalRooms - occupancyStats.oooRooms} rooms sold
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Arrivals</CardDescription>
            <CardTitle className="text-2xl">{arrivals.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">Scheduled for today</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Departures</CardDescription>
            <CardTitle className="text-2xl">{departures.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">Scheduled for today</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>High Balance</CardDescription>
            <CardTitle className="text-2xl text-destructive">{highBalanceGuests.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">Guests exceeding limit</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Arrivals/Departures */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Arrivals & Departures</CardTitle>
              <CardDescription>Guest movement for {reportDate}</CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={() => handleExport("Arrivals_Departures", [...arrivals, ...departures], ["Name", "Room", "Type", "Status"])}>
              <Download className="h-4 w-4 mr-2" /> Export
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Badge variant="outline" className="bg-success/10 text-success border-success/20">Arrivals ({arrivals.length})</Badge>
                </h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Guest</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {arrivals.length === 0 ? (
                      <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No arrivals</TableCell></TableRow>
                    ) : arrivals.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.guest?.first_name} {r.guest?.last_name}</TableCell>
                        <TableCell>{r.room?.room_number || "TBD"}</TableCell>
                        <TableCell><Badge variant="secondary">{r.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Departures ({departures.length})</Badge>
                </h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Guest</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {departures.length === 0 ? (
                      <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No departures</TableCell></TableRow>
                    ) : departures.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.guest?.first_name} {r.guest?.last_name}</TableCell>
                        <TableCell>{r.room?.room_number}</TableCell>
                        <TableCell><Badge variant="secondary">{r.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Occupancy & High Balance */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Occupancy Detail</CardTitle>
                <CardDescription>Inventory status summary</CardDescription>
              </div>
              <BedDouble className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Rooms</span>
                  <span className="font-semibold">{occupancyStats.totalRooms}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Out of Order</span>
                  <span className="text-destructive font-semibold">{occupancyStats.oooRooms}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Stay-overs</span>
                  <span className="font-semibold">{occupancyStats.stayOvers}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t">
                  <span>Available to Sell</span>
                  <span className="text-success font-bold">{occupancyStats.availableRooms}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" /> High Balance Alert
                </CardTitle>
                <CardDescription>Guests exceeding $1,000 credit limit</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Guest (Room)</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {highBalanceGuests.length === 0 ? (
                    <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">All guests within limits</TableCell></TableRow>
                  ) : highBalanceGuests.map((g, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{g.guestName} ({g.roomNumber})</TableCell>
                      <TableCell className="text-right text-destructive font-mono">{formatCurrency(g.balance)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* No-Shows & Cancellations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <UserX className="h-5 w-5" /> No-Shows & Cancellations
            </CardTitle>
            <CardDescription>Lost business tracking for {reportDate}</CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={() => handleExport("No_Shows", noShows, ["Guest", "Room", "Status", "Amount"])}>
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Guest</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Penalty/Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {noShows.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No cancellations or no-shows for this date.</TableCell></TableRow>
              ) : noShows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.guest?.first_name} {r.guest?.last_name}</TableCell>
                  <TableCell>{r.room?.room_number}</TableCell>
                  <TableCell>{r.room?.room_type}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={r.status === 'no-show' ? 'bg-destructive/10 text-destructive border-destructive/20' : ''}>
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(r.total_amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
