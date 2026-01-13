import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Clock,
  Calendar,
  BarChart3,
  PieChartIcon,
  Download,
  FileText,
  FileSpreadsheet,
} from "lucide-react";
import { usePOSTransactions, POSTransaction, POSOrderItem } from "@/hooks/usePOS";
import { format, subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, eachDayOfInterval, parseISO, isWithinInterval } from "date-fns";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";

const COLORS = ["hsl(var(--primary))", "hsl(var(--success))", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];

export default function POSReports() {
  const [period, setPeriod] = useState<"today" | "week" | "month" | "custom">("week");
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 7), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [activeTab, setActiveTab] = useState("overview");

  // Get date range based on period
  const dateRange = useMemo(() => {
    const now = new Date();
    switch (period) {
      case "today":
        return { start: format(startOfDay(now), "yyyy-MM-dd"), end: format(endOfDay(now), "yyyy-MM-dd") };
      case "week":
        return { start: format(subDays(now, 7), "yyyy-MM-dd"), end: format(now, "yyyy-MM-dd") };
      case "month":
        return { start: format(subDays(now, 30), "yyyy-MM-dd"), end: format(now, "yyyy-MM-dd") };
      case "custom":
        return { start: startDate, end: endDate };
    }
  }, [period, startDate, endDate]);

  const { data: transactions = [] } = usePOSTransactions({
    startDate: dateRange.start,
    endDate: dateRange.end,
  });

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalRevenue = transactions.reduce((sum, t) => sum + t.total, 0);
    const totalTransactions = transactions.length;
    const avgTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    const totalItems = transactions.reduce((sum, t) => sum + t.items_count, 0);
    
    // Compare with previous period
    const periodDays = Math.ceil((new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      totalRevenue,
      totalTransactions,
      avgTransaction,
      totalItems,
      avgItemsPerOrder: totalTransactions > 0 ? totalItems / totalTransactions : 0,
    };
  }, [transactions, dateRange]);

  // Revenue by day
  const revenueByDay = useMemo(() => {
    const days = eachDayOfInterval({
      start: parseISO(dateRange.start),
      end: parseISO(dateRange.end),
    });

    return days.map(day => {
      const dayTransactions = transactions.filter(t => 
        format(parseISO(t.created_at), "yyyy-MM-dd") === format(day, "yyyy-MM-dd")
      );
      return {
        date: format(day, "MMM d"),
        revenue: dayTransactions.reduce((sum, t) => sum + t.total, 0),
        orders: dayTransactions.length,
      };
    });
  }, [transactions, dateRange]);

  // Revenue by payment method
  const revenueByPayment = useMemo(() => {
    const byMethod: Record<string, number> = {};
    transactions.forEach(t => {
      const method = t.payment_method || "other";
      byMethod[method] = (byMethod[method] || 0) + t.total;
    });
    
    const labels: Record<string, string> = {
      cash: "Cash",
      card: "Card",
      digital: "Digital Wallet",
      room: "Room Charge",
      other: "Other",
    };

    return Object.entries(byMethod).map(([method, revenue]) => ({
      name: labels[method] || method,
      value: revenue,
    }));
  }, [transactions]);

  // Top selling items
  const topItems = useMemo(() => {
    const itemCounts: Record<string, { quantity: number; revenue: number }> = {};
    
    transactions.forEach(t => {
      t.items.forEach((item: POSOrderItem) => {
        const name = item.item_name;
        if (!itemCounts[name]) {
          itemCounts[name] = { quantity: 0, revenue: 0 };
        }
        itemCounts[name].quantity += item.quantity;
        itemCounts[name].revenue += item.item_price * item.quantity;
      });
    });

    return Object.entries(itemCounts)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
  }, [transactions]);

  // Revenue by category
  const revenueByCategory = useMemo(() => {
    const byCategory: Record<string, number> = {};
    
    transactions.forEach(t => {
      t.items.forEach((item: POSOrderItem) => {
        const category = item.category || "Uncategorized";
        byCategory[category] = (byCategory[category] || 0) + item.item_price * item.quantity;
      });
    });

    return Object.entries(byCategory).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  // Hourly distribution
  const hourlyDistribution = useMemo(() => {
    const byHour: Record<number, { orders: number; revenue: number }> = {};
    
    for (let i = 0; i < 24; i++) {
      byHour[i] = { orders: 0, revenue: 0 };
    }

    transactions.forEach(t => {
      const hour = new Date(t.created_at).getHours();
      byHour[hour].orders += 1;
      byHour[hour].revenue += t.total;
    });

    return Object.entries(byHour).map(([hour, data]) => ({
      hour: `${hour.padStart(2, "0")}:00`,
      ...data,
    }));
  }, [transactions]);

  // Export functions
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("POS Sales Report", 14, 22);
    doc.setFontSize(10);
    doc.text(`Period: ${dateRange.start} to ${dateRange.end}`, 14, 30);
    doc.text(`Generated: ${format(new Date(), "PPpp")}`, 14, 36);

    doc.setFontSize(14);
    doc.text("Summary", 14, 50);
    doc.setFontSize(10);
    doc.text(`Total Revenue: $${metrics.totalRevenue.toFixed(2)}`, 14, 58);
    doc.text(`Total Transactions: ${metrics.totalTransactions}`, 14, 64);
    doc.text(`Average Transaction: $${metrics.avgTransaction.toFixed(2)}`, 14, 70);
    doc.text(`Total Items Sold: ${metrics.totalItems}`, 14, 76);

    doc.setFontSize(14);
    doc.text("Top Selling Items", 14, 92);
    doc.setFontSize(10);
    let y = 100;
    topItems.slice(0, 10).forEach((item, i) => {
      doc.text(`${i + 1}. ${item.name}: ${item.quantity} sold ($${item.revenue.toFixed(2)})`, 14, y);
      y += 6;
    });

    doc.save(`pos-report-${dateRange.start}-to-${dateRange.end}.pdf`);
  };

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      ["POS Sales Report"],
      [`Period: ${dateRange.start} to ${dateRange.end}`],
      [""],
      ["Metric", "Value"],
      ["Total Revenue", `$${metrics.totalRevenue.toFixed(2)}`],
      ["Total Transactions", metrics.totalTransactions],
      ["Average Transaction", `$${metrics.avgTransaction.toFixed(2)}`],
      ["Total Items Sold", metrics.totalItems],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryData), "Summary");

    // Daily revenue sheet
    const dailyData = [["Date", "Revenue", "Orders"], ...revenueByDay.map(d => [d.date, d.revenue, d.orders])];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(dailyData), "Daily Revenue");

    // Top items sheet
    const itemsData = [["Item", "Quantity Sold", "Revenue"], ...topItems.map(i => [i.name, i.quantity, i.revenue])];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(itemsData), "Top Items");

    // Transactions sheet
    const txData = [
      ["Transaction #", "Date", "Table", "Customer", "Payment", "Items", "Total"],
      ...transactions.map(t => [
        t.transaction_number,
        format(parseISO(t.created_at), "yyyy-MM-dd HH:mm"),
        t.table_number,
        t.customer_name || t.company_name || "-",
        t.payment_method,
        t.items_count,
        t.total,
      ]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(txData), "Transactions");

    XLSX.writeFile(wb, `pos-report-${dateRange.start}-to-${dateRange.end}.xlsx`);
  };

  return (
    <MainLayout title="POS Reports" subtitle="Sales analytics and performance metrics">
      <div className="space-y-6">
        {/* Period Selector */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-2">
                <Label>Period</Label>
                <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">Last 30 Days</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {period === "custom" && (
                <>
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="flex gap-2 ml-auto">
                <Button variant="outline" onClick={exportToPDF}>
                  <FileText className="h-4 w-4 mr-2" />
                  PDF
                </Button>
                <Button variant="outline" onClick={exportToExcel}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Excel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">${metrics.totalRevenue.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-success/10">
                  <ShoppingCart className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold">{metrics.totalTransactions}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-amber-500/10">
                  <TrendingUp className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Order Value</p>
                  <p className="text-2xl font-bold">${metrics.avgTransaction.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-purple-500/10">
                  <Users className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Items Sold</p>
                  <p className="text-2xl font-bold">{metrics.totalItems}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Revenue Trends
            </TabsTrigger>
            <TabsTrigger value="items" className="gap-2">
              <PieChartIcon className="h-4 w-4" />
              Top Items
            </TabsTrigger>
            <TabsTrigger value="hourly" className="gap-2">
              <Clock className="h-4 w-4" />
              Hourly Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Revenue Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Daily Revenue</CardTitle>
                  <CardDescription>Revenue trends over the selected period</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueByDay}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                          formatter={(value: number) => [`$${value.toFixed(2)}`, "Revenue"]}
                        />
                        <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Methods Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue by Payment Method</CardTitle>
                  <CardDescription>Distribution of payment methods used</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={revenueByPayment}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {revenueByPayment.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                          formatter={(value: number) => [`$${value.toFixed(2)}`, "Revenue"]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="items" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Items Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Selling Items</CardTitle>
                  <CardDescription>Most ordered items by quantity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topItems} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis dataKey="name" type="category" width={100} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Bar dataKey="quantity" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Revenue by Category */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue by Category</CardTitle>
                  <CardDescription>Sales distribution across menu categories</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={revenueByCategory}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {revenueByCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                          formatter={(value: number) => [`$${value.toFixed(2)}`, "Revenue"]}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="hourly" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Hourly Sales Distribution</CardTitle>
                <CardDescription>Orders and revenue by hour of day</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={hourlyDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="orders"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={false}
                        name="Orders"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="revenue"
                        stroke="hsl(var(--success))"
                        strokeWidth={2}
                        dot={false}
                        name="Revenue ($)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
