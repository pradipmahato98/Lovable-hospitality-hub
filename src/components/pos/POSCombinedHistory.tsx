import React, { useState, useMemo } from "react";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
} from "recharts";
import {
  Receipt,
  Search,
  Download,
  Calendar,
  Eye,
  FileSpreadsheet,
  FileText,
  CreditCard,
  Banknote,
  Wallet,
  Building2,
  TrendingUp,
  ShoppingCart,
  Users,
} from "lucide-react";
import { usePOSTransactions, POSTransaction, POSOrderItem } from "@/hooks/usePOS";
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval, parseISO, isValid } from "date-fns";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";

const COLORS = ["hsl(var(--primary))", "hsl(var(--success))", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];

const paymentMethodIcons: Record<string, React.ReactNode> = {
  cash: <Banknote className="h-4 w-4" />,
  card: <CreditCard className="h-4 w-4" />,
  digital: <Wallet className="h-4 w-4" />,
  room: <Building2 className="h-4 w-4" />,
};

const paymentMethodLabels: Record<string, string> = {
  cash: "Cash",
  card: "Card",
  digital: "Digital Wallet",
  room: "Room Charge",
};

export function POSCombinedHistory() {
  const [period, setPeriod] = useState<"today" | "week" | "month" | "custom">("week");
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 7), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState<POSTransaction | null>(null);

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
      default:
        return { start: startDate, end: endDate };
    }
  }, [period, startDate, endDate]);

  const { data: transactions = [], isLoading } = usePOSTransactions({
    startDate: dateRange.start,
    endDate: dateRange.end,
  });

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        t.transaction_number?.toLowerCase().includes(query) ||
        t.table_number?.toLowerCase().includes(query) ||
        t.customer_name?.toLowerCase().includes(query)
      );
    });
  }, [transactions, searchQuery]);

  const metrics = useMemo(() => {
    const totalRevenue = transactions.reduce((sum, t) => sum + (t.total || 0), 0);
    const totalTransactions = transactions.length;
    const avgTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    return { totalRevenue, totalTransactions, avgTransaction };
  }, [transactions]);

  const revenueByDay = useMemo(() => {
    try {
      const days = eachDayOfInterval({
        start: parseISO(dateRange.start),
        end: parseISO(dateRange.end),
      });

      return days.map(day => {
        const dayStr = format(day, "yyyy-MM-dd");
        const dayTransactions = transactions.filter(t =>
          t.created_at.startsWith(dayStr)
        );
        return {
          date: format(day, "dd/MM"),
          revenue: dayTransactions.reduce((sum, t) => sum + (t.total || 0), 0),
        };
      });
    } catch (e) {
      return [];
    }
  }, [transactions, dateRange]);

  const exportToExcel = () => {
    const data = filteredTransactions.map((t) => ({
      "Transaction #": t.transaction_number,
      Date: format(parseISO(t.created_at), "dd/MM/yyyy HH:mm"),
      Table: t.table_number,
      Customer: t.customer_name || "-",
      Total: t.total,
      "Payment Method": paymentMethodLabels[t.payment_method] || t.payment_method,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "History");
    XLSX.writeFile(wb, "pos-history.xlsx");
  };

  const formatDateSafe = (dateStr: string, formatStr: string) => {
    try {
      const date = parseISO(dateStr);
      if (!isValid(date)) return "Invalid Date";
      return format(date, formatStr);
    } catch (e) {
      return "Invalid Date";
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary/5 border-primary/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10 text-primary">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics.totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-success/5 border-success/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-success/10 text-success">
                <ShoppingCart className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Transactions</p>
                <p className="text-2xl font-bold">{metrics.totalTransactions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-500/5 border-amber-500/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-amber-500/10 text-amber-500">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg. Bill</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics.avgTransaction)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Sales History & Analytics</CardTitle>
            <CardDescription>View performance and transaction logs</CardDescription>
          </div>
          <div className="flex items-center gap-2">
             <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
                <SelectTrigger className="w-[150px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
             </Select>
             <Button variant="outline" size="sm" onClick={exportToExcel}>
               <Download className="h-4 w-4 mr-2" />
               Export
             </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Revenue Chart */}
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByDay}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} axisLine={false} tickLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  cursor={{fill: 'hsl(var(--primary)/0.05)'}}
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                  formatter={(v: number) => [formatCurrency(v), "Revenue"]}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-4 border-t border-border">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by ID, Table, or Customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Table</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No transactions found for this period.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransactions.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-mono text-xs">{t.transaction_number}</TableCell>
                        <TableCell className="text-xs">{formatDateSafe(t.created_at, "dd MMM, HH:mm")}</TableCell>
                        <TableCell><Badge variant="outline">T{t.table_number}</Badge></TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-xs capitalize">
                            {paymentMethodIcons[t.payment_method]}
                            {t.payment_method}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(t.total)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedTransaction(t)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Detail Dialog */}
      <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bill Details</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-bold">{selectedTransaction.transaction_number}</p>
                  <p className="text-xs text-muted-foreground">{formatDateSafe(selectedTransaction.created_at, "PPP p")}</p>
                </div>
                <Badge variant="outline">Table {selectedTransaction.table_number}</Badge>
              </div>
              <div className="space-y-2 border-t pt-4">
                {selectedTransaction.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span>{item.quantity}x {item.item_name}</span>
                    <span>{formatCurrency(item.item_price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4 space-y-1.5">
                 <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(selectedTransaction.subtotal)}</span>
                 </div>
                 <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span>{formatCurrency(selectedTransaction.tax_amount)}</span>
                 </div>
                 <div className="flex justify-between font-bold text-lg pt-2 border-t border-dashed">
                    <span>Total</span>
                    <span className="text-primary">{formatCurrency(selectedTransaction.total)}</span>
                 </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
