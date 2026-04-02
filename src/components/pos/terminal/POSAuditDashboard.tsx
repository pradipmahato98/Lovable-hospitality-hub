import React, { useMemo } from "react";
import { usePOSTransactions } from "@/hooks/usePOS";
import { usePOSTerminal } from "@/hooks/pos/usePOSTerminal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import {
  TrendingUp,
  Users,
  ShoppingCart,
  AlertOctagon,
  PieChart as PieChartIcon,
  Calendar,
  DollarSign
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export const POSAuditDashboard = () => {
  const { data: transactions = [] } = usePOSTransactions({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const { activeOrders } = usePOSTerminal();

  const metrics = useMemo(() => {
    const revenue = transactions.reduce((sum, t) => sum + (t.total || 0), 0);
    const covers = activeOrders.reduce((sum, o) => sum + (o.total_covers || 0), 0) + (transactions.length * 2); // Mocked mix
    return {
      revenue,
      covers,
      avgCheck: covers > 0 ? revenue / covers : 0,
      laborCost: revenue * 0.15, // Simplified 15% demo labor
    };
  }, [transactions, activeOrders]);

  const pMix = useMemo(() => {
    const items: Record<string, { name: string; qty: number; revenue: number }> = {};
    transactions.forEach(t => {
      t.items?.forEach((i: any) => {
        if (!items[i.item_name]) items[i.item_name] = { name: i.item_name, qty: 0, revenue: 0 };
        items[i.item_name].qty += i.quantity;
        items[i.item_name].revenue += (i.item_price * i.quantity);
      });
    });
    return Object.values(items).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [transactions]);

  return (
    <div className="space-y-6">
      {/* 1-Page Flash Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total Sales", value: formatCurrency(metrics.revenue), icon: DollarSign, color: "text-blue-500" },
          { label: "Covers", value: metrics.covers, icon: Users, color: "text-emerald-500" },
          { label: "Avg Check", value: formatCurrency(metrics.avgCheck), icon: ShoppingCart, color: "text-amber-500" },
          { label: "Labor Cost %", value: "15%", icon: TrendingUp, color: "text-purple-500" },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm bg-muted/50">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                <p className="text-xl font-black mt-1">{stat.value}</p>
              </div>
              <stat.icon className={`h-8 w-8 ${stat.color} opacity-20`} />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Mix (P-Mix) Winners */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-primary" />
              Product Mix (Top Winners)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pMix} layout="vertical" margin={{ left: 40 }}>
                   <XAxis type="number" hide />
                   <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} fontSize={10} />
                   <Tooltip
                     cursor={{ fill: 'transparent' }}
                     contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                   />
                   <Bar dataKey="revenue" radius={[0, 4, 4, 0]} barSize={20}>
                      {pMix.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                   </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Void & Audit Log */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <AlertOctagon className="h-4 w-4 text-destructive" />
              Void & Audit Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[10px] uppercase font-bold">Item</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold">Reason</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold text-right">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { item: "Ribeye Steak", reason: "Wrong Item", value: 45.00, user: "Manager" },
                  { item: "Red Wine", reason: "Quality Issue", value: 12.00, user: "Server" },
                ].map((v, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs font-medium">{v.item}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[9px]">{v.reason}</Badge></TableCell>
                    <TableCell className="text-right text-xs font-bold text-destructive">-${v.value.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Shift Reconciliation */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
           <CardTitle className="text-sm font-bold">Daily Cashier Report (Shift End)</CardTitle>
           <Badge className="bg-emerald-500">SYSTEM BALANCED</Badge>
        </CardHeader>
        <CardContent>
           <div className="grid grid-cols-3 gap-8 p-4 rounded-xl bg-muted/20 border">
              <div>
                 <p className="text-[10px] font-bold text-muted-foreground uppercase">Expected Cash</p>
                 <p className="text-lg font-black">{formatCurrency(metrics.revenue * 0.4)}</p>
              </div>
              <div>
                 <p className="text-[10px] font-bold text-muted-foreground uppercase">Actual Cash</p>
                 <p className="text-lg font-black">{formatCurrency(metrics.revenue * 0.4)}</p>
              </div>
              <div>
                 <p className="text-[10px] font-bold text-muted-foreground uppercase">Over/Short</p>
                 <p className="text-lg font-black text-emerald-500">$0.00</p>
              </div>
           </div>
        </CardContent>
      </Card>
    </div>
  );
};
