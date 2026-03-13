import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Loader2, Truck } from "lucide-react";
import { toast } from "sonner";
import { useSuppliers, useInventoryItems } from "@/hooks/useInventory";

export function SuppliersTab() {
  const { data: suppliers = [], createSupplier, updateSupplier } = useSuppliers();
  const { data: items = [] } = useInventoryItems();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const emptyForm = { name: "", contact_person: "", email: "", phone: "", address: "", payment_terms: "", notes: "", is_active: true };
  const [form, setForm] = useState(emptyForm);

  const getItemCount = (supplierId: string) => items.filter((i) => i.supplier_id === supplierId).length;

  const handleSave = async () => {
    try {
      const payload: any = { ...form };
      Object.keys(payload).forEach((k) => { if (payload[k] === "") payload[k] = null; });
      payload.name = form.name;
      payload.is_active = form.is_active;

      if (editId) {
        await updateSupplier.mutateAsync({ id: editId, ...payload });
        toast.success("Supplier updated");
      } else {
        await createSupplier.mutateAsync(payload);
        toast.success("Supplier created");
      }
      setOpen(false);
      setEditId(null);
      setForm(emptyForm);
    } catch { toast.error("Failed to save supplier"); }
  };

  const openEdit = (s: any) => {
    setEditId(s.id);
    setForm({ name: s.name, contact_person: s.contact_person || "", email: s.email || "", phone: s.phone || "", address: s.address || "", payment_terms: s.payment_terms || "", notes: s.notes || "", is_active: s.is_active });
    setOpen(true);
  };

  const toggleActive = async (s: any) => {
    try {
      await updateSupplier.mutateAsync({ id: s.id, is_active: !s.is_active });
      toast.success(s.is_active ? "Supplier deactivated" : "Supplier activated");
    } catch { toast.error("Failed to update supplier"); }
  };

  return (
    <Card variant="elevated">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div><CardTitle className="flex items-center gap-2"><Truck className="h-5 w-5" />Suppliers</CardTitle><CardDescription>{suppliers.length} registered</CardDescription></div>
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditId(null); setForm(emptyForm); } }}>
            <DialogTrigger asChild><Button variant="blue" className="gap-2"><Plus className="h-4 w-4" />Add Supplier</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>{editId ? "Edit" : "Add"} Supplier</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2"><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div className="space-y-2"><Label>Contact Person</Label><Input value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} /></div>
                <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div className="col-span-2 space-y-2"><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
                <div className="space-y-2"><Label>Payment Terms</Label><Input value={form.payment_terms} onChange={(e) => setForm({ ...form, payment_terms: e.target.value })} placeholder="e.g. Net 30" /></div>
                <div className="col-span-2 space-y-2"><Label>Notes</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={!form.name || createSupplier.isPending || updateSupplier.isPending}>
                  {(createSupplier.isPending || updateSupplier.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editId ? "Save" : "Create"}
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
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Terms</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No suppliers yet</TableCell></TableRow>
            ) : (
              suppliers.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.contact_person || "-"}</TableCell>
                  <TableCell>{s.email || "-"}</TableCell>
                  <TableCell>{s.phone || "-"}</TableCell>
                  <TableCell>{getItemCount(s.id)}</TableCell>
                  <TableCell>{s.payment_terms || "-"}</TableCell>
                  <TableCell>
                    <Badge className={s.is_active ? "bg-success/20 text-success cursor-pointer" : "bg-muted text-muted-foreground cursor-pointer"} onClick={() => toggleActive(s)}>
                      {s.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell><Button variant="ghost" size="sm" onClick={() => openEdit(s)}><Edit className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
