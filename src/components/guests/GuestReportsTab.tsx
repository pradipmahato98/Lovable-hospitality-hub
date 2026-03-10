import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGuests } from "@/hooks/useGuests";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { exportToPDF, exportToExcel } from "@/lib/reportExport";
import { formatCurrency } from "@/lib/utils";
import { Download, FileText, Users, Star, Globe, MessageSquare } from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--destructive))", "#8b5cf6", "#06b6d4"];

export const GuestReportsTab = () => {
  const { data: guests = [] } = useGuests();

  const { data: commStats = { total: 0 } } = useQuery({
    queryKey: ["guest-comm-stats"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("guest_communications")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return { total: count || 0 };
    },
  });

  const stats = useMemo(() => {
    const total = guests.length;
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const newThisMonth = guests.filter(g => new Date(g.created_at) >= thisMonth).length;
    const vipCount = guests.filter(g => g.is_vip).length;
    const totalSpending = guests.reduce((s, g) => s + (g.total_spending || 0), 0);
    const avgSpending = total > 0 ? totalSpending / total : 0;

    const byCountry: Record<string, number> = {};
    guests.forEach(g => {
      const country = (g as any).country || "Unknown";
      byCountry[country] = (byCountry[country] || 0) + 1;
    });

    const topSpenders = [...guests]
      .sort((a, b) => (b.total_spending || 0) - (a.total_spending || 0))
      .slice(0, 10);

    return { total, newThisMonth, vipCount, totalSpending, avgSpending, byCountry, topSpenders };
  }, [guests]);

  const countryData = Object.entries(stats.byCountry)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, value]) => ({ name, value }));

  const handleExportPDF = () => {
    exportToPDF({
      title: "Guest Analytics Report",
      headers: ["Metric", "Value"],
      rows: [
        ["Total Guests", stats.total],
        ["New This Month", stats.newThisMonth],
        ["VIP Guests", stats.vipCount],
        ["Total Spending", formatCurrency(stats.totalSpending)],
        ["Avg Spending/Guest", formatCurrency(stats.avgSpending)],
        ["Communications Sent", commStats.total],
        ...stats.topSpenders.map((g, i) => [
          `#${i + 1} ${g.first_name} ${g.last_name}`,
          formatCurrency(g.total_spending || 0),
        ]),
      ],
    });
  };

  const handleExportExcel = () => {
    exportToExcel({
      title: "Guest_Analytics",
      headers: ["Name", "Email", "Phone", "Visits", "Total Spent", "VIP", "Country"],
      rows: guests.map(g => [
        `${g.first_name} ${g.last_name}`,
        g.email || "",
        g.phone || "",
        g.total_visits || 0,
        g.total_spending || 0,
        g.is_vip ? "Yes" : "No",
        (g as any).country || "",
      ]),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Guest Analytics</h2>
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
        <MetricCard title="Total Guests" value={String(stats.total)} change={`${stats.newThisMonth} new this month`} changeType="positive" icon={Users} delay={0} />
        <MetricCard title="VIP Guests" value={String(stats.vipCount)} change={`${stats.total > 0 ? ((stats.vipCount / stats.total) * 100).toFixed(0) : 0}% of total`} changeType="neutral" icon={Star} delay={50} />
        <MetricCard title="Total Spending" value={formatCurrency(stats.totalSpending)} change={`Avg ${formatCurrency(stats.avgSpending)}`} changeType="positive" icon={Users} delay={100} />
        <MetricCard title="Communications" value={String(commStats.total)} change="All channels" changeType="neutral" icon={MessageSquare} delay={150} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" /> Guest Origin
            </CardTitle>
          </CardHeader>
          <CardContent>
            {countryData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={countryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {countryData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No country data available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-4 w-4 text-primary" /> Top Spenders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Guest</TableHead>
                  <TableHead className="text-right">Total Spent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.topSpenders.map((g, i) => (
                  <TableRow key={g.id}>
                    <TableCell className="font-mono text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="font-medium">{g.first_name} {g.last_name}</TableCell>
                    <TableCell className="text-right font-mono font-bold text-primary">{formatCurrency(g.total_spending || 0)}</TableCell>
                  </TableRow>
                ))}
                {stats.topSpenders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-6">No guest data</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
