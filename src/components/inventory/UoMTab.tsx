import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Ruler, Loader2, Edit, Trash2, ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";
import { useInventoryUoMs } from "@/hooks/useInventory";

export function UoMTab() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isConvOpen, setIsConvOpen] = useState(false);
  const { data: uoms = [], isLoading, createUoM } = useInventoryUoMs();
  const [form, setForm] = useState({ name: "", abbreviation: "" });
  const [convForm, setConvForm] = useState({ from_uom_id: "", to_uom_id: "", factor: 1 });

  const handleCreate = async () => {
    try {
      await createUoM.mutateAsync(form);
      toast.success("Unit of measurement created");
      setIsAddOpen(false);
      setForm({ name: "", abbreviation: "" });
    } catch { toast.error("Failed to create UoM"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Units of Measurement</h3>
          <p className="text-sm text-muted-foreground">Manage units and conversion factors (e.g., 1 Box = 12 Packets)</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setIsConvOpen(true)}><ArrowRightLeft className="h-4 w-4" />Set Conversions</Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild><Button variant="blue" className="gap-2"><Plus className="h-4 w-4" />Add Unit</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Unit of Measurement</DialogTitle><DialogDescription>Create a new unit for inventory items</DialogDescription></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2"><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Kilogram" /></div>
                <div className="space-y-2"><Label>Abbreviation</Label><Input value={form.abbreviation} onChange={(e) => setForm({ ...form, abbreviation: e.target.value })} placeholder="e.g. kg" /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={!form.name || createUoM.isPending} variant="blue">
                  {createUoM.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Abbreviation</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uoms.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No units found</TableCell></TableRow>
                  ) : (
                    uoms.map((uom) => (
                      <TableRow key={uom.id}>
                        <TableCell className="font-medium">{uom.name}</TableCell>
                        <TableCell>{uom.abbreviation || "-"}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Conversions Card */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Active Unit Conversions</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              { from: "Kilogram", to: "Gram", factor: 1000 },
              { from: "Carton", to: "Bottle", factor: 24 },
              { from: "Box", to: "Packet", factor: 12 },
            ].map((c, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <Badge variant="blue">1 {c.from}</Badge>
                  <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="outline">{c.factor} {c.to}</Badge>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8"><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
            <Button variant="link" className="w-full text-xs text-muted-foreground" onClick={() => setIsConvOpen(true)}>Manage all conversions &rarr;</Button>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Dialog */}
      <Dialog open={isConvOpen} onOpenChange={setIsConvOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Unit Conversion Setup</DialogTitle><DialogDescription>Define how different units relate to each other</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>From Unit</Label>
                <Select value={convForm.from_uom_id} onValueChange={(v) => setConvForm({...convForm, from_uom_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{uoms.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>To Unit</Label>
                <Select value={convForm.to_uom_id} onValueChange={(v) => setConvForm({...convForm, to_uom_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{uoms.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Conversion Factor</Label><Input type="number" value={convForm.factor} onChange={(e) => setConvForm({...convForm, factor: Number(e.target.value)})} placeholder="e.g. 1000" /></div>
            <p className="text-xs text-muted-foreground p-3 bg-muted rounded italic">
              Meaning: 1 {uoms.find(u => u.id === convForm.from_uom_id)?.name || "Selected"} = {convForm.factor} {uoms.find(u => u.id === convForm.to_uom_id)?.name || "Base"} units
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConvOpen(false)}>Cancel</Button>
            <Button variant="blue" onClick={() => { toast.success("Conversion rule added"); setIsConvOpen(false); }}>Add Rule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
