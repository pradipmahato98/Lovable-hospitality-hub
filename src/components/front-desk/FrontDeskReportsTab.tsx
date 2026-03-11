import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRooms } from "@/hooks/useRooms";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { exportToPDF, exportToExcel } from "@/lib/reportExport";
import { formatCurrency } from "@/lib/utils";
import { Download, FileText, Bed, Users, Receipt, Clock } from "lucide-react";
import { FrontDeskCashierReport } from "./FrontDeskCashierReport";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const COLORS = ["hsl(var(--success))", "hsl(var(--primary))", "hsl(var(--warning))", "hsl(var(--destructive))"];

export const FrontDeskReportsTab = () => {
  const { data: rooms = [] } = useRooms();

  const today = new Date().toISOString().split("T")[0];

  const { data: todayReservations = [] } = useQuery({
    queryKey: ["frontdesk-report-reservations", today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select("id, status, check_in_date, check_out_date, total_amount")
        .or(`check_in_date.eq.${today},check_out_date.eq.${today}`);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: folios = [] } = useQuery({
    queryKey: ["frontdesk-report-folios"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_folios")
        .select("id, status, total_charges, total_payments, balance")
        .eq("status", "open");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: queueEntries = [] } = useQuery({
    queryKey: ["frontdesk-report-queue"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("front_desk_queue")
        .select("id, status, priority, created_at");
      if (error) throw error;
      return data || [];
    },
  });

  const stats = useMemo(() => {
    const roomStatus = rooms.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const checkIns = todayReservations.filter((r: any) => r.check_in_date === today).length;
    const checkOuts = todayReservations.filter((r: any) => r.check_out_date === today).length;
    const openFolios = folios.length;
    const totalCharges = folios.reduce((s: number, f: any) => s + (f.total_charges || 0), 0);
    const totalPayments = folios.reduce((s: number, f: any) => s + (f.total_payments || 0), 0);
    const waitingInQueue = queueEntries.filter((q: any) => q.status === "waiting").length;

    return { roomStatus, checkIns, checkOuts, openFolios, totalCharges, totalPayments, waitingInQueue };
  }, [rooms, todayReservations, folios, queueEntries, today]);

  const pieData = Object.entries(stats.roomStatus).map(([name, value]) => ({ name, value }));

  const handleExportPDF = () => {
    exportToPDF({
      title: "Front Desk Daily Report",
      headers: ["Metric", "Value"],
      rows: [
        ["Total Rooms", rooms.length],
        ["Available", stats.roomStatus["available"] || 0],
        ["Occupied", stats.roomStatus["occupied"] || 0],
        ["Cleaning", stats.roomStatus["cleaning"] || 0],
        ["Maintenance", stats.roomStatus["maintenance"] || 0],
        ["Check-ins Today", stats.checkIns],
        ["Check-outs Today", stats.checkOuts],
        ["Open Folios", stats.openFolios],
        ["Total Charges", formatCurrency(stats.totalCharges)],
        ["Total Payments", formatCurrency(stats.totalPayments)],
        ["Queue Waiting", stats.waitingInQueue],
      ],
    });
  };

  const handleExportExcel = () => {
    exportToExcel({
      title: "Front_Desk_Report",
      headers: ["Metric", "Value"],
      rows: [
        ["Total Rooms", rooms.length],
        ["Available", stats.roomStatus["available"] || 0],
        ["Occupied", stats.roomStatus["occupied"] || 0],
        ["Check-ins Today", stats.checkIns],
        ["Check-outs Today", stats.checkOuts],
        ["Open Folios", stats.openFolios],
        ["Total Charges", stats.totalCharges],
        ["Total Payments", stats.totalPayments],
        ["Queue Waiting", stats.waitingInQueue],
      ],
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Front Desk Reports</h2>
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
        <MetricCard title="Check-ins Today" value={String(stats.checkIns)} change="Today" changeType="neutral" icon={Users} delay={0} />
        <MetricCard title="Check-outs Today" value={String(stats.checkOuts)} change="Today" changeType="neutral" icon={Users} delay={50} />
        <MetricCard title="Open Folios" value={String(stats.openFolios)} change={formatCurrency(stats.totalCharges)} changeType="neutral" icon={Receipt} delay={100} />
        <MetricCard title="Queue Waiting" value={String(stats.waitingInQueue)} change={`${queueEntries.length} total`} changeType="neutral" icon={Clock} delay={150} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bed className="h-4 w-4 text-primary" /> Room Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {pieData.map((_, i) => (
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Folio Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Metric</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Total Charges (Open)</TableCell>
                  <TableCell className="text-right font-mono font-bold">{formatCurrency(stats.totalCharges)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Total Payments (Open)</TableCell>
                  <TableCell className="text-right font-mono font-bold text-success">{formatCurrency(stats.totalPayments)}</TableCell>
                </TableRow>
                <TableRow className="bg-secondary/30">
                  <TableCell className="font-semibold">Outstanding Balance</TableCell>
                  <TableCell className="text-right font-mono font-bold text-destructive">
                    {formatCurrency(stats.totalCharges - stats.totalPayments)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Cashier Report */}
      <FrontDeskCashierReport />
    </div>
  );
};
