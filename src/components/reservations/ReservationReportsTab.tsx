import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useReservations } from "@/hooks/useReservations";
import { exportToPDF, exportToExcel } from "@/lib/reportExport";
import { formatCurrency } from "@/lib/utils";
import { Download, FileText, CalendarDays, TrendingUp, XCircle, CreditCard } from "lucide-react";
import { ReservationCashierReport } from "./ReservationCashierReport";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { differenceInDays, parseISO, format } from "date-fns";

const COLORS = ["hsl(var(--primary))", "hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--destructive))", "hsl(var(--muted-foreground))"];

export const ReservationReportsTab = () => {
  const { reservations = [] } = useReservations();

  const stats = useMemo(() => {
    const total = reservations.length;
    const byStatus: Record<string, number> = {};
    const bySource: Record<string, number> = {};
    const byPayment: Record<string, number> = {};
    const byMonth: Record<string, number> = {};
    let totalStayDays = 0;
    let totalRevenue = 0;
    let cancelled = 0;

    reservations.forEach((r: any) => {
      byStatus[r.status] = (byStatus[r.status] || 0) + 1;
      bySource[r.source || "direct"] = (bySource[r.source || "direct"] || 0) + 1;
      byPayment[r.payment_status || "pending"] = (byPayment[r.payment_status || "pending"] || 0) + 1;

      const month = format(parseISO(r.check_in_date), "MMM yyyy");
      byMonth[month] = (byMonth[month] || 0) + 1;

      totalStayDays += differenceInDays(parseISO(r.check_out_date), parseISO(r.check_in_date));
      totalRevenue += r.total_amount || 0;
      if (r.status === "cancelled") cancelled++;
    });

    const avgStay = total > 0 ? (totalStayDays / total).toFixed(1) : "0";
    const cancelRate = total > 0 ? ((cancelled / total) * 100).toFixed(1) : "0";

    return { total, byStatus, bySource, byPayment, byMonth, avgStay, cancelRate, totalRevenue };
  }, [reservations]);

  const monthData = Object.entries(stats.byMonth).map(([month, count]) => ({ month, bookings: count }));
  const sourceData = Object.entries(stats.bySource).map(([name, value]) => ({ name, value }));

  const handleExportPDF = () => {
    exportToPDF({
      title: "Reservations Analytics Report",
      headers: ["Metric", "Value"],
      rows: [
        ["Total Reservations", stats.total],
        ["Total Revenue", formatCurrency(stats.totalRevenue)],
        ["Average Stay", `${stats.avgStay} nights`],
        ["Cancellation Rate", `${stats.cancelRate}%`],
        ...Object.entries(stats.byStatus).map(([k, v]) => [`Status: ${k}`, v]),
        ...Object.entries(stats.bySource).map(([k, v]) => [`Source: ${k}`, v]),
      ],
    });
  };

  const handleExportExcel = () => {
    exportToExcel({
      title: "Reservations_Analytics",
      headers: ["Metric", "Value"],
      rows: [
        ["Total Reservations", stats.total],
        ["Total Revenue", stats.totalRevenue],
        ["Average Stay (nights)", stats.avgStay],
        ["Cancellation Rate (%)", stats.cancelRate],
        ...Object.entries(stats.byStatus).map(([k, v]) => [`Status: ${k}`, v]),
        ...Object.entries(stats.bySource).map(([k, v]) => [`Source: ${k}`, v]),
        ...Object.entries(stats.byPayment).map(([k, v]) => [`Payment: ${k}`, v]),
      ],
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Reservation Analytics</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={handleExportPDF}>
            <FileText className="h-4 w-4" /> PDF
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={handleExportExcel}>
            <Download className="h-4 w-4" /> Excel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Bookings" value={String(stats.total)} change="All time" changeType="neutral" icon={CalendarDays} delay={0} />
        <MetricCard title="Total Revenue" value={formatCurrency(stats.totalRevenue)} change="All bookings" changeType="positive" icon={TrendingUp} delay={50} />
        <MetricCard title="Avg Stay" value={`${stats.avgStay} nights`} change="Per booking" changeType="neutral" icon={CalendarDays} delay={100} />
        <MetricCard title="Cancel Rate" value={`${stats.cancelRate}%`} change={`${stats.byStatus["cancelled"] || 0} cancelled`} changeType="negative" icon={XCircle} delay={150} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bookings by Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs fill-muted-foreground" />
                  <YAxis className="text-xs fill-muted-foreground" />
                  <Tooltip />
                  <Bar dataKey="bookings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Booking Source Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sourceData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {sourceData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary" /> Payment Status Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.entries(stats.byPayment).map(([status, count]) => (
              <div key={status} className="p-4 rounded-xl bg-secondary/30 text-center">
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-xs text-muted-foreground capitalize">{status}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
