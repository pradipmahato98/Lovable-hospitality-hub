import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, ListChecks, Loader2, Search, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useInventoryItems, useInventoryStores } from "@/hooks/useInventory";

export function StockCountTab() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const { data: items = [] } = useInventoryItems();
  const { data: stores = [] } = useInventoryStores();

  const [form, setForm] = useState({
    store_id: "", notes: "",
    counts: [] as { item_id: string, counted_quantity: number, system_quantity: number }[]
  });

  const startNewCount = () => {
    if (!form.store_id) {
      toast.error("Please select a store first");
      return;
    }
    // Filter items by store if multi-store is active, or just use all items for now
    const initialCounts = items.map(item => ({
      item_id: item.id,
      system_quantity: item.current_stock,
      counted_quantity: item.current_stock
    }));
    setForm({ ...form, counts: initialCounts });
  };

  const updateCount = (index: number, value: number) => {
    const newCounts = [...form.counts];
    newCounts[index].counted_quantity = value;
    setForm({ ...form, counts: newCounts });
  };

  const handleSubmit = async () => {
    // Placeholder for actual submission logic
    toast.success("Stock count submitted for reconciliation");
    setIsAddOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Physical Stock Count</h3>
          <p className="text-sm text-muted-foreground">Perform inventory audits and reconcile variances</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild><Button variant="blue" className="gap-2"><Plus className="h-4 w-4" />New Audit</Button></DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Inventory Audit / Stock Count</DialogTitle><DialogDescription>Enter physical quantities found in the store</DialogDescription></DialogHeader>
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Store to Count</Label>
                  <Select value={form.store_id} onValueChange={(v) => setForm({ ...form, store_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select store" /></SelectTrigger>
                    <SelectContent>{stores.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="flex items-end"><Button variant="secondary" onClick={startNewCount} disabled={!form.store_id}>Load Items</Button></div>
              </div>

              {form.counts.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>System Qty</TableHead>
                      <TableHead>Physical Qty</TableHead>
                      <TableHead>Variance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {form.counts.map((c, idx) => {
                      const item = items.find(i => i.id === c.item_id);
                      const variance = c.counted_quantity - c.system_quantity;
                      return (
                        <TableRow key={c.item_id}>
                          <TableCell className="font-medium">{item?.name}</TableCell>
                          <TableCell>{c.system_quantity}</TableCell>
                          <TableCell><Input type="number" className="w-24 h-8" value={c.counted_quantity} onChange={(e) => updateCount(idx, Number(e.target.value))} /></TableCell>
                          <TableCell>
                            <Badge variant={variance === 0 ? "outline" : variance > 0 ? "success" : "destructive"}>
                              {variance > 0 ? `+${variance}` : variance}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={form.counts.length === 0} variant="blue">Submit Audit</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-dashed border-2 bg-muted/20">
        <CardContent className="py-12 flex flex-col items-center justify-center text-center">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <ListChecks className="h-6 w-6 text-muted-foreground" />
          </div>
          <h4 className="font-bold text-lg">No Active Audits</h4>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1">Scheduled audits appear here. Start a new audit to perform a physical stock count.</p>
          <Button variant="outline" className="mt-6" onClick={() => setIsAddOpen(true)}>Start Cycle Count</Button>
        </CardContent>
      </Card>
    </div>
  );
}
