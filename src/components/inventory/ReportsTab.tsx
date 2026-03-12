import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3, AlertTriangle, TrendingDown, Download, Trash } from "lucide-react";
import { useInventoryItems, useInventoryCategories, useStockMovements, useInventoryWastage } from "@/hooks/useInventory";
import { formatCurrency, formatAD } from "@/lib/utils";
import { exportToExcel, exportToPDF } from "@/lib/reportExport";
import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function ReportsTab() {
  const { data: items = [] } = useInventoryItems();
  const { data: categories = [] } = useInventoryCategories();
  const { data: movements = [] } = useStockMovements();
  const { data: wastage = [], reportWastage, approveWastage } = useInventoryWastage();

  const [wastageOpen, setWastageOpen] = useState(false);
  const [wastageForm, setWastageForm] = useState({ item_id: "", quantity: 1, wastage_type: "damaged", reason: "" });

  // Stock Valuation by Category
  const valuationByCategory = categories.map((cat) => {
    const catItems = items.filter((i) => i.category_id === cat.id);
    const totalValue = catItems.reduce((s, i) => s + i.current_stock * i.cost_price, 0);
    return { ...cat, itemCount: catItems.length, totalValue };
  }).sort((a, b) => b.totalValue - a.totalValue);

  const uncategorizedItems = items.filter((i) => !i.category_id);
  const uncategorizedValue = uncategorizedItems.reduce((s, i) => s + i.current_stock * i.cost_price, 0);
  const totalInventoryValue = items.reduce((s, i) => s + i.current_stock * i.cost_price, 0);

  // Low stock items
  const lowStockItems = items.filter((i) => i.current_stock <= i.reorder_point && i.current_stock > 0);
  const outOfStockItems = items.filter((i) => i.current_stock === 0);

  // Top consumed (stock out movements)
  const consumptionMap: Record<string, { name: string; totalOut: number }> = {};
  movements.filter((m) => m.movement_type === "out").forEach((m) => {
    const name = (m.item as any)?.name || "Unknown";
    if (!consumptionMap[m.item_id]) consumptionMap[m.item_id] = { name, totalOut: 0 };
    consumptionMap[m.item_id].totalOut += m.quantity;
  });
  const topConsumed = Object.values(consumptionMap).sort((a, b) => b.totalOut - a.totalOut).slice(0, 10);

  // Total wastage cost
  const totalWastageCost = wastage.reduce((s, w) => s + w.cost_impact, 0);

  const handleExportValuation = (format: "pdf" | "excel") => {
    const data = {
      title: "Inventory Valuation Report",
      headers: ["Category", "Items", "Total Value"],
      rows: [...valuationByCategory.map((c) => [c.name, c.itemCount, formatCurrency(c.totalValue)]),
        ...(uncategorizedItems.length ? [["Uncategorized", uncategorizedItems.length, formatCurrency(uncategorizedValue)] as any] : []),
        ["TOTAL", items.length, formatCurrency(totalInventoryValue)],
      ],
    };
    format === "pdf" ? exportToPDF(data) : exportToExcel(data);
  };

  const handleReportWastage = async () => {
    if (!wastageForm.item_id) { toast.error("Select an item"); return; }
    const item = items.find((i) => i.id === wastageForm.item_id);
    const costImpact = (item?.cost_price || 0) * wastageForm.quantity;
    try {
      await reportWastage.mutateAsync({ ...wastageForm, quantity: Number(wastageForm.quantity), cost_impact: costImpact });
      toast.success("Wastage reported & stock deducted");
      setWastageOpen(false);
      setWastageForm({ item_id: "", quantity: 1, wastage_type: "damaged", reason: "" });
    } catch { toast.error("Failed to report wastage"); }
  };

  return (
    <div className="space-y-6">
      {/* Valuation */}
      <Card variant="elevated">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />Stock Valuation by Category</CardTitle><CardDescription>Total: {formatCurrency(totalInventoryValue)}</CardDescription></div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleExportValuation("excel")}><Download className="h-4 w-4 mr-1" />Excel</Button>
              <Button variant="outline" size="sm" onClick={() => handleExportValuation("pdf")}><Download className="h-4 w-4 mr-1" />PDF</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Category</TableHead><TableHead>Items</TableHead><TableHead>Total Value</TableHead><TableHead>% of Total</TableHead></TableRow></TableHeader>
            <TableBody>
              {valuationByCategory.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.itemCount}</TableCell>
                  <TableCell>{formatCurrency(c.totalValue)}</TableCell>
                  <TableCell>{totalInventoryValue > 0 ? ((c.totalValue / totalInventoryValue) * 100).toFixed(1) : 0}%</TableCell>
                </TableRow>
              ))}
              {uncategorizedItems.length > 0 && (
                <TableRow>
                  <TableCell className="font-medium text-muted-foreground">Uncategorized</TableCell>
                  <TableCell>{uncategorizedItems.length}</TableCell>
                  <TableCell>{formatCurrency(uncategorizedValue)}</TableCell>
                  <TableCell>{totalInventoryValue > 0 ? ((uncategorizedValue / totalInventoryValue) * 100).toFixed(1) : 0}%</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <Card variant="elevated">
          <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-500" />Low Stock Alerts</CardTitle><CardDescription>{lowStockItems.length} items below reorder point</CardDescription></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Stock</TableHead><TableHead>Reorder</TableHead><TableHead>Needed</TableHead></TableRow></TableHeader>
              <TableBody>
                {lowStockItems.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-4 text-muted-foreground">All items above reorder point</TableCell></TableRow> :
                  lowStockItems.map((i) => (
                    <TableRow key={i.id}>
                      <TableCell className="font-medium">{i.name}</TableCell>
                      <TableCell className="text-amber-500 font-bold">{i.current_stock} {i.unit}</TableCell>
                      <TableCell>{i.reorder_point}</TableCell>
                      <TableCell className="font-medium">{Math.max(0, (i.max_stock || i.reorder_point * 2) - i.current_stock)} {i.unit}</TableCell>
                    </TableRow>
                  ))
                }
              </TableBody>
            </Table>
            {outOfStockItems.length > 0 && (
              <div className="mt-4 p-3 bg-destructive/10 rounded-lg">
                <p className="text-sm font-medium text-destructive flex items-center gap-2"><TrendingDown className="h-4 w-4" />{outOfStockItems.length} items out of stock</p>
                <p className="text-xs text-muted-foreground mt-1">{outOfStockItems.map((i) => i.name).join(", ")}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Consumed */}
        <Card variant="elevated">
          <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />Top Consumed Items</CardTitle><CardDescription>Based on stock-out movements</CardDescription></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>#</TableHead><TableHead>Item</TableHead><TableHead>Total Out</TableHead></TableRow></TableHeader>
              <TableBody>
                {topConsumed.length === 0 ? <TableRow><TableCell colSpan={3} className="text-center py-4 text-muted-foreground">No consumption data</TableCell></TableRow> :
                  topConsumed.map((c, i) => (
                    <TableRow key={i}><TableCell>{i + 1}</TableCell><TableCell className="font-medium">{c.name}</TableCell><TableCell className="font-bold">{c.totalOut}</TableCell></TableRow>
                  ))
                }
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Wastage */}
      <Card variant="elevated">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div><CardTitle className="flex items-center gap-2"><Trash className="h-5 w-5" />Wastage & Damage</CardTitle><CardDescription>Total cost impact: {formatCurrency(totalWastageCost)}</CardDescription></div>
            <Dialog open={wastageOpen} onOpenChange={setWastageOpen}>
              <DialogTrigger asChild><Button variant="gold" className="gap-2"><Trash className="h-4 w-4" />Report Wastage</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Report Wastage</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2"><Label>Item *</Label>
                    <Select value={wastageForm.item_id} onValueChange={(v) => setWastageForm({ ...wastageForm, item_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger>
                      <SelectContent>{items.map((i) => <SelectItem key={i.id} value={i.id}>{i.name} ({i.current_stock} {i.unit})</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Quantity</Label><Input type="number" min={1} value={wastageForm.quantity} onChange={(e) => setWastageForm({ ...wastageForm, quantity: Number(e.target.value) })} /></div>
                  <div className="space-y-2"><Label>Type</Label>
                    <Select value={wastageForm.wastage_type} onValueChange={(v) => setWastageForm({ ...wastageForm, wastage_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="damaged">Damaged</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                        <SelectItem value="spoiled">Spoiled</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Reason</Label><Input value={wastageForm.reason} onChange={(e) => setWastageForm({ ...wastageForm, reason: e.target.value })} /></div>
                  {wastageForm.item_id && (
                    <p className="text-sm text-muted-foreground">Cost impact: {formatCurrency((items.find((i) => i.id === wastageForm.item_id)?.cost_price || 0) * wastageForm.quantity)}</p>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setWastageOpen(false)}>Cancel</Button>
                  <Button onClick={handleReportWastage} disabled={reportWastage.isPending}>
                    {reportWastage.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Report
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Item</TableHead><TableHead>Qty</TableHead><TableHead>Type</TableHead><TableHead>Cost Impact</TableHead><TableHead>Reason</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {wastage.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No wastage records</TableCell></TableRow> :
                wastage.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell>{formatAD(new Date(w.created_at))}</TableCell>
                    <TableCell className="font-medium">{w.item?.name || "-"}</TableCell>
                    <TableCell>{w.quantity} {w.item?.unit}</TableCell>
                    <TableCell><Badge className="bg-muted text-muted-foreground">{w.wastage_type}</Badge></TableCell>
                    <TableCell className="text-destructive font-medium">{formatCurrency(w.cost_impact)}</TableCell>
                    <TableCell className="text-muted-foreground">{w.reason || "-"}</TableCell>
                    <TableCell><Badge className={w.status === "approved" ? "bg-success/20 text-success" : "bg-amber-500/20 text-amber-400"}>{w.status}</Badge></TableCell>
                    <TableCell>
                      {w.status === "pending" && (
                        <Button variant="ghost" size="sm" onClick={async () => { try { await approveWastage.mutateAsync(w.id); toast.success("Approved"); } catch { toast.error("Failed"); } }}>
                          Approve
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              }
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Supplier Performance */}
      <SupplierPerformanceReport />
    </div>
  );
}

function SupplierPerformanceReport() {
  const { data: purchaseOrders = [] } = useQuery({
    queryKey: ["inventory-supplier-performance"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_orders")
        .select("id, supplier_id, status, total, order_date, expected_delivery, received_date");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["inventory-suppliers-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("suppliers").select("id, name");
      if (error) throw error;
      return data || [];
    },
  });

  const supplierPerf = useMemo(() => {
    const supplierMap = new Map(suppliers.map((s: any) => [s.id, s.name]));
    const bySupplier: Record<string, { name: string; poCount: number; totalValue: number; onTime: number; pending: number }> = {};
    purchaseOrders.forEach((po: any) => {
      const sid = po.supplier_id || "unknown";
      const name = supplierMap.get(sid) || "Unknown";
      if (!bySupplier[sid]) bySupplier[sid] = { name, poCount: 0, totalValue: 0, onTime: 0, pending: 0 };
      bySupplier[sid].poCount++;
      bySupplier[sid].totalValue += po.total || 0;
      if (po.status === "received" && po.received_date && po.expected_delivery && po.received_date <= po.expected_delivery) {
        bySupplier[sid].onTime++;
      }
      if (po.status === "pending" || po.status === "ordered") bySupplier[sid].pending++;
    });
    return Object.values(bySupplier).sort((a, b) => b.totalValue - a.totalValue);
  }, [purchaseOrders, suppliers]);

  return (
    <Card variant="elevated">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />Supplier Performance</CardTitle><CardDescription>{supplierPerf.length} suppliers tracked</CardDescription></div>
          <Button variant="outline" size="sm" onClick={() => exportToPDF({
            title: "Supplier Performance Report",
            headers: ["Supplier", "PO Count", "Total Value", "On-Time", "Pending"],
            rows: supplierPerf.map(s => [s.name, s.poCount, formatCurrency(s.totalValue), s.onTime, s.pending]),
          })}><Download className="h-4 w-4 mr-1" />PDF</Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Supplier</TableHead>
              <TableHead className="text-right">PO Count</TableHead>
              <TableHead className="text-right">Total Value</TableHead>
              <TableHead className="text-right">On-Time</TableHead>
              <TableHead className="text-right">Pending</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {supplierPerf.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">No purchase order data</TableCell></TableRow>
            ) : supplierPerf.map((s, i) => (
              <TableRow key={i}>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell className="text-right">{s.poCount}</TableCell>
                <TableCell className="text-right font-mono font-bold">{formatCurrency(s.totalValue)}</TableCell>
                <TableCell className="text-right text-success font-bold">{s.onTime}</TableCell>
                <TableCell className="text-right">{s.pending}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
