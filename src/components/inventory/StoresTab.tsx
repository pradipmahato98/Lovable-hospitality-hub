import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Store, Loader2, Edit, Trash2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useInventoryStores } from "@/hooks/useInventory";

export function StoresTab() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const { data: stores = [], isLoading, createStore, updateStore } = useInventoryStores();
  const [form, setForm] = useState({ name: "", code: "", location: "", store_type: "general" });

  const handleCreate = async () => {
    try {
      await createStore.mutateAsync(form as any);
      toast.success("Store created");
      setIsAddOpen(false);
      setForm({ name: "", code: "", location: "", store_type: "general" });
    } catch { toast.error("Failed to create store"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Stores & Warehouses</h3>
          <p className="text-sm text-muted-foreground">Manage multi-location inventory storage</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild><Button variant="blue" className="gap-2"><Plus className="h-4 w-4" />Add Store</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Store</DialogTitle><DialogDescription>Create a new storage location</DialogDescription></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label>Store Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="space-y-2"><Label>Store Code *</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. MAIN-01" /></div>
              <div className="space-y-2"><Label>Store Type</Label>
                <Select value={form.store_type} onValueChange={(v) => setForm({ ...form, store_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Store</SelectItem>
                    <SelectItem value="kitchen">Kitchen Store</SelectItem>
                    <SelectItem value="bar">Bar Store</SelectItem>
                    <SelectItem value="housekeeping">Housekeeping Store</SelectItem>
                    <SelectItem value="engineering">Engineering Store</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!form.name || !form.code || createStore.isPending} variant="blue">
                {createStore.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full flex items-center justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : stores.length === 0 ? (
          <div className="col-span-full text-center py-10 border rounded-lg bg-muted/20 text-muted-foreground">No stores configured</div>
        ) : (
          stores.map((store) => (
            <Card key={store.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
                      <Store className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-lg">{store.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{store.code}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="capitalize">{store.store_type}</Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" /> {store.location || "No location specified"}
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <Button variant="outline" size="sm">Manage Stock</Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
