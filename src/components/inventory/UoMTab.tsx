import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Ruler, Loader2, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useInventoryUoMs } from "@/hooks/useInventory";

export function UoMTab() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const { data: uoms = [], isLoading, createUoM } = useInventoryUoMs();
  const [form, setForm] = useState({ name: "", abbreviation: "" });

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
          <p className="text-sm text-muted-foreground">Manage units and conversion factors</p>
        </div>
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
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {uoms.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No units found</TableCell></TableRow>
                ) : (
                  uoms.map((uom) => (
                    <TableRow key={uom.id}>
                      <TableCell className="font-medium">{uom.name}</TableCell>
                      <TableCell>{uom.abbreviation || "-"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(uom.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
