import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ArrowUpDown, Search, Download, History,
  Filter, Package, ArrowRight, ArrowLeft, RefreshCw
} from "lucide-react";
import { useItemService } from "@/hooks/inventory/useItemService";
import { useStoreService } from "@/hooks/inventory/useStoreService";
import { useInventoryTransactionService } from "@/hooks/inventory/useInventoryTransactionService";
import { formatAD, formatCurrency, cn } from "@/lib/utils";
import { exportToExcel } from "@/lib/reportExport";

export function ItemLedgerReport() {
  const { items: itemsQuery } = useItemService();
  const items = itemsQuery.data || [];

  const { stores: storesQuery } = useStoreService();
  const stores = storesQuery.data || [];

  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const { movements: movementsQuery } = useInventoryTransactionService();
  const movements = (movementsQuery.data || []).filter((m: any) => !selectedItemId || m.item_id === selectedItemId);
  const isLoading = movementsQuery.isLoading;

  const selectedItem = items.find((i: any) => i.item_id === selectedItemId);

  const handleExport = () => {
    if (!selectedItem) return;
    const data = {
      title: `Item Ledger: ${selectedItem.item_name} (${selectedItem.item_code})`,
      headers: ["Date", "Store", "Type", "Reference", "Qty Change", "Balance After"],
      rows: movements.map((m: any) => [
        formatAD(new Date(m.movement_date), "time"),
        stores.find((s: any) => s.store_id === m.store_id)?.store_name || "Main",
        m.movement_type.toUpperCase(),
        m.reference_type || "Manual",
        m.movement_type === 'out' ? `-${m.quantity}` : `+${m.quantity}`,
        "TBD" // Balance calculation would require cumulative sum from start
      ]),
    };
    exportToExcel(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-end bg-muted/20 p-4 rounded-xl border border-dashed">
         <div className="flex-1 space-y-1">
            <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Select Inventory Asset</label>
            <Select value={selectedItemId} onValueChange={setSelectedItemId}>
               <SelectTrigger className="h-10 bg-background">
                  <SelectValue placeholder="Choose an item to view history..." />
               </SelectTrigger>
               <SelectContent>
                  {items.map((i: any) => (
                     <SelectItem key={i.item_id} value={i.item_id}>{i.item_name} ({i.item_code})</SelectItem>
                  ))}
               </SelectContent>
            </Select>
         </div>
         <Button variant="blue" className="h-10 gap-2 px-6" onClick={handleExport} disabled={!selectedItemId}>
            <Download className="h-4 w-4" /> Export Ledger
         </Button>
      </div>

      {!selectedItemId ? (
         <Card className="border-dashed flex flex-col items-center justify-center p-20 text-center bg-muted/10">
            <History className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
            <h4 className="text-lg font-bold text-muted-foreground">Item Ledger Inquiry</h4>
            <p className="text-sm text-muted-foreground max-w-sm mt-2">Select an item above to view its full transaction history, audit trails, and stock movements.</p>
         </Card>
      ) : (
         <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <Card className="lg:col-span-1 h-fit">
               <CardHeader className="pb-3">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                     <Package className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg font-bold">{selectedItem?.item_name}</CardTitle>
                  <CardDescription className="font-mono text-xs uppercase">{selectedItem?.item_code}</CardDescription>
               </CardHeader>
               <CardContent className="space-y-4 pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">On Hand</p>
                        <p className="text-xl font-bold">{selectedItem?.current_stock} {selectedItem?.unit?.unit_symbol || 'pcs'}</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Avg Cost</p>
                        <p className="text-xl font-bold">{formatCurrency(selectedItem?.avg_cost || 0)}</p>
                     </div>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                     <div className="flex justify-between text-xs font-medium">
                        <span className="text-muted-foreground">Category</span>
                        <span>{selectedItem?.category?.category_name || "General"}</span>
                     </div>
                     <div className="flex justify-between text-xs font-medium">
                        <span className="text-muted-foreground">Status</span>
                        <Badge variant="success" className="h-4 text-[8px] uppercase">Active</Badge>
                     </div>
                  </div>
               </CardContent>
            </Card>

            <Card className="lg:col-span-3">
               <CardHeader className="pb-2 border-b">
                  <div className="flex items-center justify-between">
                     <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <History className="h-4 w-4 text-primary" />
                        Transaction Audit Trail
                     </CardTitle>
                     <span className="text-xs text-muted-foreground font-medium">{movements.length} total entries</span>
                  </div>
               </CardHeader>
               <CardContent className="p-0">
                  <Table>
                     <TableHeader className="bg-muted/30">
                        <TableRow>
                           <TableHead className="text-[10px] font-bold uppercase">Date & Time</TableHead>
                           <TableHead className="text-[10px] font-bold uppercase">Type</TableHead>
                           <TableHead className="text-[10px] font-bold uppercase">Reference</TableHead>
                           <TableHead className="text-[10px] font-bold uppercase">Store</TableHead>
                           <TableHead className="text-right text-[10px] font-bold uppercase">Qty</TableHead>
                        </TableRow>
                     </TableHeader>
                     <TableBody>
                        {isLoading ? (
                           <TableRow><TableCell colSpan={5} className="text-center py-20"><RefreshCw className="h-6 w-6 animate-spin mx-auto text-primary opacity-20" /></TableCell></TableRow>
                        ) : movements.length === 0 ? (
                           <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic">No movements recorded for this item.</TableCell></TableRow>
                        ) : (
                           movements.map((m: any) => (
                              <TableRow key={m.movement_id} className="hover:bg-muted/5">
                                 <TableCell className="text-[10px] font-mono whitespace-nowrap">{formatAD(new Date(m.movement_date), "time")}</TableCell>
                                 <TableCell>
                                    <Badge variant="outline" className={cn(
                                       "text-[8px] h-4 uppercase",
                                       m.movement_type === 'in' ? "text-success border-success/20" :
                                       m.movement_type === 'out' ? "text-destructive border-destructive/20" : ""
                                    )}>
                                       {m.movement_type}
                                    </Badge>
                                 </TableCell>
                                 <TableCell className="text-[10px] font-medium max-w-[150px] truncate">
                                    {m.reference_type?.replace('_', ' ') || "Manual Adjustment"}
                                    {m.notes && <p className="text-[8px] text-muted-foreground font-normal italic mt-0.5 line-clamp-1">{m.notes}</p>}
                                 </TableCell>
                                 <TableCell className="text-[10px] font-semibold">{stores.find((s: any) => s.store_id === m.store_id)?.store_name || "Main Store"}</TableCell>
                                 <TableCell className={cn("text-right font-mono text-xs font-bold", m.movement_type === 'out' ? "text-destructive" : "text-success")}>
                                    {m.movement_type === 'out' ? '-' : '+'}{m.quantity}
                                 </TableCell>
                              </TableRow>
                           ))
                        )}
                     </TableBody>
                  </Table>
               </CardContent>
            </Card>
         </div>
      )}
    </div>
  );
}
