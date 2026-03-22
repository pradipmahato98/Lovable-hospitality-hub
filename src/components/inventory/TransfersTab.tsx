import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Loader2, ArrowRightLeft, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useInventoryTransactionService } from "@/hooks/inventory/useInventoryTransactionService";
import { useItemService } from "@/hooks/inventory/useItemService";
import { useStoreService } from "@/hooks/inventory/useStoreService";
import { formatAD } from "@/lib/utils";

export function TransfersTab() {
  const { transfers, createMovement } = useInventoryTransactionService();
  const { items } = useItemService();
  const { stores } = useStoreService();
  const transfersData = transfers.data || [];
  const itemsData = items.data || [];
  const storesData = stores.data || [];

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ item_id: "", quantity: 1, from_store: "", to_store: "", notes: "" });

  const handleCreate = async () => {
    if (!form.item_id || !form.from_store || !form.to_store) { toast.error("Fill all required fields"); return; }
    if (form.from_store === form.to_store) { toast.error("Stores must differ"); return; }
    try {
      await createMovement.mutateAsync({
        item_id: form.item_id,
        quantity: Number(form.quantity),
        movement_type: 'transfer',
        from_location: form.from_store, // Using store_id as location
        to_location: form.to_store,
        notes: form.notes || undefined
      });
      toast.success("Transfer movement recorded");
      setOpen(false);
      setForm({ item_id: "", quantity: 1, from_store: "", to_store: "", notes: "" });
    } catch { toast.error("Failed to create transfer"); }
  };

  const statusColor = (s: string) => s === "completed" ? "bg-success/20 text-success" : s === "cancelled" ? "bg-destructive/20 text-destructive" : "bg-amber-500/20 text-amber-400";

  return (
    <Card variant="elevated">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div><CardTitle className="flex items-center gap-2"><ArrowRightLeft className="h-5 w-5" />Stock Transfers</CardTitle><CardDescription>{transfersData.length} transfers</CardDescription></div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button variant="blue" className="gap-2"><Plus className="h-4 w-4" />New Transfer</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Stock Transfer</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2"><Label>Item *</Label>
                  <Select value={form.item_id} onValueChange={(v) => setForm({ ...form, item_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger>
                    <SelectContent>{itemsData.map((it: any) => <SelectItem key={it.item_id} value={it.item_id}>{it.item_name} ({it.current_stock} {it.unit?.unit_symbol})</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Quantity</Label><Input type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>From Store *</Label>
                    <Select value={form.from_store} onValueChange={(v) => setForm({ ...form, from_store: v })}>
                      <SelectTrigger><SelectValue placeholder="From" /></SelectTrigger>
                      <SelectContent>{storesData.map((s: any) => <SelectItem key={s.store_id} value={s.store_id}>{s.store_name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>To Store *</Label>
                    <Select value={form.to_store} onValueChange={(v) => setForm({ ...form, to_store: v })}>
                      <SelectTrigger><SelectValue placeholder="To" /></SelectTrigger>
                      <SelectContent>{storesData.map((s: any) => <SelectItem key={s.store_id} value={s.store_id}>{s.store_name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2"><Label>Notes</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={createMovement.isPending}>
                  {createMovement.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Transfer #</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>From → To</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transfersData.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No transfers yet</TableCell></TableRow>
            ) : (
              transfersData.map((t: any) => (
                <TableRow key={t.transfer_id || t.movement_id}>
                  <TableCell className="font-mono">{t.transfer_number || t.movement_id.split('-')[0]}</TableCell>
                  <TableCell className="font-medium">{t.item?.item_name || "-"}</TableCell>
                  <TableCell>{t.quantity} {t.item?.unit?.unit_symbol}</TableCell>
                  <TableCell>{t.from?.store_name || t.from_location} → {t.to?.store_name || t.to_location}</TableCell>
                  <TableCell>{formatAD(new Date(t.transfer_date || t.movement_date))}</TableCell>
                  <TableCell><Badge className={statusColor(t.status || 'completed')}>{t.status || 'completed'}</Badge></TableCell>
                  <TableCell>
                    {t.status === "pending" && (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm"><Check className="h-4 w-4 text-success" /></Button>
                        <Button variant="ghost" size="sm"><X className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
