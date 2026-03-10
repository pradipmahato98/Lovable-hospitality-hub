import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Download,
  Calendar,
  Users,
  DollarSign,
  FileText,
  Layout,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import { exportToExcel, exportToPDF } from "@/lib/reportExport";
import { formatCurrency } from "@/lib/utils";

interface BanquetEvent {
  id: string;
  event_name: string;
  event_type: string;
  client_name: string;
  event_date: string;
  venue: string;
  guest_count: number;
  status: "inquiry" | "confirmed" | "in_progress" | "completed" | "cancelled";
  total_amount: number;
  menu_package?: string | null;
  special_requests?: string | null;
}

interface EventReportsPanelProps {
  events: BanquetEvent[];
}

const eventTypeColors: Record<string, string> = {
  wedding: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  corporate: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  birthday: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  conference: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  social: "bg-green-500/20 text-green-400 border-green-500/30",
  other: "bg-muted text-muted-foreground border-muted",
};

export function EventReportsPanel({ events }: EventReportsPanelProps) {
  // Revenue by event type
  const revenueByType = useMemo(() => {
    const map = new Map<string, number>();
    events
      .filter((e) => e.status === "completed")
      .forEach((e) => {
        map.set(e.event_type, (map.get(e.event_type) || 0) + e.total_amount);
      });
    return Array.from(map.entries())
      .map(([type, amount]) => ({ type, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [events]);

  // Monthly trends
  const monthlyTrends = useMemo(() => {
    const map = new Map<string, { count: number; revenue: number; guests: number }>();
    events.forEach((e) => {
      const month = e.event_date.slice(0, 7); // YYYY-MM
      const current = map.get(month) || { count: 0, revenue: 0, guests: 0 };
      map.set(month, {
        count: current.count + 1,
        revenue: current.revenue + (e.status === "completed" ? e.total_amount : 0),
        guests: current.guests + e.guest_count,
      });
    });
    return Array.from(map.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => b.month.localeCompare(a.month))
      .slice(0, 12);
  }, [events]);

  // Event type distribution
  const eventTypeDistribution = useMemo(() => {
    const map = new Map<string, number>();
    events.forEach((e) => {
      map.set(e.event_type, (map.get(e.event_type) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([type, count]) => ({ type, count, percentage: events.length > 0 ? (count / events.length) * 100 : 0 }))
      .sort((a, b) => b.count - a.count);
  }, [events]);

  // Top venues
  const topVenues = useMemo(() => {
    const map = new Map<string, { count: number; revenue: number }>();
    events.forEach((e) => {
      const current = map.get(e.venue) || { count: 0, revenue: 0 };
      map.set(e.venue, {
        count: current.count + 1,
        revenue: current.revenue + (e.status === "completed" ? e.total_amount : 0),
      });
    });
    return Array.from(map.entries())
      .map(([venue, data]) => ({ venue, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [events]);

  // Status summary
  const statusSummary = useMemo(() => {
    const counts = { inquiry: 0, confirmed: 0, in_progress: 0, completed: 0, cancelled: 0 };
    events.forEach((e) => {
      counts[e.status]++;
    });
    return counts;
  }, [events]);

  // Totals
  const totals = useMemo(() => {
    const completed = events.filter((e) => e.status === "completed");
    return {
      totalEvents: events.length,
      completedEvents: completed.length,
      totalRevenue: completed.reduce((s, e) => s + e.total_amount, 0),
      totalGuests: events.reduce((s, e) => s + e.guest_count, 0),
      avgRevenuePerEvent: completed.length > 0 
        ? completed.reduce((s, e) => s + e.total_amount, 0) / completed.length 
        : 0,
    };
  }, [events]);

  const handleExportPDF = () => {
    const headers = ["Event", "Type", "Client", "Date", "Venue", "Guests", "Amount", "Status"];
    const rows = events.map((e) => [
      e.event_name,
      e.event_type,
      e.client_name,
      e.event_date,
      e.venue,
      e.guest_count,
      `$${e.total_amount.toLocaleString()}`,
      e.status,
    ]);
    exportToPDF({ title: "Banquet Events Report", headers, rows });
  };

  const handleExportExcel = () => {
    const headers = ["Event Name", "Event Type", "Client Name", "Event Date", "Venue", "Guest Count", "Total Amount", "Status"];
    const rows = events.map((e) => [
      e.event_name,
      e.event_type,
      e.client_name,
      e.event_date,
      e.venue,
      e.guest_count,
      e.total_amount,
      e.status,
    ]);
    exportToExcel({ title: "Banquet Events Report", headers, rows });
  };

  const handlePrintBEO = (event: BanquetEvent) => {
    // In a real app, this would generate a PDF or open a printable window
    const headers = ["Field", "Detail"];
    const rows = [
      ["Event Name", event.event_name],
      ["Client", event.client_name],
      ["Date", event.event_date],
      ["Venue", event.venue],
      ["Guest Count", event.guest_count],
      ["Menu Package", event.menu_package || "N/A"],
      ["Special Requests", event.special_requests || "None"],
    ];
    exportToPDF({ title: `BEO - ${event.event_name}`, headers, rows });
  };

  return (
    <div className="space-y-6">
      {/* Export Actions */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-2">
          <Download className="h-4 w-4" />
          Export PDF
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportExcel} className="gap-2">
          <Download className="h-4 w-4" />
          Export Excel
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Events</p>
                <p className="text-2xl font-bold">{totals.totalEvents}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <DollarSign className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(totals.totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Guests</p>
                <p className="text-2xl font-bold">{totals.totalGuests.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <TrendingUp className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Revenue/Event</p>
                <p className="text-2xl font-bold">{formatCurrency(totals.avgRevenuePerEvent)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Function Diary / Space Utilization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layout className="h-5 w-5" />
              Function Diary (Space Utilization)
            </CardTitle>
            <CardDescription>Event distribution by venue</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Venue</TableHead>
                  <TableHead>Events</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topVenues.map((v) => (
                  <TableRow key={v.venue}>
                    <TableCell className="font-medium">{v.venue}</TableCell>
                    <TableCell>{v.count}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-full h-2 bg-secondary rounded-full">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${(v.count / events.length) * 100}%` }} />
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Guarantee vs Actual Report */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Guarantee vs Actual
            </CardTitle>
            <CardDescription>Billed guests vs scheduled guests</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Guaranteed</TableHead>
                  <TableHead>Actual</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.filter(e => e.status === 'completed' || e.status === 'in_progress').slice(0, 5).map(e => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium truncate max-w-[150px]">{e.event_name}</TableCell>
                    <TableCell>{e.guest_count}</TableCell>
                    <TableCell>{e.guest_count} <span className="text-xs text-muted-foreground">(Same)</span></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* BEO Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Banquet Event Orders (BEO)
          </CardTitle>
          <CardDescription>Generate and view contracts for individual events</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Venue</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.slice(0, 10).map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.event_name}</TableCell>
                  <TableCell>{e.event_date}</TableCell>
                  <TableCell><div className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {e.venue}</div></TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => handlePrintBEO(e)}>
                      <FileText className="h-4 w-4 mr-2" /> View BEO
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
