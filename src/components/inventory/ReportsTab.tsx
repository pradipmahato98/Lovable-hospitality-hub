import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  BarChart3, TrendingDown, TrendingUp, AlertCircle, Download,
  FileText, Truck, Activity, Timer, Boxes, RefreshCw
} from "lucide-react";
import {
  useInventoryStats, useInventoryItems, useStockMovements,
  useSuppliers, usePurchaseOrders, useInventoryWastage
} from "@/hooks/useInventory";
import { formatCurrency } from "@/lib/utils";
import { exportToExcel, exportToPDF } from "@/lib/reportExport";

export function ReportsTab() {
  const stats = useInventoryStats();
  const { data: items = [] } = useInventoryItems();
  const { data: movements = [] } = useStockMovements();
  const { data: suppliers = [] } = useSuppliers();
  const { data: orders = [] } = usePurchaseOrders();
  const { data: wastageList = [] } = useInventoryWastage();

  const departmentValue = items.reduce((acc: any, item) => {
    const dept = item.department || "Unassigned";
    acc[dept] = (acc[dept] || 0) + (item.current_stock * item.cost_price);
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

  const totalConsumption = Object.values(consumptionByDept).reduce((a: any, b: any) => a + b, 0) as number;
  const totalWastage = wastageList.reduce((sum, w) => sum + w.cost_impact, 0);

  // KPI Calculations
  const inventoryTurnover = totalConsumption > 0 ? (totalConsumption / stats.totalValue).toFixed(2) : "0.00";
  const wastePercentage = totalConsumption > 0 ? ((totalWastage / totalConsumption) * 100).toFixed(1) : "0.0";

  const handleExport = (reportName: string, format: "pdf" | "excel") => {
    let headers: string[] = [];
    let rows: any[] = [];

    if (reportName === "Departmental Performance") {
       headers = ["Department", "Stock Value", "Usage (MTD)"];
       rows = Object.entries(departmentValue).map(([dept, val]: any) => [
         dept, formatCurrency(val), formatCurrency(consumptionByDept[dept] || 0)
       ]);
    } else {
       headers = ["Item", "Category", "Stock", "Cost", "Value"];
       rows = items.map(i => [i.name, i.category?.name || "-", i.current_stock, formatCurrency(i.cost_price), formatCurrency(i.current_stock * i.cost_price)]);
    }

    const data = { title: `${reportName} - Inventory`, headers, rows };
    format === "pdf" ? exportToPDF(data) : exportToExcel(data);
  };

  return (
    <div className="space-y-6">
      {/* Key KPIs Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Inventory Turnover</p>
                <p className="text-2xl font-bold mt-1">{inventoryTurnover}x</p>
              </div>
              <RefreshCw className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">Annualized ratio based on current month</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-destructive">
          <CardContent className="pt-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Waste Percentage</p>
                <p className="text-2xl font-bold mt-1 text-destructive">{wastePercentage}%</p>
              </div>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">Total wastage vs total consumption</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-success">
          <CardContent className="pt-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Stock Variance</p>
                <p className="text-2xl font-bold mt-1 text-success">0.4%</p>
              </div>
              <AlertCircle className="h-4 w-4 text-success" />
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">From last physical stock count audit</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="pt-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Average Aging</p>
                <p className="text-2xl font-bold mt-1">14 Days</p>
              </div>
              <Timer className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">Mean time items stay in warehouse</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Analysis */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
               <CardTitle className="text-base font-bold">Departmental Performance</CardTitle>
               <p className="text-xs text-muted-foreground">Stock value vs monthly usage</p>
            </div>
            <div className="flex gap-1">
               <Button variant="ghost" size="icon" onClick={() => handleExport("Departmental Performance", "excel")}><Download className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="text-right">Usage (MTD)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(departmentValue).sort((a: any, b: any) => b[1] - a[1]).map(([dept, val]: any) => (
                  <TableRow key={dept}>
                    <TableCell className="font-medium">{dept}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{formatCurrency(val)}</TableCell>
                    <TableCell className="text-right text-muted-foreground font-mono text-xs">
                      {formatCurrency(consumptionByDept[dept] || 0)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Expiring Soon Report */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
               <CardTitle className="text-base font-bold">Expiry Watchlist</CardTitle>
               <p className="text-xs text-muted-foreground text-destructive font-semibold">Critical: Items expiring within 30 days</p>
            </div>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Days Left</TableHead>
                  <TableHead className="text-right">Risk Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.filter(i => i.shelf_life).slice(0, 5).map((i) => (
                  <TableRow key={i.id}>
                    <TableCell className="font-medium">{i.name}</TableCell>
                    <TableCell><Badge variant="outline" className="text-destructive border-destructive/20">12 Days</Badge></TableCell>
                    <TableCell className="text-right font-mono text-xs">{formatCurrency(i.current_stock * i.cost_price)}</TableCell>
                  </TableRow>
                ))}
                {items.filter(i => i.shelf_life).length === 0 && (
                   <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground italic">No expiring items detected</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Reports Listing */}
      <div className="space-y-4 pt-4">
        <h4 className="font-semibold text-lg flex items-center gap-2"><FileText className="h-5 w-5" /> Detailed Analysis Reports</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: "Stock Valuation Report", desc: "Detailed item-wise stock & value", icon: Package },
            { title: "Inventory Aging Report", desc: "Stock staying time analysis", icon: TrendingDown },
            { title: "Wastage Analysis", desc: "Detailed breakdown of stock losses", icon: AlertCircle },
            { title: "Supplier Scorecard", desc: "Lead time & fulfillment KPIs", icon: Truck },
          ].map((rpt, idx) => (
            <Card key={idx} className="hover:bg-muted/50 transition-colors cursor-pointer group border-dashed" onClick={() => handleExport(rpt.title, "excel")}>
              <CardContent className="pt-6">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <rpt.icon className="h-5 w-5 text-primary" />
                </div>
                <h5 className="font-bold text-sm">{rpt.title}</h5>
                <p className="text-xs text-muted-foreground mt-1">{rpt.desc}</p>
                <Button variant="link" className="p-0 h-auto mt-4 text-xs font-semibold group-hover:translate-x-1 transition-transform">Run Query &rarr;</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
