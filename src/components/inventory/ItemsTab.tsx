import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Package, AlertTriangle, TrendingDown, ArrowUpDown, Loader2, Edit, Trash2, DollarSign, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { useInventoryItems, useInventoryCategories, useSuppliers, useInventoryStats, useInventoryUoMs, InventoryItem } from "@/hooks/useInventory";
import { formatCurrency } from "@/lib/utils";

export function ItemsTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showLowStock, setShowLowStock] = useState(false);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [editItemOpen, setEditItemOpen] = useState(false);
  const [adjustStockOpen, setAdjustStockOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const { data: items = [], isLoading, createItem, updateItem, deactivateItem, adjustStock } = useInventoryItems({
    category: categoryFilter !== "all" ? categoryFilter : undefined,
    lowStock: showLowStock,
  });
  const { data: categories = [] } = useInventoryCategories();
  const { data: suppliers = [] } = useSuppliers();
  const { data: uoms = [] } = useInventoryUoMs();
  const stats = useInventoryStats();

  const emptyForm = {
    name: "", sku: "", category_id: "", supplier_id: "", uom_id: "", unit: "pieces",
    current_stock: 0, min_stock: 0, max_stock: 0, reorder_point: 0,
    cost_price: 0, selling_price: 0, location: "", department: "",
    item_type: "consumable", shelf_life: "", storage_instructions: "", image_url: ""
  };
  const [form, setForm] = useState(emptyForm);
  const [stockAdj, setStockAdj] = useState({ quantity: 0, type: "in" as "in" | "out" | "adjustment", notes: "" });

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = async () => {
    try {
      const payload: any = { ...form };
      if (!payload.category_id) delete payload.category_id;
      if (!payload.supplier_id) delete payload.supplier_id;
      if (!payload.uom_id) delete payload.uom_id;
      if (!payload.location) payload.location = null;
      if (!payload.max_stock) payload.max_stock = null;
      if (!payload.selling_price) payload.selling_price = null;
      await createItem.mutateAsync(payload);
      toast.success("Item created");
      setAddItemOpen(false);
      setForm(emptyForm);
    } catch { toast.error("Failed to create item"); }
  };

  const handleUpdate = async () => {
    if (!selectedItem) return;
    try {
      const payload: any = { id: selectedItem.id, ...form };
      if (!payload.category_id) payload.category_id = null;
      if (!payload.supplier_id) payload.supplier_id = null;
      if (!payload.uom_id) payload.uom_id = null;
      if (!payload.location) payload.location = null;
      if (!payload.max_stock) payload.max_stock = null;
      if (!payload.selling_price) payload.selling_price = null;
      await updateItem.mutateAsync(payload);
      toast.success("Item updated");
      setEditItemOpen(false);
    } catch { toast.error("Failed to update item"); }
  };

  const handleDeactivate = async (id: string) => {
    try {
      await deactivateItem.mutateAsync(id);
      toast.success("Item deactivated");
    } catch { toast.error("Failed to deactivate item"); }
  };

  const handleAdjustStock = async () => {
    if (!selectedItem) return;
    try {
      await adjustStock.mutateAsync({ itemId: selectedItem.id, ...stockAdj });
      toast.success("Stock adjusted");
      setAdjustStockOpen(false);
      setStockAdj({ quantity: 0, type: "in", notes: "" });
    } catch { toast.error("Failed to adjust stock"); }
  };

  const openEdit = (item: InventoryItem) => {
    setSelectedItem(item);
    setForm({
      name: item.name, sku: item.sku || "", category_id: item.category_id || "",
      supplier_id: item.supplier_id || "", uom_id: item.uom_id || "",
      unit: item.unit, current_stock: item.current_stock, min_stock: item.min_stock,
      max_stock: item.max_stock || 0, reorder_point: item.reorder_point,
      cost_price: item.cost_price, selling_price: item.selling_price || 0,
      location: item.location || "", department: item.department || "",
      item_type: item.item_type || "consumable", shelf_life: item.shelf_life || "",
      storage_instructions: item.storage_instructions || "", image_url: item.image_url || ""
    });
    setEditItemOpen(true);
  };

  const getStockStatus = (current: number, min: number, reorder: number) => {
    if (current === 0) return { label: "Out of Stock", color: "bg-destructive/20 text-destructive" };
    if (current <= reorder) return { label: "Low Stock", color: "bg-amber-500/20 text-amber-400" };
    return { label: "In Stock", color: "bg-success/20 text-success" };
  };

  const ItemForm = ({ onSubmit, isPending, submitLabel }: { onSubmit: () => void; isPending: boolean; submitLabel: string }) => (
    <>
      <div className="grid grid-cols-2 gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
        <div className="space-y-2 col-span-2"><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div className="space-y-2"><Label>SKU</Label><Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></div>
        <div className="space-y-2"><Label>Item Type</Label>
          <Select value={form.item_type} onValueChange={(v) => setForm({ ...form, item_type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="consumable">Consumable</SelectItem>
              <SelectItem value="asset">Asset</SelectItem>
              <SelectItem value="raw_material">Raw Material</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2"><Label>Category</Label>
          <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2"><Label>Unit of Measure</Label>
          <Select value={form.uom_id} onValueChange={(v) => setForm({ ...form, uom_id: v })}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{uoms.map((u) => <SelectItem key={u.id} value={u.id}>{u.name} ({u.abbreviation})</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2"><Label>Supplier</Label>
          <Select value={form.supplier_id} onValueChange={(v) => setForm({ ...form, supplier_id: v })}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2"><Label>Department</Label><Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></div>
        <div className="space-y-2"><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
        <div className="space-y-2"><Label>Shelf Life</Label><Input value={form.shelf_life} onChange={(e) => setForm({ ...form, shelf_life: e.target.value })} placeholder="e.g. 6 months" /></div>

        <div className="space-y-2 border-t pt-4 mt-2 col-span-2 text-sm font-semibold">Stock & Pricing</div>
        <div className="space-y-2"><Label>Current Stock</Label><Input type="number" value={form.current_stock} onChange={(e) => setForm({ ...form, current_stock: Number(e.target.value) })} /></div>
        <div className="space-y-2"><Label>Reorder Point</Label><Input type="number" value={form.reorder_point} onChange={(e) => setForm({ ...form, reorder_point: Number(e.target.value) })} /></div>
        <div className="space-y-2"><Label>Min Stock</Label><Input type="number" value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: Number(e.target.value) })} /></div>
        <div className="space-y-2"><Label>Max Stock</Label><Input type="number" value={form.max_stock} onChange={(e) => setForm({ ...form, max_stock: Number(e.target.value) })} /></div>
        <div className="space-y-2"><Label>Cost Price</Label><Input type="number" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: Number(e.target.value) })} /></div>
        <div className="space-y-2"><Label>Selling Price</Label><Input type="number" value={form.selling_price} onChange={(e) => setForm({ ...form, selling_price: Number(e.target.value) })} /></div>

        <div className="space-y-2 col-span-2"><Label>Storage Instructions</Label><Input value={form.storage_instructions} onChange={(e) => setForm({ ...form, storage_instructions: e.target.value })} /></div>
        <div className="space-y-2 col-span-2"><Label>Image URL</Label><Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} /></div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => { setAddItemOpen(false); setEditItemOpen(false); }}>Cancel</Button>
        <Button onClick={onSubmit} disabled={!form.name || isPending} variant="blue">
          {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {submitLabel}
        </Button>
      </DialogFooter>
    </>
  );

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total Items</p><p className="text-2xl font-bold">{stats.totalItems}</p></div><Package className="h-8 w-8 text-muted-foreground" /></div></CardContent></Card>
        <Card className="cursor-pointer hover:border-amber-500/50" onClick={() => setShowLowStock(!showLowStock)}><CardContent className="pt-4"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Low Stock</p><p className="text-2xl font-bold text-amber-500">{stats.lowStock}</p></div><AlertTriangle className="h-8 w-8 text-amber-500" /></div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Out of Stock</p><p className="text-2xl font-bold text-destructive">{stats.outOfStock}</p></div><TrendingDown className="h-8 w-8 text-destructive" /></div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total Value</p><p className="text-2xl font-bold text-primary">{formatCurrency(stats.totalValue)}</p></div><DollarSign className="h-8 w-8 text-primary" /></div></CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search items..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 w-48" />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant={showLowStock ? "secondary" : "outline"} size="sm" onClick={() => setShowLowStock(!showLowStock)}>
            <AlertTriangle className="h-4 w-4 mr-2" />Low Stock Only
          </Button>
        </div>
        <Dialog open={addItemOpen} onOpenChange={(o) => { setAddItemOpen(o); if (o) setForm(emptyForm); }}>
          <DialogTrigger asChild><Button variant="blue" className="gap-2"><Plus className="h-4 w-4" />Add Item</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Add Inventory Item</DialogTitle><DialogDescription>Add a new item to your inventory</DialogDescription></DialogHeader>
            <ItemForm onSubmit={handleCreate} isPending={createItem.isPending} submitLabel="Add Item" />
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <Card variant="elevated">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No items found</TableCell></TableRow>
                ) : (
                  filteredItems.map((item) => {
                    const status = getStockStatus(item.current_stock, item.min_stock, item.reorder_point);
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded bg-muted flex items-center justify-center overflow-hidden">
                              {item.image_url ? <img src={item.image_url} alt="" className="h-full w-full object-cover" /> : <Package className="h-5 w-5 text-muted-foreground" />}
                            </div>
                            <div><p className="font-medium">{item.name}</p><p className="text-xs text-muted-foreground">{item.sku || "No SKU"} · {item.supplier?.name || "No supplier"}</p></div>
                          </div>
                        </TableCell>
                        <TableCell>{item.category?.name || "-"}</TableCell>
                        <TableCell><Badge variant="outline" className="capitalize">{item.item_type?.replace('_', ' ')}</Badge></TableCell>
                        <TableCell><span className="font-semibold">{item.current_stock}</span><span className="text-muted-foreground text-sm ml-1">{item.uom?.abbreviation || item.unit}</span></TableCell>
                        <TableCell><Badge className={status.color}>{status.label}</Badge></TableCell>
                        <TableCell>{formatCurrency(item.cost_price)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => { setSelectedItem(item); setAdjustStockOpen(true); }}><ArrowUpDown className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => openEdit(item)}><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeactivate(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editItemOpen} onOpenChange={setEditItemOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Item</DialogTitle><DialogDescription>Update item details</DialogDescription></DialogHeader>
          <ItemForm onSubmit={handleUpdate} isPending={updateItem.isPending} submitLabel="Save Changes" />
        </DialogContent>
      </Dialog>

      {/* Adjust Stock Dialog */}
      <Dialog open={adjustStockOpen} onOpenChange={setAdjustStockOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adjust Stock — {selectedItem?.name}</DialogTitle><DialogDescription>Record a stock adjustment</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Type</Label>
              <Select value={stockAdj.type} onValueChange={(v: any) => setStockAdj({ ...stockAdj, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">Stock In (Received)</SelectItem>
                  <SelectItem value="out">Stock Out (Used)</SelectItem>
                  <SelectItem value="adjustment">Adjustment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Quantity</Label><Input type="number" value={stockAdj.quantity} onChange={(e) => setStockAdj({ ...stockAdj, quantity: Number(e.target.value) })} /></div>
            <div className="space-y-2"><Label>Notes</Label><Input value={stockAdj.notes} onChange={(e) => setStockAdj({ ...stockAdj, notes: e.target.value })} placeholder="Reason for adjustment..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustStockOpen(false)}>Cancel</Button>
            <Button onClick={handleAdjustStock} disabled={adjustStock.isPending || stockAdj.quantity <= 0}>
              {adjustStock.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
