import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Undo2, Search, Trash2, Loader2, Receipt, AlertCircle, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { useInventoryReturns, useSuppliers, useInventoryItems, usePurchaseOrders } from "@/hooks/useInventory";
import { formatCurrency } from "@/lib/utils";

export function ReturnsTab() {
  const { data: returns = [], createReturn } = useInventoryReturns();
  const { data: suppliers = [] } = useSuppliers();
  const { data: items = [] } = useInventoryItems();
  const { data: orders = [] } = usePurchaseOrders();

  const [open, setOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [selectedPO, setSelectedPO] = useState("");
  const [reason, setReason] = useState("");
  const [returnItems, setReturnItems] = useState<{item_id: string, quantity: number, unit_price: number}[]>([]);

  const handleAddReturnItem = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    setReturnItems([...returnItems, { item_id: itemId, quantity: 1, unit_price: item.avg_cost || item.cost_price }]);
  };

  const handleCreate = async () => {
    if (!selectedSupplier || returnItems.length === 0) {
      toast.error("Please select a supplier and at least one item");
      return;
    }
    try {
      await createReturn.mutateAsync({
        supplier_id: selectedSupplier,
        purchase_order_id: selectedPO || null,
        reason: reason,
        total_amount: returnItems.reduce((sum, i) => sum + (i.quantity * i.unit_price), 0),
        items: returnItems
      });
      toast.success("Supplier return processed (Debit Note generated)");
      setOpen(false);
      resetForm();
    } catch { toast.error("Failed to process return"); }
  };

  const resetForm = () => {
    setSelectedSupplier("");
    setSelectedPO("");
    setReason("");
    setReturnItems([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2"><Undo2 className="h-5 w-5 text-primary" /> Supplier Returns (Debit Notes)</h3>
          <p className="text-sm text-muted-foreground">Manage damaged or expired goods returned to vendors</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button variant="blue" className="gap-2"><Plus className="h-4 w-4" />Process Return</Button></DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader><DialogTitle>Supplier Return & Debit Note</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4 pr-2">
              <div className="space-y-2">
                <Label>Supplier *</Label>
                <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                  <SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger>
                  <SelectContent>{suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>PO Reference (Optional)</Label>
                <Select value={selectedPO} onValueChange={setSelectedPO}>
                  <SelectTrigger><SelectValue placeholder="Select PO" /></SelectTrigger>
                  <SelectContent>
                    {orders.filter(o => o.supplier_id === selectedSupplier).map(o => <SelectItem key={o.id} value={o.id}>{o.order_number}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Return Reason</Label>
                <Select value={reason} onValueChange={setReason}>
                   <SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
                   <SelectContent>
                      <SelectItem value="Damaged Goods">Damaged Goods / Quality Issue</SelectItem>
                      <SelectItem value="Expired Goods">Expired Goods</SelectItem>
                      <SelectItem value="Wrong Item">Wrong Item Shipped</SelectItem>
                      <SelectItem value="Over-shipped">Over-shipped Quantity</SelectItem>
                   </SelectContent>
                </Select>
              </div>

              <div className="col-span-2 space-y-4 pt-4 border-t">
                 <div className="flex justify-between items-center">
                    <Label className="font-bold">Return Items</Label>
                    <Select onValueChange={handleAddReturnItem}>
                       <SelectTrigger className="w-64 h-8 text-xs"><SelectValue placeholder="Add item to return..." /></SelectTrigger>
                       <SelectContent>
                          {items.map(i => <SelectItem key={i.id} value={i.id}>{i.name} (Stock: {i.current_stock})</SelectItem>)}
                       </SelectContent>
                    </Select>
                 </div>
                 <div className="max-h-48 overflow-y-auto border rounded-lg">
                    <Table>
                       <TableHeader><TableRow><TableHead>Item</TableHead><TableHead className="w-24">Qty</TableHead><TableHead className="w-32">Rate</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                       <TableBody>
                          {returnItems.map((ri, idx) => {
                             const item = items.find(i => i.id === ri.item_id);
                             return (
                                <TableRow key={idx}>
                                   <TableCell className="text-xs">{item?.name}</TableCell>
                                   <TableCell><Input type="number" className="h-7 text-xs" value={ri.quantity} onChange={(e) => {
                                      const newItems = [...returnItems];
                                      newItems[idx].quantity = Number(e.target.value);
                                      setReturnItems(newItems);
                                   }} /></TableCell>
                                   <TableCell className="text-xs font-mono">{formatCurrency(ri.unit_price)}</TableCell>
                                   <TableCell className="text-right text-xs font-bold">{formatCurrency(ri.quantity * ri.unit_price)}</TableCell>
                                </TableRow>
                             );
                          })}
                          {returnItems.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-8 text-xs italic text-muted-foreground">No items added</TableCell></TableRow>}
                       </TableBody>
                    </Table>
                 </div>
              </div>
            </div>
            <DialogFooter className="bg-muted/30 p-4 -mx-6 -mb-6 border-t flex justify-between items-center">
               <div className="text-left">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Total Credit Value</p>
                  <p className="text-xl font-bold text-primary">{formatCurrency(returnItems.reduce((sum, i) => sum + (i.quantity * i.unit_price), 0))}</p>
               </div>
               <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button variant="blue" onClick={handleCreate} disabled={createReturn.isPending}>
                     {createReturn.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                     Process & Debit Note
                  </Button>
               </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card variant="elevated">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Return Ref</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {returns.map((ret) => (
                <TableRow key={ret.id}>
                  <TableCell>
                    <div className="font-bold text-xs">{ret.return_number}</div>
                    <div className="text-[10px] text-muted-foreground">{new Date(ret.created_at).toLocaleDateString()}</div>
                  </TableCell>
                  <TableCell className="text-xs font-medium">{ret.supplier?.name}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px] uppercase">{ret.reason}</Badge></TableCell>
                  <TableCell className="text-xs">{ret.items?.length} categories</TableCell>
                  <TableCell className="text-right font-bold font-mono text-xs">{formatCurrency(ret.total_amount)}</TableCell>
                </TableRow>
              ))}
              {returns.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic text-sm">No returns processed yet</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
