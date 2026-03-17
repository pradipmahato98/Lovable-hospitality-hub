import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3, TrendingDown, TrendingUp, AlertCircle, Download, FileText, Truck, Activity } from "lucide-react";
import { useInventoryStats, useInventoryItems, useStockMovements, useSuppliers, usePurchaseOrders } from "@/hooks/useInventory";
import { formatCurrency } from "@/lib/utils";

export function ReportsTab() {
  const stats = useInventoryStats();
  const { data: items = [] } = useInventoryItems();
  const { data: movements = [] } = useStockMovements();
  const { data: suppliers = [] } = useSuppliers();
  const { data: orders = [] } = usePurchaseOrders();

  const departmentValue = items.reduce((acc: any, item) => {
    const dept = item.department || "Unassigned";
    acc[dept] = (acc[dept] || 0) + (item.current_stock * item.cost_price);
    return acc;
  }, {});

  const categoryValue = items.reduce((acc: any, item) => {
    const cat = item.category?.name || "Uncategorized";
    acc[cat] = (acc[cat] || 0) + (item.current_stock * item.cost_price);
    return acc;
  }, {});

  // Supplier Performance Logic
  const supplierStats = suppliers.map(s => {
    const sOrders = orders.filter(o => o.supplier_id === s.id);
    const totalSpent = sOrders.reduce((sum, o) => sum + o.total, 0);
    const fulfillmentRate = sOrders.length > 0
      ? (sOrders.filter(o => o.status === 'received').length / sOrders.length) * 100
      : 0;
    return { name: s.name, orders: sOrders.length, spent: totalSpent, rate: fulfillmentRate };
  });

  // Consumption Analysis (Last 30 days)
  const consumptionByDept = movements
    .filter(m => m.movement_type === 'out')
    .reduce((acc: any, m) => {
      const dept = (m.item as any)?.department || "General";
      const value = m.quantity * ((m.item as any)?.cost_price || 0);
      acc[dept] = (acc[dept] || 0) + value;
      return acc;
    }, {});

  return (
    <div className="space-y-6">
      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Current Inventory Value</CardTitle>
            <BarChart3 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(stats.totalValue)}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-success" /> 4.2% from last month
            </p>
          </CardContent>
        </Card>
        <Card className="bg-amber-500/5 border-amber-500/20">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Reorder Alert Cost</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{formatCurrency(items.filter(i => i.current_stock <= i.reorder_point).reduce((sum, i) => sum + (i.reorder_point * i.cost_price), 0))}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats.lowStock} items need replenishment</p>
          </CardContent>
        </Card>
        <Card className="bg-destructive/5 border-destructive/20">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Monthly Consumption Value</CardTitle>
            <Activity className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(Object.values(consumptionByDept).reduce((a: any, b: any) => a + b, 0))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Based on stock-out movements</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department-wise Value */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Value by Department</CardTitle>
            <Button variant="ghost" size="icon"><Download className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-right">Stock Value</TableHead>
                  <TableHead className="text-right">Consumption</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(departmentValue).sort((a: any, b: any) => b[1] - a[1]).map(([dept, val]: any) => (
                  <TableRow key={dept}>
                    <TableCell className="font-medium">{dept}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(val)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatCurrency(consumptionByDept[dept] || 0)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Supplier Performance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Supplier Performance</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Spent</TableHead>
                  <TableHead className="text-right">Fulfillment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {supplierStats.sort((a, b) => b.spent - a.spent).slice(0, 5).map((s) => (
                  <TableRow key={s.name}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="text-right">{s.orders}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{formatCurrency(s.spent)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={s.rate > 80 ? "success" : "secondary"}>{s.rate.toFixed(0)}%</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Reports Listing */}
      <div className="space-y-4 pt-4">
        <h4 className="font-semibold text-lg flex items-center gap-2"><FileText className="h-5 w-5" /> Executive Reporting</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: "Stock Valuation Report", desc: "Detailed item-wise stock & value", icon: Package },
            { title: "Inventory Aging Report", desc: "Stock staying time analysis", icon: TrendingDown },
            { title: "Wastage Analysis", desc: "Detailed breakdown of stock losses", icon: AlertCircle },
            { title: "Supplier Scorecard", desc: "Lead time and price variance", icon: Truck },
          ].map((rpt, idx) => (
            <Card key={idx} className="hover:bg-muted/50 transition-colors cursor-pointer group">
              <CardContent className="pt-6">
                <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <rpt.icon className="h-5 w-5 text-primary" />
                </div>
                <h5 className="font-bold text-sm">{rpt.title}</h5>
                <p className="text-xs text-muted-foreground mt-1">{rpt.desc}</p>
                <Button variant="link" className="p-0 h-auto mt-4 text-xs font-semibold group-hover:translate-x-1 transition-transform">Generate Report &rarr;</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
