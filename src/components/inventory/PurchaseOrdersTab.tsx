import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Loader2, Warehouse, PackageCheck, Eye, X, CheckCircle, ShieldAlert, Calendar } from "lucide-react";
import { toast } from "sonner";
import { usePurchaseOrders, useSuppliers, useInventoryItems, PurchaseOrder } from "@/hooks/useInventory";
import { formatAD, formatCurrency } from "@/lib/utils";

interface POLineItem { item_id: string; quantity: number; unit_price: number; }

export function PurchaseOrdersTab() {
  const { data: orders = [], createPurchaseOrder, updatePurchaseOrderStatus, receivePurchaseOrder } = usePurchaseOrders();
  const { data: suppliers = [] } = useSuppliers();
  const { data: items = [] } = useInventoryItems();

  const [createOpen, setCreateOpen] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  const [form, setForm] = useState({ supplier_id: "", expected_delivery: "", notes: "" });
  const [lineItems, setLineItems] = useState<POLineItem[]>([{ item_id: "", quantity: 1, unit_price: 0 }]);

  // GRN State
  const [receiveData, setReceiveData] = useState<Record<string, { qty: number, batch: string, expiry: string, damaged: number, quality: string }>>({});

  const subtotal = lineItems.reduce((s, li) => s + li.quantity * li.unit_price, 0);
  const taxAmount = subtotal * 0.13;
  const total = subtotal + taxAmount;

  const addLine = () => setLineItems([...lineItems, { item_id: "", quantity: 1, unit_price: 0 }]);
  const removeLine = (i: number) => setLineItems(lineItems.filter((_, idx) => idx !== i));
  const updateLine = (i: number, field: string, value: any) => {
    const updated = [...lineItems];
    (updated[i] as any)[field] = value;
    if (field === "item_id") {
      const item = items.find((it) => it.id === value);
      if (item) updated[i].unit_price = item.cost_price;
    }
    setLineItems(updated);
  };

  const handleCreate = async () => {
    try {
      const validLines = lineItems.filter((l) => l.item_id && l.quantity > 0);
      if (!form.supplier_id || validLines.length === 0) { toast.error("Select supplier and add items"); return; }
      await createPurchaseOrder.mutateAsync({
        supplier_id: form.supplier_id,
        expected_delivery: form.expected_delivery || null,
        notes: form.notes || null,
        subtotal, tax_amount: taxAmount, total,
        status: "draft",
        items: validLines,
      } as any);
      toast.success("Purchase order created");
      setCreateOpen(false);
      setForm({ supplier_id: "", expected_delivery: "", notes: "" });
      setLineItems([{ item_id: "", quantity: 1, unit_price: 0 }]);
    } catch { toast.error("Failed to create PO"); }
  };

  const openReceive = (po: PurchaseOrder) => {
    setSelectedPO(po);
    const initialData: any = {};
    po.items?.forEach((pi) => {
      initialData[pi.id] = {
        qty: pi.quantity - (pi.received_quantity || 0),
        batch: "",
        expiry: "",
        damaged: 0,
        quality: "passed"
      };
    });
    setReceiveData(initialData);
    setReceiveOpen(true);
  };

  const handleReceive = async () => {
    if (!selectedPO?.items) return;
    try {
      const receivedItems = selectedPO.items.map((pi) => ({
        poItemId: pi.id,
        itemId: pi.item_id,
        receivedQty: receiveData[pi.id]?.qty || 0,
        batchNumber: receiveData[pi.id]?.batch,
        expiryDate: receiveData[pi.id]?.expiry,
        damagedQty: receiveData[pi.id]?.damaged || 0,
        qualityStatus: receiveData[pi.id]?.quality || 'passed'
      }));

      // Filter out items with 0 received quantity
      const filteredReceived = receivedItems.filter(ri => ri.receivedQty > 0 || ri.damagedQty > 0);

      await receivePurchaseOrder.mutateAsync({ poId: selectedPO.id, receivedItems: filteredReceived });
      toast.success("GRN Processed Successfully — Stock levels and batch info updated");
      setReceiveOpen(false);
    } catch { toast.error("Failed to process GRN"); }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updatePurchaseOrderStatus.mutateAsync({ id, status });
      toast.success(`Status updated to ${status}`);
    } catch { toast.error("Failed to update status"); }
  };

  return (
    <Card variant="elevated">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div><CardTitle className="flex items-center gap-2"><Warehouse className="h-5 w-5" />Purchase Orders & GRN</CardTitle><CardDescription>Manage procurement lifecycle and warehouse receiving</CardDescription></div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild><Button variant="blue" className="gap-2"><Plus className="h-4 w-4" />New Order</Button></DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Create Purchase Order</DialogTitle><DialogDescription>Select supplier and add items</DialogDescription></DialogHeader>
              <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Supplier *</Label>
                    <Select value={form.supplier_id} onValueChange={(v) => setForm({ ...form, supplier_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                      <SelectContent>{suppliers.filter((s) => s.is_active).map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Expected Delivery</Label><Input type="date" value={form.expected_delivery} onChange={(e) => setForm({ ...form, expected_delivery: e.target.value })} /></div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between"><Label>Line Items</Label><Button variant="outline" size="sm" onClick={addLine}><Plus className="h-3 w-3 mr-1" />Add</Button></div>
                  {lineItems.map((li, i) => (
                    <div key={i} className="grid grid-cols-[1fr_80px_100px_32px] gap-2 items-end">
                      <Select value={li.item_id} onValueChange={(v) => updateLine(i, "item_id", v)}>
                        <SelectTrigger><SelectValue placeholder="Item" /></SelectTrigger>
                        <SelectContent>{items.map((it) => <SelectItem key={it.id} value={it.id}>{it.name}</SelectItem>)}</SelectContent>
                      </Select>
                      <Input type="number" min={1} value={li.quantity} onChange={(e) => updateLine(i, "quantity", Number(e.target.value))} placeholder="Qty" />
                      <Input type="number" min={0} value={li.unit_price} onChange={(e) => updateLine(i, "unit_price", Number(e.target.value))} placeholder="Price" />
                      {lineItems.length > 1 && <Button variant="ghost" size="sm" onClick={() => removeLine(i)}><X className="h-4 w-4" /></Button>}
                    </div>
                  ))}
                </div>

                <div className="bg-muted/50 p-3 rounded-lg space-y-1 text-sm">
                  <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                  <div className="flex justify-between font-bold border-t pt-1"><span>Total (incl. estimated tax)</span><span>{formatCurrency(total)}</span></div>
                </div>

                <div className="space-y-2"><Label>Notes</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={createPurchaseOrder.isPending} variant="blue">
                  {createPurchaseOrder.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Create Order
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
              <TableHead>Order #</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Expected</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Total</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No purchase orders yet</TableCell></TableRow>
            ) : (
              orders.map((po) => (
                <TableRow key={po.id}>
                  <TableCell className="font-mono font-bold text-primary">{po.order_number}</TableCell>
                  <TableCell>{po.supplier?.name || "-"}</TableCell>
                  <TableCell className="text-xs">{formatAD(new Date(po.order_date))}</TableCell>
                  <TableCell className="text-xs">{po.expected_delivery ? formatAD(new Date(po.expected_delivery)) : "-"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn(
                      po.status === 'received' ? "bg-success/10 text-success border-success/20" :
                      po.status === 'sent' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : ""
                    )}>{po.status.replace("_", " ")}</Badge>
                  </TableCell>
                  <TableCell className="font-bold">{formatCurrency(po.total)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setSelectedPO(po); setDetailOpen(true); }}><Eye className="h-4 w-4" /></Button>
                      {po.status === "draft" && <Button variant="blue" size="sm" onClick={() => handleStatusChange(po.id, "sent")}>Send</Button>}
                      {(po.status === "sent" || po.status === "partially_received") && (
                        <Button variant="success" size="sm" onClick={() => openReceive(po)}><PackageCheck className="h-4 w-4 mr-1" />GRN</Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Purchase Order Details: {selectedPO?.order_number}</DialogTitle></DialogHeader>
          <div className="py-4">
             <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-muted/30 rounded-lg text-sm">
                <div><span className="text-muted-foreground">Supplier:</span> <span className="font-semibold">{selectedPO?.supplier?.name}</span></div>
                <div><span className="text-muted-foreground">Status:</span> <Badge variant="outline" className="ml-2">{selectedPO?.status}</Badge></div>
                <div><span className="text-muted-foreground">Date:</span> {selectedPO?.order_date}</div>
                <div><span className="text-muted-foreground">Expected:</span> {selectedPO?.expected_delivery || 'N/A'}</div>
             </div>
             {selectedPO?.items && (
              <Table>
                <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Ordered</TableHead><TableHead>Price</TableHead><TableHead>Recv</TableHead><TableHead>Total</TableHead></TableRow></TableHeader>
                <TableBody>
                  {selectedPO.items.map((pi) => (
                    <TableRow key={pi.id}>
                      <TableCell>{pi.item?.name || "-"}</TableCell>
                      <TableCell className="font-semibold">{pi.quantity}</TableCell>
                      <TableCell className="text-xs">{formatCurrency(pi.unit_price)}</TableCell>
                      <TableCell><Badge variant="secondary">{pi.received_quantity || 0}</Badge></TableCell>
                      <TableCell className="font-bold text-xs">{formatCurrency(pi.quantity * pi.unit_price)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Advanced GRN Dialog */}
      <Dialog open={receiveOpen} onOpenChange={setReceiveOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Goods Receiving Note (GRN) — PO {selectedPO?.order_number}</DialogTitle><DialogDescription>Verify received items, record batch numbers, and inspect quality</DialogDescription></DialogHeader>
          <div className="space-y-6 py-4">
            {selectedPO?.items?.map((pi) => (
              <div key={pi.id} className="border p-4 rounded-xl bg-muted/20 space-y-4">
                <div className="flex justify-between items-start border-b pb-2">
                  <div>
                    <h4 className="font-bold text-base flex items-center gap-2 text-primary"><PackageCheck className="h-4 w-4" /> {pi.item?.name}</h4>
                    <p className="text-xs text-muted-foreground">Ordered: {pi.quantity} · Already received: {pi.received_quantity || 0}</p>
                  </div>
                  <div className="text-right">
                    <Label className="text-xs mb-1 block">Good Qty Received</Label>
                    <Input type="number" className="w-32 h-10 text-center font-bold" min={0}
                      value={receiveData[pi.id]?.qty || 0}
                      onChange={(e) => setReceiveData({ ...receiveData, [pi.id]: { ...receiveData[pi.id], qty: Number(e.target.value) } })} />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Batch / Lot #</Label>
                    <Input className="h-8 text-xs" value={receiveData[pi.id]?.batch || ""} placeholder="B-XXXX"
                      onChange={(e) => setReceiveData({ ...receiveData, [pi.id]: { ...receiveData[pi.id], batch: e.target.value } })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> Expiry Date</Label>
                    <Input type="date" className="h-8 text-xs" value={receiveData[pi.id]?.expiry || ""}
                      onChange={(e) => setReceiveData({ ...receiveData, [pi.id]: { ...receiveData[pi.id], expiry: e.target.value } })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1"><ShieldAlert className="h-3 w-3" /> Damaged Qty</Label>
                    <Input type="number" className="h-8 text-xs" value={receiveData[pi.id]?.damaged || 0}
                      onChange={(e) => setReceiveData({ ...receiveData, [pi.id]: { ...receiveData[pi.id], damaged: Number(e.target.value) } })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Quality Status</Label>
                    <Select value={receiveData[pi.id]?.quality || "passed"} onValueChange={(v) => setReceiveData({ ...receiveData, [pi.id]: { ...receiveData[pi.id], quality: v } })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="passed">Passed</SelectItem>
                        <SelectItem value="pending">Pending Insp.</SelectItem>
                        <SelectItem value="failed">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReceiveOpen(false)}>Cancel</Button>
            <Button onClick={handleReceive} disabled={receivePurchaseOrder.isPending} variant="blue" className="gap-2">
              {receivePurchaseOrder.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Process GRN & Update Inventory
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
