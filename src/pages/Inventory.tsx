import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Search, Plus, Package, AlertTriangle, TrendingUp, TrendingDown,
  Warehouse, Truck, ArrowUpDown, RefreshCw, Loader2, DollarSign
} from "lucide-react";
import { toast } from "sonner";
import { 
  useInventoryItems, useInventoryCategories, useSuppliers, 
  usePurchaseOrders, useStockMovements, useInventoryStats 
} from "@/hooks/useInventory";
import { format } from "date-fns";

const Inventory = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showLowStock, setShowLowStock] = useState(false);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [adjustStockOpen, setAdjustStockOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const { data: items = [], isLoading, createItem, adjustStock } = useInventoryItems({ 
    category: categoryFilter !== "all" ? categoryFilter : undefined,
    lowStock: showLowStock 
  });
  const { data: categories = [] } = useInventoryCategories();
  const { data: suppliers = [] } = useSuppliers();
  const { data: purchaseOrders = [] } = usePurchaseOrders();
  const { data: movements = [] } = useStockMovements();
  const stats = useInventoryStats();

  const [newItem, setNewItem] = useState({
    name: "",
    sku: "",
    category_id: "",
    supplier_id: "",
    unit: "pieces",
    current_stock: 0,
    min_stock: 0,
    reorder_point: 0,
    cost_price: 0,
    department: "",
  });

  const [stockAdjustment, setStockAdjustment] = useState({
    quantity: 0,
    type: "in" as "in" | "out" | "adjustment",
    notes: "",
  });

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateItem = async () => {
    try {
      await createItem.mutateAsync(newItem as any);
      toast.success("Item created successfully");
      setAddItemOpen(false);
      setNewItem({ name: "", sku: "", category_id: "", supplier_id: "", unit: "pieces", current_stock: 0, min_stock: 0, reorder_point: 0, cost_price: 0, department: "" });
    } catch (error) {
      toast.error("Failed to create item");
    }
  };

  const handleAdjustStock = async () => {
    if (!selectedItem) return;
    try {
      await adjustStock.mutateAsync({ itemId: selectedItem, ...stockAdjustment });
      toast.success("Stock adjusted successfully");
      setAdjustStockOpen(false);
      setSelectedItem(null);
      setStockAdjustment({ quantity: 0, type: "in", notes: "" });
    } catch (error) {
      toast.error("Failed to adjust stock");
    }
  };

  const getStockStatus = (current: number, min: number, reorder: number) => {
    if (current === 0) return { label: "Out of Stock", color: "bg-destructive/20 text-destructive" };
    if (current <= reorder) return { label: "Low Stock", color: "bg-amber-500/20 text-amber-400" };
    return { label: "In Stock", color: "bg-success/20 text-success" };
  };

  return (
    <MainLayout title="Inventory Management" subtitle="Track stock, suppliers, and purchase orders">
      <Tabs defaultValue="items" className="space-y-6">
        <TabsList>
          <TabsTrigger value="items" className="gap-2">
            <Package className="h-4 w-4" />
            Items
          </TabsTrigger>
          <TabsTrigger value="suppliers" className="gap-2">
            <Truck className="h-4 w-4" />
            Suppliers
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-2">
            <Warehouse className="h-4 w-4" />
            Purchase Orders
          </TabsTrigger>
          <TabsTrigger value="movements" className="gap-2">
            <ArrowUpDown className="h-4 w-4" />
            Stock Movements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Items</p>
                    <p className="text-2xl font-bold">{stats.totalItems}</p>
                  </div>
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:border-amber-500/50" onClick={() => setShowLowStock(!showLowStock)}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Low Stock</p>
                    <p className="text-2xl font-bold text-amber-500">{stats.lowStock}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-amber-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Out of Stock</p>
                    <p className="text-2xl font-bold text-destructive">{stats.outOfStock}</p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-destructive" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Value</p>
                    <p className="text-2xl font-bold text-primary">${stats.totalValue.toLocaleString()}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters & Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex flex-wrap gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-48"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                variant={showLowStock ? "secondary" : "outline"} 
                size="sm"
                onClick={() => setShowLowStock(!showLowStock)}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Low Stock Only
              </Button>
            </div>
            <Dialog open={addItemOpen} onOpenChange={setAddItemOpen}>
              <DialogTrigger asChild>
                <Button variant="gold" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add Inventory Item</DialogTitle>
                  <DialogDescription>Add a new item to your inventory</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>SKU</Label>
                    <Input value={newItem.sku} onChange={(e) => setNewItem({ ...newItem, sku: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={newItem.category_id} onValueChange={(v) => setNewItem({ ...newItem, category_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Supplier</Label>
                    <Select value={newItem.supplier_id} onValueChange={(v) => setNewItem({ ...newItem, supplier_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {suppliers.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Unit</Label>
                    <Input value={newItem.unit} onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Initial Stock</Label>
                    <Input type="number" value={newItem.current_stock} onChange={(e) => setNewItem({ ...newItem, current_stock: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Min Stock</Label>
                    <Input type="number" value={newItem.min_stock} onChange={(e) => setNewItem({ ...newItem, min_stock: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Reorder Point</Label>
                    <Input type="number" value={newItem.reorder_point} onChange={(e) => setNewItem({ ...newItem, reorder_point: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Cost Price</Label>
                    <Input type="number" value={newItem.cost_price} onChange={(e) => setNewItem({ ...newItem, cost_price: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Input value={newItem.department} onChange={(e) => setNewItem({ ...newItem, department: e.target.value })} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAddItemOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateItem} disabled={!newItem.name || createItem.isPending}>
                    {createItem.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Add Item
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Items Table */}
          <Card variant="elevated">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No items found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredItems.map((item) => {
                        const status = getStockStatus(item.current_stock, item.min_stock, item.reorder_point);
                        return (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{item.name}</p>
                                <p className="text-xs text-muted-foreground">{item.sku || "No SKU"}</p>
                              </div>
                            </TableCell>
                            <TableCell>{item.category?.name || "-"}</TableCell>
                            <TableCell>
                              <span className="font-semibold">{item.current_stock}</span>
                              <span className="text-muted-foreground text-sm ml-1">{item.unit}</span>
                            </TableCell>
                            <TableCell>
                              <Badge className={status.color}>{status.label}</Badge>
                            </TableCell>
                            <TableCell>${item.cost_price.toFixed(2)}</TableCell>
                            <TableCell className="font-medium">${(item.current_stock * item.cost_price).toFixed(2)}</TableCell>
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => { setSelectedItem(item.id); setAdjustStockOpen(true); }}
                              >
                                <ArrowUpDown className="h-4 w-4 mr-1" />
                                Adjust
                              </Button>
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

          {/* Adjust Stock Dialog */}
          <Dialog open={adjustStockOpen} onOpenChange={setAdjustStockOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adjust Stock</DialogTitle>
                <DialogDescription>Record a stock adjustment</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={stockAdjustment.type} onValueChange={(v: "in" | "out" | "adjustment") => setStockAdjustment({ ...stockAdjustment, type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in">Stock In (Received)</SelectItem>
                      <SelectItem value="out">Stock Out (Used)</SelectItem>
                      <SelectItem value="adjustment">Adjustment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input type="number" value={stockAdjustment.quantity} onChange={(e) => setStockAdjustment({ ...stockAdjustment, quantity: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Input value={stockAdjustment.notes} onChange={(e) => setStockAdjustment({ ...stockAdjustment, notes: e.target.value })} placeholder="Reason for adjustment..." />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAdjustStockOpen(false)}>Cancel</Button>
                <Button onClick={handleAdjustStock} disabled={adjustStock.isPending}>
                  {adjustStock.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="suppliers">
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Suppliers</CardTitle>
              <CardDescription>{suppliers.length} suppliers registered</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliers.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>{s.contact_person || "-"}</TableCell>
                      <TableCell>{s.email || "-"}</TableCell>
                      <TableCell>{s.phone || "-"}</TableCell>
                      <TableCell>
                        <Badge className={s.is_active ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"}>
                          {s.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card variant="elevated">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Purchase Orders</CardTitle>
                  <CardDescription>{purchaseOrders.length} orders</CardDescription>
                </div>
                <Button variant="gold" className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Order
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No purchase orders yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    purchaseOrders.map((po) => (
                      <TableRow key={po.id}>
                        <TableCell className="font-mono">{po.order_number}</TableCell>
                        <TableCell>{po.supplier?.name || "-"}</TableCell>
                        <TableCell>{formatAD(new Date(po.order_date))}</TableCell>
                        <TableCell>
                          <Badge className={
                            po.status === "received" ? "bg-success/20 text-success" :
                            po.status === "sent" ? "bg-blue-500/20 text-blue-400" :
                            "bg-muted text-muted-foreground"
                          }>
                            {po.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">${po.total.toFixed(2)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements">
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Stock Movements</CardTitle>
              <CardDescription>Recent inventory changes</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No movements recorded
                      </TableCell>
                    </TableRow>
                  ) : (
                    movements.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell>{formatAD(new Date(m.created_at), "time")}</TableCell>
                        <TableCell>{(m.item as any)?.name || "-"}</TableCell>
                        <TableCell>
                          <Badge className={
                            m.movement_type === "in" ? "bg-success/20 text-success" :
                            m.movement_type === "out" ? "bg-destructive/20 text-destructive" :
                            "bg-muted text-muted-foreground"
                          }>
                            {m.movement_type === "in" ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                            {m.movement_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{m.quantity}</TableCell>
                        <TableCell className="text-muted-foreground">{m.notes || "-"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
};

export default Inventory;
