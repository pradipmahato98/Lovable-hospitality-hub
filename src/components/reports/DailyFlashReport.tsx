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
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  BedDouble,
  BarChart3,
  Calendar,
  Download,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useReportStats } from "@/hooks/useReportStats";
import { useNightAudit } from "@/hooks/useNightAudit";
import { exportToExcel } from "@/lib/reportExport";

export function DailyFlashReport() {
  const { data: stats, isLoading } = useReportStats();
  const { businessDate } = useNightAudit();

  const metrics = useMemo(() => {
    if (!stats) return [];
    return [
      { category: "Rooms", metric: "Occupancy %", yesterday: `${stats.occupancyRate}%`, mtd: "82%" },
      { category: "Rooms", metric: "ADR (Avg Daily Rate)", yesterday: formatCurrency(stats.adr), mtd: "$178.00" },
      { category: "Revenue", metric: "Room Revenue", yesterday: formatCurrency(stats.totalReservationRevenue), mtd: "$450,000" },
      { category: "Revenue", metric: "F&B Revenue", yesterday: formatCurrency(stats.totalPOSRevenue), mtd: "$120,000" },
      { category: "Revenue", metric: "Banquet Revenue", yesterday: "$8,500", mtd: "$210,000" },
    ];
  }, [stats]);

  const totalRevenue = useMemo(() => {
    if (!stats) return 0;
    return stats.totalReservationRevenue + stats.totalPOSRevenue + 8500; // Mock banquet rev
  }, [stats]);

  const handleExport = () => {
    const headers = ["Category", "Metric", "Yesterday", "Month-to-Date (MTD)"];
    const rows = metrics.map((m) => [m.category, m.metric, m.yesterday, m.mtd]);
    exportToExcel({ title: "Daily Flash Report", headers, rows });
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Generating daily flash report...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Status */}
      <Card className="bg-gradient-to-r from-slate-900 to-slate-800 text-white border-none shadow-xl">
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/20 rounded-full">
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-sm opacity-70 uppercase tracking-wider">The Daily Flash Report</p>
                <h2 className="text-3xl font-bold font-display">Business Snapshot</h2>
              </div>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="text-white border-white/20 mb-2">Business Date: {businessDate || "N/A"}</Badge>
              <p className="text-xs opacity-50">Compiled after Night Audit</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <Card variant="elevated">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Key Metrics Summary</CardTitle>
                <CardDescription>Financial and operational performance</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" /> Export
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Metric</TableHead>
                    <TableHead className="text-right">Yesterday</TableHead>
                    <TableHead className="text-right">MTD</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.map((m, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-semibold">{m.category}</TableCell>
                      <TableCell>{m.metric}</TableCell>
                      <TableCell className="text-right font-mono">{m.yesterday}</TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">{m.mtd}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-primary/5 hover:bg-primary/5">
                    <TableCell colSpan={2} className="font-bold text-primary">Grand Total Revenue</TableCell>
                    <TableCell className="text-right font-bold text-primary text-lg">{formatCurrency(totalRevenue)}</TableCell>
                    <TableCell className="text-right font-bold text-primary text-lg font-mono">$780,000</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="xl:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase flex items-center gap-2">
                <Users className="h-4 w-4" /> Guest Highlights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-secondary/20 rounded-lg border">
                <p className="text-xs text-muted-foreground uppercase">VIPs In-House</p>
                <p className="text-xl font-bold">12</p>
              </div>
              <div className="p-3 bg-secondary/20 rounded-lg border">
                <p className="text-xs text-muted-foreground uppercase">Guest Complaints Resolved</p>
                <p className="text-xl font-bold">5</p>
              </div>
              <div className="p-3 bg-secondary/20 rounded-lg border">
                <p className="text-xs text-muted-foreground uppercase">Walk-ins</p>
                <p className="text-xl font-bold">3</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Manager’s Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2 list-disc list-inside text-muted-foreground">
                <li>Major elevator repair completed in North Wing.</li>
                <li>Guest complaint resolved in Room 404 (Noisy AC).</li>
                <li>Staff appreciation dinner held in the Ballroom.</li>
                <li>Preparation for 200pax Wedding tomorrow.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
