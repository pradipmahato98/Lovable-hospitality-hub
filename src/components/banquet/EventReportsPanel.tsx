import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  TrendingDown,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
  Line,
  ComposedChart
} from "recharts";
import { exportToExcel, exportToPDF } from "@/lib/reportExport";
import { BanquetCashierReport } from "./BanquetCashierReport";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
  deposit_amount?: number | null;
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
      const month = e.event_date.slice(0, 7);
      const current = map.get(month) || { count: 0, revenue: 0, guests: 0 };
      map.set(month, {
        count: current.count + 1,
        revenue: current.revenue + (e.status === "completed" ? e.total_amount : 0),
        guests: current.guests + e.guest_count,
      });
    });
    return Array.from(map.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6); // Last 6 months for chart
  }, [events]);

  const CHART_COLORS = ['#0066ff', '#00cfde', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

  // Event type distribution
  const eventTypeDistribution = useMemo(() => {
    const map = new Map<string, number>();
    events.forEach((e) => {
      map.set(e.event_type, (map.get(e.event_type) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([type, count]) => ({ type, count, percentage: (count / events.length) * 100 }))
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
    const forecast = events
      .filter((e) => e.status === "confirmed" || e.status === "in_progress")
      .reduce((s, e) => s + e.total_amount, 0);

    return {
      totalEvents: events.length,
      completedEvents: completed.length,
      totalRevenue: completed.reduce((s, e) => s + e.total_amount, 0),
      totalGuests: events.reduce((s, e) => s + e.guest_count, 0),
      avgRevenuePerEvent: completed.length > 0 
        ? completed.reduce((s, e) => s + e.total_amount, 0) / completed.length 
        : 0,
      forecastRevenue: forecast,
    };
  }, [events]);

  // Event Profitability (with catering costs)
  const { data: cateringData = [] } = useQuery({
    queryKey: ["banquet-catering-costs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_catering")
        .select("event_id, total_cost");
      if (error) throw error;
      return data || [];
    },
  });

  const eventProfitability = useMemo(() => {
    const cateringMap = new Map(cateringData.map((c: any) => [c.event_id, c.total_cost || 0]));
    return events
      .filter((e) => e.status === "completed")
      .map((e) => {
        const cateringCost = cateringMap.get(e.id) || 0;
        const netProfit = e.total_amount - cateringCost;
        const margin = e.total_amount > 0 ? (netProfit / e.total_amount * 100).toFixed(1) : "0";
        return { event: e.event_name, client: e.client_name, revenue: e.total_amount, cateringCost, netProfit, margin };
      })
      .sort((a, b) => b.netProfit - a.netProfit);
  }, [events, cateringData]);

  // Venue Utilization
  const venueUtilization = useMemo(() => {
    const map = new Map<string, { count: number; totalHours: number; revenue: number }>();
    events.forEach((e) => {
      const current = map.get(e.venue) || { count: 0, totalHours: 0, revenue: 0 };
      const startParts = (e as any).start_time?.split(":") || ["0", "0"];
      const endParts = (e as any).end_time?.split(":") || ["0", "0"];
      const hours = Math.max(0, (Number(endParts[0]) || 0) - (Number(startParts[0]) || 0) + ((Number(endParts[1]) || 0) - (Number(startParts[1]) || 0)) / 60);
      map.set(e.venue, {
        count: current.count + 1,
        totalHours: current.totalHours + hours,
        revenue: current.revenue + (e.status === "completed" ? e.total_amount : 0),
      });
    });
    return Array.from(map.entries())
      .map(([venue, data]) => ({ venue, ...data, totalHours: Math.round(data.totalHours) }))
      .sort((a, b) => b.count - a.count);
  }, [events]);

  const handleExportPDF = () => {
    const headers = ["Event", "Type", "Client", "Date", "Venue", "Guests", "Amount", "Status"];
    const rows = events.map((e) => [
      e.event_name, e.event_type, e.client_name, e.event_date, e.venue, e.guest_count,
      formatCurrency(e.total_amount), e.status,
    ]);
    exportToPDF({ title: "Banquet Events Report", headers, rows });
  };

  const handleExportExcel = () => {
    const headers = ["Event Name", "Event Type", "Client Name", "Event Date", "Venue", "Guest Count", "Total Amount", "Status"];
    const rows = events.map((e) => [
      e.event_name, e.event_type, e.client_name, e.event_date, e.venue, e.guest_count, e.total_amount, e.status,
    ]);
    exportToExcel({ title: "Banquet Events Report", headers, rows });
  };

  return (
    <div className="space-y-6">
      {/* Export Actions */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-2">
          <Download className="h-4 w-4" /> Export PDF
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportExcel} className="gap-2">
          <Download className="h-4 w-4" /> Export Excel
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><Calendar className="h-5 w-5 text-primary" /></div>
              <div><p className="text-sm text-muted-foreground text-[10px] uppercase tracking-wider font-bold">Total Events</p><p className="text-2xl font-bold">{totals.totalEvents}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10"><DollarSign className="h-5 w-5 text-success" /></div>
              <div><p className="text-sm text-muted-foreground text-[10px] uppercase tracking-wider font-bold">Total Revenue</p><p className="text-2xl font-bold">{formatCurrency(totals.totalRevenue)}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10"><Users className="h-5 w-5 text-blue-500" /></div>
              <div><p className="text-sm text-muted-foreground text-[10px] uppercase tracking-wider font-bold">Total Guests</p><p className="text-2xl font-bold">{totals.totalGuests.toLocaleString()}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10"><TrendingUp className="h-5 w-5 text-amber-500" /></div>
              <div><p className="text-sm text-muted-foreground text-[10px] uppercase tracking-wider font-bold">Revenue Forecast</p><p className="text-2xl font-bold">{formatCurrency(totals.forecastRevenue)}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="hidden lg:block">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10"><TrendingUp className="h-5 w-5 text-purple-500" /></div>
              <div><p className="text-sm text-muted-foreground text-[10px] uppercase tracking-wider font-bold">Avg Rev/Event</p><p className="text-2xl font-bold">{formatCurrency(totals.avgRevenuePerEvent)}</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><PieChart className="h-5 w-5" /> Event Status Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 rounded-lg bg-amber-500/10 border border-amber-500/30"><p className="text-3xl font-bold text-amber-400">{statusSummary.inquiry}</p><p className="text-sm text-muted-foreground">Inquiries</p></div>
            <div className="text-center p-4 rounded-lg bg-success/10 border border-success/30"><p className="text-3xl font-bold text-success">{statusSummary.confirmed}</p><p className="text-sm text-muted-foreground">Confirmed</p></div>
            <div className="text-center p-4 rounded-lg bg-primary/10 border border-primary/30"><p className="text-3xl font-bold text-primary">{statusSummary.in_progress}</p><p className="text-sm text-muted-foreground">In Progress</p></div>
            <div className="text-center p-4 rounded-lg bg-muted border border-border"><p className="text-3xl font-bold text-muted-foreground">{statusSummary.completed}</p><p className="text-sm text-muted-foreground">Completed</p></div>
            <div className="text-center p-4 rounded-lg bg-destructive/10 border border-destructive/30"><p className="text-3xl font-bold text-destructive">{statusSummary.cancelled}</p><p className="text-sm text-muted-foreground">Cancelled</p></div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Revenue & Guest Trends
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {monthlyTrends.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No trend data available</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={monthlyTrends}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0066ff" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#0066ff" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val/1000}k`} />
                  <YAxis yAxisId="right" orientation="right" fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend />
                  <Area yAxisId="left" type="monotone" dataKey="revenue" name="Revenue" stroke="#0066ff" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2} />
                  <Line yAxisId="right" type="monotone" dataKey="guests" name="Guests" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Revenue by Event Type Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary" />
              Revenue Distribution by Type
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {revenueByType.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No data available</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={revenueByType}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="amount"
                    nameKey="type"
                  >
                    {revenueByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                </RePieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue by Event Type Bar */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Revenue by Event Type</CardTitle></CardHeader>
          <CardContent>
            {revenueByType.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No completed events yet</p>
            ) : (
              <div className="space-y-3">
                {revenueByType.map(({ type, amount }) => (
                  <div key={type} className="flex items-center justify-between">
                    <Badge variant="outline" className={eventTypeColors[type] || eventTypeColors.other}>{type}</Badge>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${(amount / revenueByType[0].amount) * 100}%` }} />
                      </div>
                      <span className="font-mono text-sm w-24 text-right">{formatCurrency(amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Event Type Distribution */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><PieChart className="h-5 w-5" /> Event Count by Type</CardTitle></CardHeader>
          <CardContent className="h-[250px]">
            {eventTypeDistribution.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No events yet</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={eventTypeDistribution} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                  <XAxis type="number" fontSize={10} hide />
                  <YAxis dataKey="type" type="category" fontSize={10} axisLine={false} tickLine={false} width={80} />
                  <Tooltip cursor={{fill: '#f8fafc'}} />
                  <Bar dataKey="count" fill="#0066ff" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Venues */}
      <Card>
        <CardHeader><CardTitle>Top Performing Venues</CardTitle></CardHeader>
        <CardContent className="p-0">
          {topVenues.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No venues yet</p>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Venue</TableHead><TableHead className="text-right">Events</TableHead><TableHead className="text-right">Revenue</TableHead></TableRow></TableHeader>
              <TableBody>
                {topVenues.map(({ venue, count, revenue }) => (
                  <TableRow key={venue}><TableCell className="font-medium">{venue}</TableCell><TableCell className="text-right">{count}</TableCell><TableCell className="text-right font-mono">{formatCurrency(revenue)}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Monthly Trends */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Monthly Trends</CardTitle></CardHeader>
        <CardContent className="p-0">
          {monthlyTrends.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No data yet</p>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Month</TableHead><TableHead className="text-right">Events</TableHead><TableHead className="text-right">Guests</TableHead><TableHead className="text-right">Revenue</TableHead></TableRow></TableHeader>
              <TableBody>
                {monthlyTrends.map(({ month, count, guests, revenue }) => (
                  <TableRow key={month}><TableCell className="font-medium">{month}</TableCell><TableCell className="text-right">{count}</TableCell><TableCell className="text-right">{guests.toLocaleString()}</TableCell><TableCell className="text-right font-mono">{formatCurrency(revenue)}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Event Profitability */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Event Profitability</CardTitle>
            <Button variant="outline" size="sm" onClick={() => exportToPDF({
              title: "Event Profitability Report",
              headers: ["Event", "Client", "Revenue", "Catering Cost", "Net Profit", "Margin %"],
              rows: eventProfitability.map(r => [r.event, r.client, formatCurrency(r.revenue), formatCurrency(r.cateringCost), formatCurrency(r.netProfit), `${r.margin}%`]),
            })}><Download className="h-4 w-4 mr-1" />PDF</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Client</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Catering</TableHead>
                <TableHead className="text-right">Net Profit</TableHead>
                <TableHead className="text-right">Margin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {eventProfitability.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">No completed events</TableCell></TableRow>
              ) : eventProfitability.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{r.event}</TableCell>
                  <TableCell>{r.client}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(r.revenue)}</TableCell>
                  <TableCell className="text-right font-mono text-destructive">{formatCurrency(r.cateringCost)}</TableCell>
                  <TableCell className="text-right font-mono font-bold text-success">{formatCurrency(r.netProfit)}</TableCell>
                  <TableCell className="text-right">{r.margin}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Venue Utilization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Venue Utilization</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Venue</TableHead>
                <TableHead className="text-right">Events</TableHead>
                <TableHead className="text-right">Total Hours</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {venueUtilization.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">No data</TableCell></TableRow>
              ) : venueUtilization.map((v) => (
                <TableRow key={v.venue}>
                  <TableCell className="font-medium">{v.venue}</TableCell>
                  <TableCell className="text-right">{v.count}</TableCell>
                  <TableCell className="text-right">{v.totalHours}h</TableCell>
                  <TableCell className="text-right font-mono font-bold">{formatCurrency(v.revenue)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Cashier Report */}
      <BanquetCashierReport events={events} />
    </div>
  );
}
