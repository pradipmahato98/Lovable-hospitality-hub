import { useState, useMemo } from "react";
import { formatCurrency } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";
import { POSHeader } from "@/components/pos";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  AlertTriangle,
  Percent,
} from "lucide-react";
import { usePOSTransactions, POSTransaction, POSOrderItem, usePOSOrders } from "@/hooks/usePOS";
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval, parseISO, formatDistanceToNow } from "date-fns";
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

  const { data: realTransactions } = usePOSTransactions({
    startDate: dateRange.start,
    endDate: dateRange.end,
  });

  const { data: openOrders = [] } = usePOSOrders();

  const mockTransactions: POSTransaction[] = useMemo(() => [
    {
      id: "m1",
      transaction_number: "TXN-20240320-001",
      table_number: "5",
      customer_name: "John Doe",
      subtotal: 100.00,
      tax_amount: 10.00,
      total: 110.00,
      payment_method: "card",
      items_count: 3,
      created_at: subDays(new Date(), 1).toISOString(),
      items: [
        { id: "i1", item_name: "Dinner Platter", item_price: 35.00, quantity: 2, category: "Food", status: "served", notes: null },
        { id: "i2", item_name: "Wine Glass", item_price: 15.00, quantity: 2, category: "Bar", status: "void", notes: "Mistake" },
      ],
      customer_address: null, company_id: null, company_name: null, vat_number: null, pan_number: null, tip_amount: 5, rrn_number: null, transaction_ref: null, card_last_four: "4242", card_type: "Visa", room_number: null, discount_amount: 10
    },
    {
      id: "m2",
      transaction_number: "TXN-20240320-002",
      table_number: "12",
      customer_name: "Jane Smith",
      subtotal: 45.00,
      tax_amount: 4.50,
      total: 49.50,
      payment_method: "cash",
      items_count: 2,
      created_at: subDays(new Date(), 2).toISOString(),
      items: [
        { id: "i3", item_name: "Lunch Special", item_price: 22.00, quantity: 2, category: "Food", status: "served", notes: "No onions" },
      ],
      customer_address: null, company_id: null, company_name: null, vat_number: null, pan_number: null, tip_amount: 0, rrn_number: null, transaction_ref: null, card_last_four: null, card_type: null, room_number: null, discount_amount: 0
    }
  ], []);

  const transactions = useMemo(() => {
    if (realTransactions && realTransactions.length > 0) return realTransactions;
    return mockTransactions;
  }, [realTransactions, mockTransactions]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalRevenue = transactions.reduce((sum, t) => sum + t.total, 0);
    const totalTransactions = transactions.length;
    const avgTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    const totalItems = transactions.reduce((sum, t) => sum + t.items_count, 0);
    
    return {
      totalRevenue,
      totalTransactions,
      avgTransaction,
      totalItems,
      avgItemsPerOrder: totalTransactions > 0 ? totalItems / totalTransactions : 0,
    };
  }, [transactions]);

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
        date: format(day, "dd/MM"),
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

  // Voids, Discounts, & Corrections
  const voidMetrics = useMemo(() => {
    return transactions.reduce((acc, t) => {
      if (t.discount_amount && t.discount_amount > 0) {
        acc.totalDiscounts += t.discount_amount;
        acc.discountCount += 1;
      }
      t.items.forEach((item: any) => {
        if (item.status === "void" || item.status === "cancelled") {
          acc.totalVoids += item.item_price * item.quantity;
          acc.voidCount += 1;
          acc.voidedItems.push({
            txn: t.transaction_number,
            item: item.item_name,
            amount: item.item_price * item.quantity,
            reason: item.notes || "No reason given",
          });
        }
      });
      return acc;
    }, { totalVoids: 0, voidCount: 0, totalDiscounts: 0, discountCount: 0, voidedItems: [] as any[] });
  }, [transactions]);

  // Export functions
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("POS Sales Report", 14, 22);
    doc.setFontSize(10);
    doc.text(`Period: ${dateRange.start} to ${dateRange.end}`, 14, 30);
    doc.save(`pos-report-${dateRange.start}.pdf`);
  };

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      ["POS Sales Report"],
      [`Period: ${dateRange.start} to ${dateRange.end}`],
      [""],
      ["Metric", "Value"],
      ["Total Revenue", formatCurrency(metrics.totalRevenue)],
      ["Total Transactions", metrics.totalTransactions],
      ["Average Transaction", formatCurrency(metrics.avgTransaction)],
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
    <MainLayout title="POS Sales Reports" subtitle="Analyze sales performance and item popularity">
      <POSHeader />
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
                    <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </div>
                </>
              )}

              <div className="flex gap-2 ml-auto">
                <Button variant="outline" onClick={exportToPDF}><FileText className="h-4 w-4 mr-2" /> PDF</Button>
                <Button variant="outline" onClick={exportToExcel}><FileSpreadsheet className="h-4 w-4 mr-2" /> Excel</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10"><DollarSign className="h-6 w-6 text-primary" /></div>
                <div><p className="text-sm text-muted-foreground">Total Revenue</p><p className="text-2xl font-bold">${metrics.totalRevenue.toFixed(2)}</p></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-success/10"><ShoppingCart className="h-6 w-6 text-success" /></div>
                <div><p className="text-sm text-muted-foreground">Total Orders</p><p className="text-2xl font-bold">{metrics.totalTransactions}</p></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-amber-500/10"><TrendingUp className="h-6 w-6 text-amber-500" /></div>
                <div><p className="text-sm text-muted-foreground">Avg. Order Value</p><p className="text-2xl font-bold">${metrics.avgTransaction.toFixed(2)}</p></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-purple-500/10"><Users className="h-6 w-6 text-purple-500" /></div>
                <div><p className="text-sm text-muted-foreground">Items Sold</p><p className="text-2xl font-bold">{metrics.totalItems}</p></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview" className="gap-2"><BarChart3 className="h-4 w-4" />Revenue Trends</TabsTrigger>
            <TabsTrigger value="items" className="gap-2"><PieChartIcon className="h-4 w-4" />Top Items</TabsTrigger>
            <TabsTrigger value="hourly" className="gap-2"><Clock className="h-4 w-4" />Hourly Analysis</TabsTrigger>
            <TabsTrigger value="open-checks" className="gap-2"><ClipboardList className="h-4 w-4" />Open Checks</TabsTrigger>
            <TabsTrigger value="loss-prevention" className="gap-2"><AlertTriangle className="h-4 w-4" />Loss Prevention</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle>Daily Revenue</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueByDay}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} formatter={(value: number) => [formatCurrency(value), "Revenue"]} />
                        <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Revenue by Payment Method</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={revenueByPayment} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={100} fill="#8884d8" dataKey="value">
                          {revenueByPayment.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} formatter={(value: number) => [formatCurrency(value), "Revenue"]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="items" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle>Top Selling Items</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topItems} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis dataKey="name" type="category" width={100} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                        <Bar dataKey="quantity" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Revenue by Category</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={revenueByCategory} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={120} fill="#8884d8" dataKey="value">
                          {revenueByCategory.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} formatter={(value: number) => [formatCurrency(value), "Revenue"]} />
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
              <CardHeader><CardTitle>Hourly Sales Distribution</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={hourlyDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="orders" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Orders" />
                      <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="hsl(var(--success))" strokeWidth={2} dot={false} name="Revenue ($)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="open-checks" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Open Checks / Active Tables</CardTitle>
                <CardDescription>Tables that have started a meal but haven't paid yet</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Table</TableHead>
                      <TableHead>Opened</TableHead>
                      <TableHead>Server</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {openOrders.filter(o => o.status === 'open' || o.status === 'billing').length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No active checks at the moment
                        </TableCell>
                      </TableRow>
                    ) : (
                      openOrders
                        .filter(o => o.status === 'open' || o.status === 'billing')
                        .map((order: any) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-bold">Table {order.table_number}</TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span>{format(parseISO(order.created_at), "HH:mm")}</span>
                                <span className="text-xs text-muted-foreground">{formatDistanceToNow(parseISO(order.created_at))} ago</span>
                              </div>
                            </TableCell>
                            <TableCell>{order.server_name || "Unassigned"}</TableCell>
                            <TableCell>{order.pos_order_items?.length || 0} items</TableCell>
                            <TableCell className="font-mono font-bold">
                              {formatCurrency(order.total || order.pos_order_items?.reduce((sum: number, i: any) => sum + (i.item_price * i.quantity), 0) || 0)}
                            </TableCell>
                            <TableCell>
                              <Badge variant={order.status === 'billing' ? "secondary" : "outline"} className="capitalize">
                                {order.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="loss-prevention" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-destructive flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> Voids & Corrections</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-secondary/20 rounded-lg">
                        <p className="text-sm text-muted-foreground">Total Voided Value</p>
                        <p className="text-2xl font-bold">{formatCurrency(voidMetrics.totalVoids)}</p>
                      </div>
                      <div className="p-4 bg-secondary/20 rounded-lg">
                        <p className="text-sm text-muted-foreground">Void Count</p>
                        <p className="text-2xl font-bold">{voidMetrics.voidCount}</p>
                      </div>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Reason</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {voidMetrics.voidedItems.length === 0 ? (
                          <TableRow><TableCell colSpan={3} className="text-center py-4 text-muted-foreground">No voids recorded</TableCell></TableRow>
                        ) : voidMetrics.voidedItems.map((v, i) => (
                          <TableRow key={i}>
                            <TableCell>{v.item}</TableCell>
                            <TableCell className="font-mono">{formatCurrency(v.amount)}</TableCell>
                            <TableCell className="text-xs">{v.reason}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-primary flex items-center gap-2"><Percent className="h-5 w-5" /> Discount Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-secondary/20 rounded-lg">
                        <p className="text-sm text-muted-foreground">Total Discounts</p>
                        <p className="text-2xl font-bold">{formatCurrency(voidMetrics.totalDiscounts)}</p>
                      </div>
                      <div className="p-4 bg-secondary/20 rounded-lg">
                        <p className="text-sm text-muted-foreground">Discounted Orders</p>
                        <p className="text-2xl font-bold">{voidMetrics.discountCount}</p>
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg bg-primary/5">
                      <h4 className="font-semibold mb-2">Discount Ratio</h4>
                      <div className="flex items-center gap-4">
                        <div className="flex-1 h-3 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${metrics.totalRevenue > 0 ? (voidMetrics.totalDiscounts / metrics.totalRevenue) * 100 : 0}%` }} />
                        </div>
                        <span className="font-bold">{metrics.totalRevenue > 0 ? ((voidMetrics.totalDiscounts / metrics.totalRevenue) * 100).toFixed(1) : 0}%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
