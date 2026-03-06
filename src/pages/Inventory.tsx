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
  Warehouse, Truck, ArrowUpDown, RefreshCw, Loader2, DollarSign,
  PieChart as PieChartIcon, FileDown, Layers, Settings2, BarChart3
} from "lucide-react";
import { toast } from "sonner";
import { 
  useInventoryItems, useInventoryCategories, useSuppliers, 
  usePurchaseOrders, useStockMovements, useInventoryStats,
  useInventoryReportData
} from "@/hooks/useInventory";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie
} from "recharts";

const Inventory = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showLowStock, setShowLowStock] = useState(false);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [editItemOpen, setEditItemOpen] = useState(false);
  const [adjustStockOpen, setAdjustStockOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [addSupplierOpen, setAddSupplierOpen] = useState(false);
  const [editSupplierOpen, setEditSupplierOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [addPOOpen, setAddPOOpen] = useState(false);
  const [viewPOOpen, setViewPOOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<any>(null);
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [movementFilters, setMovementFilters] = useState({ itemId: "all", type: "all" });
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [editCategoryOpen, setEditCategoryOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [bulkAdjustOpen, setBulkAdjustOpen] = useState(false);

  const { data: items = [], isLoading, createItem, updateItem, deleteItem, adjustStock, bulkAdjustStock } = useInventoryItems({
    category: categoryFilter !== "all" ? categoryFilter : undefined,
    lowStock: showLowStock,
    showInactive: true
  });

  const departments = Array.from(new Set(items.map(i => i.department).filter(Boolean)));
  const { data: categories = [], createCategory, updateCategory, deleteCategory } = useInventoryCategories();
  const { data: suppliers = [], createSupplier, updateSupplier, deleteSupplier } = useSuppliers({ showInactive: true });
  const { data: purchaseOrders = [], createPurchaseOrder, updatePurchaseOrderStatus, deletePurchaseOrder } = usePurchaseOrders();
  const { data: movements = [], refetch: refetchMovements } = useStockMovements({
    itemId: movementFilters.itemId !== "all" ? movementFilters.itemId : undefined,
    type: movementFilters.type !== "all" ? movementFilters.type : undefined
  });
  const stats = useInventoryStats();
  const { data: reportData = [] } = useInventoryReportData();

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
    is_active: true,
  });

  const [newSupplier, setNewSupplier] = useState({
    name: "",
    contact_person: "",
    email: "",
    phone: "",
    address: "",
    payment_terms: "",
    notes: "",
    is_active: true,
  });

  const [stockAdjustment, setStockAdjustment] = useState({
    quantity: 0,
    type: "in" as "in" | "out" | "adjustment",
    notes: "",
  });

  const [newPO, setNewPO] = useState({
    supplier_id: "",
    order_date: format(new Date(), "yyyy-MM-dd"),
    expected_delivery: "",
    notes: "",
    items: [] as { item_id: string; quantity: number; unit_price: number }[],
  });

  const [newCategory, setNewCategory] = useState({ name: "", description: "" });
  const [bulkAdjustments, setBulkAdjustments] = useState<any[]>([]);

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.category_id === categoryFilter;
    const matchesDept = departmentFilter === "all" || item.department === departmentFilter;
    return matchesSearch && matchesCategory && matchesDept;
  });

  const handleCreateItem = async () => {
    try {
      await createItem.mutateAsync(newItem as any);
      toast.success("Item created successfully");
      setAddItemOpen(false);
      setNewItem({ name: "", sku: "", category_id: "", supplier_id: "", unit: "pieces", current_stock: 0, min_stock: 0, reorder_point: 0, cost_price: 0, department: "", is_active: true });
    } catch (error) {
      toast.error("Failed to create item");
    }
  };

  const handleUpdateItem = async () => {
    if (!selectedItemId) return;
    try {
      const { current_stock, ...updates } = newItem;
      await updateItem.mutateAsync({ id: selectedItemId, ...updates } as any);
      toast.success("Item updated successfully");
      setEditItemOpen(false);
      setSelectedItemId(null);
    } catch (error) {
      toast.error("Failed to update item");
    }
  };

  const handleCreateSupplier = async () => {
    try {
      await createSupplier.mutateAsync(newSupplier as any);
      toast.success("Supplier added successfully");
      setAddSupplierOpen(false);
      setNewSupplier({ name: "", contact_person: "", email: "", phone: "", address: "", payment_terms: "", notes: "", is_active: true });
    } catch (error) {
      toast.error("Failed to add supplier");
    }
  };

  const handleUpdateSupplier = async () => {
    if (!selectedSupplierId) return;
    try {
      await updateSupplier.mutateAsync({ id: selectedSupplierId, ...newSupplier } as any);
      toast.success("Supplier updated successfully");
      setEditSupplierOpen(false);
      setSelectedSupplierId(null);
    } catch (error) {
      toast.error("Failed to update supplier");
    }
  };

  const handleAdjustStock = async () => {
    if (!selectedItemId) return;
    try {
      await adjustStock.mutateAsync({ itemId: selectedItemId, ...stockAdjustment });
      toast.success("Stock adjusted successfully");
      setAdjustStockOpen(false);
      setSelectedItemId(null);
      setStockAdjustment({ quantity: 0, type: "in", notes: "" });
    } catch (error) {
      toast.error("Failed to adjust stock");
    }
  };

  const handleCreatePO = async () => {
    try {
      if (newPO.items.length === 0) {
        toast.error("Add at least one item to the order");
        return;
      }
      const subtotal = newPO.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
      await createPurchaseOrder.mutateAsync({
        ...newPO,
        subtotal,
        tax_amount: subtotal * 0.13, // 13% VAT
        total: subtotal * 1.13,
        status: "sent",
      } as any);
      toast.success("Purchase order created");
      setAddPOOpen(false);
      setNewPO({ supplier_id: "", order_date: format(new Date(), "yyyy-MM-dd"), expected_delivery: "", notes: "", items: [] });
    } catch (error) {
      toast.error("Failed to create purchase order");
    }
  };

  const handleReceivePO = async (id: string) => {
    try {
      await updatePurchaseOrderStatus.mutateAsync({ id, status: "received" });
      toast.success("Purchase order received and stock updated");
      setViewPOOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to receive order");
    }
  };

  const handleCreateCategory = async () => {
    try {
      await createCategory.mutateAsync(newCategory);
      toast.success("Category created");
      setAddCategoryOpen(false);
      setNewCategory({ name: "", description: "" });
    } catch (error) {
      toast.error("Failed to create category");
    }
  };

  const handleUpdateCategory = async () => {
    if (!selectedCategoryId) return;
    try {
      await updateCategory.mutateAsync({ id: selectedCategoryId, ...newCategory });
      toast.success("Category updated");
      setEditCategoryOpen(false);
      setSelectedCategoryId(null);
    } catch (error) {
      toast.error("Failed to update category");
    }
  };

  const handleBulkAdjust = async () => {
    try {
      await bulkAdjustStock.mutateAsync(bulkAdjustments);
      toast.success("Bulk adjustment completed");
      setBulkAdjustOpen(false);
      setBulkAdjustments([]);
    } catch (error) {
      toast.error("Bulk adjustment failed");
    }
  };

  const exportToExcel = (data: any[], fileName: string) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, `${fileName}_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
  };

  const getStockStatus = (current: number, min: number, reorder: number, active: boolean) => {
    if (!active) return { label: "Inactive", color: "bg-muted text-muted-foreground" };
    if (current === 0) return { label: "Out of Stock", color: "bg-destructive/20 text-destructive" };
    if (current <= reorder) return { label: "Low Stock", color: "bg-amber-500/20 text-amber-400" };
    return { label: "In Stock", color: "bg-success/20 text-success" };
  };

  return (
    <MainLayout title="Inventory Management" subtitle="Track stock, suppliers, and purchase orders">
      <Tabs defaultValue="items" className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-2">
          <TabsTrigger value="items" className="gap-2">
            <Package className="h-4 w-4" />
            Items
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2">
            <Layers className="h-4 w-4" />
            Categories
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
            Movements
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Reports
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
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept!}>{dept}</SelectItem>
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportToExcel(items, "Inventory_Items")}
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  Export
                </Button>
            </div>
              <div className="flex gap-2">
                <Button variant="outline" className="gap-2" onClick={() => {
                  setBulkAdjustments(items.map(i => ({ itemId: i.id, quantity: 0, type: "adjustment", notes: "" })));
                  setBulkAdjustOpen(true);
                }}>
                  <Settings2 className="h-4 w-4" />
                  Bulk Adjust
                </Button>
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
        </div>

          {/* Items Table */}
          <Card>
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
                      <TableHead className="text-right">Actions</TableHead>
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
                        const status = getStockStatus(item.current_stock, item.min_stock, item.reorder_point, item.is_active);
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
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => { setSelectedItemId(item.id); setAdjustStockOpen(true); }}
                                >
                                  <ArrowUpDown className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedItemId(item.id);
                                    setNewItem({
                                      name: item.name,
                                      sku: item.sku || "",
                                      category_id: item.category_id || "",
                                      supplier_id: item.supplier_id || "",
                                      unit: item.unit,
                                      current_stock: item.current_stock,
                                      min_stock: item.min_stock,
                                      reorder_point: item.reorder_point,
                                      cost_price: item.cost_price,
                                      department: item.department || "",
                                      is_active: item.is_active,
                                    });
                                    setEditItemOpen(true);
                                  }}
                                >
                                  Edit
                                </Button>
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

          {/* Edit Item Dialog */}
          <Dialog open={editItemOpen} onOpenChange={setEditItemOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Edit Inventory Item</DialogTitle>
                <DialogDescription>Update item details</DialogDescription>
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
                <div className="space-y-2 flex items-center gap-2 pt-8">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={newItem.is_active}
                    onChange={(e) => setNewItem({ ...newItem, is_active: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="is_active">Active Item</Label>
                </div>
              </div>
              <DialogFooter className="flex justify-between items-center sm:justify-between w-full">
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (window.confirm("Are you sure you want to delete this item?")) {
                      try {
                        await deleteItem.mutateAsync(selectedItemId!);
                        toast.success("Item deleted");
                        setEditItemOpen(false);
                      } catch (e) {
                        toast.error("Failed to delete item");
                      }
                    }
                  }}
                >
                  Delete
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setEditItemOpen(false)}>Cancel</Button>
                  <Button onClick={handleUpdateItem} disabled={!newItem.name || updateItem.isPending}>
                    {updateItem.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save Changes
                  </Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>

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

        <TabsContent value="categories">
          <div className="flex justify-end mb-4">
            <Button variant="gold" onClick={() => setAddCategoryOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Category
            </Button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Inventory Categories</CardTitle>
              <CardDescription>Organize your items into categories</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((cat) => (
                    <TableRow key={cat.id}>
                      <TableCell className="font-medium">{cat.name}</TableCell>
                      <TableCell>{cat.description || "-"}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedCategoryId(cat.id);
                            setNewCategory({ name: cat.name, description: cat.description || "" });
                            setEditCategoryOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Dialog open={addCategoryOpen} onOpenChange={setAddCategoryOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Category</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={newCategory.name} onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input value={newCategory.description} onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddCategoryOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateCategory} disabled={!newCategory.name}>Add Category</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={editCategoryOpen} onOpenChange={setEditCategoryOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Category</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={newCategory.name} onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input value={newCategory.description} onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })} />
                </div>
              </div>
              <DialogFooter className="flex justify-between w-full">
                <Button variant="destructive" onClick={() => {
                  if (confirm("Delete category?")) {
                    deleteCategory.mutate(selectedCategoryId!);
                    setEditCategoryOpen(false);
                  }
                }}>Delete</Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setEditCategoryOpen(false)}>Cancel</Button>
                  <Button onClick={handleUpdateCategory} disabled={!newCategory.name}>Save</Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="suppliers">
          <div className="flex justify-end mb-4">
            <Button variant="gold" onClick={() => setAddSupplierOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Supplier
            </Button>
          </div>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Suppliers</CardTitle>
                  <CardDescription>{suppliers.length} suppliers registered</CardDescription>
                </div>
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
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
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
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedSupplierId(s.id);
                            setNewSupplier({
                              name: s.name,
                              contact_person: s.contact_person || "",
                              email: s.email || "",
                              phone: s.phone || "",
                              address: s.address || "",
                              payment_terms: s.payment_terms || "",
                              notes: s.notes || "",
                              is_active: s.is_active,
                            });
                            setEditSupplierOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Add Supplier Dialog */}
          <Dialog open={addSupplierOpen} onOpenChange={setAddSupplierOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Supplier</DialogTitle>
                <DialogDescription>Add a new supplier to your directory</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2 col-span-2">
                  <Label>Supplier Name *</Label>
                  <Input value={newSupplier.name} onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Contact Person</Label>
                  <Input value={newSupplier.contact_person} onChange={(e) => setNewSupplier({ ...newSupplier, contact_person: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={newSupplier.email} onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={newSupplier.phone} onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Payment Terms</Label>
                  <Input value={newSupplier.payment_terms} onChange={(e) => setNewSupplier({ ...newSupplier, payment_terms: e.target.value })} placeholder="e.g. Net 30" />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Address</Label>
                  <Input value={newSupplier.address} onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })} />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Notes</Label>
                  <Input value={newSupplier.notes} onChange={(e) => setNewSupplier({ ...newSupplier, notes: e.target.value })} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddSupplierOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateSupplier} disabled={!newSupplier.name || createSupplier.isPending}>
                  {createSupplier.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Add Supplier
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Supplier Dialog */}
          <Dialog open={editSupplierOpen} onOpenChange={setEditSupplierOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Supplier</DialogTitle>
                <DialogDescription>Update supplier information</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2 col-span-2">
                  <Label>Supplier Name *</Label>
                  <Input value={newSupplier.name} onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Contact Person</Label>
                  <Input value={newSupplier.contact_person} onChange={(e) => setNewSupplier({ ...newSupplier, contact_person: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={newSupplier.email} onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={newSupplier.phone} onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Payment Terms</Label>
                  <Input value={newSupplier.payment_terms} onChange={(e) => setNewSupplier({ ...newSupplier, payment_terms: e.target.value })} />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Address</Label>
                  <Input value={newSupplier.address} onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })} />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Notes</Label>
                  <Input value={newSupplier.notes} onChange={(e) => setNewSupplier({ ...newSupplier, notes: e.target.value })} />
                </div>
                <div className="space-y-2 flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="supplier_active"
                    checked={newSupplier.is_active}
                    onChange={(e) => setNewSupplier({ ...newSupplier, is_active: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="supplier_active">Active Supplier</Label>
                </div>
              </div>
              <DialogFooter className="flex justify-between items-center sm:justify-between w-full">
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (window.confirm("Are you sure you want to delete this supplier?")) {
                      try {
                        await deleteSupplier.mutateAsync(selectedSupplierId!);
                        toast.success("Supplier deleted");
                        setEditSupplierOpen(false);
                      } catch (e) {
                        toast.error("Failed to delete supplier");
                      }
                    }
                  }}
                >
                  Delete
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setEditSupplierOpen(false)}>Cancel</Button>
                  <Button onClick={handleUpdateSupplier} disabled={!newSupplier.name || updateSupplier.isPending}>
                    {updateSupplier.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save Changes
                  </Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Purchase Orders</CardTitle>
                  <CardDescription>{purchaseOrders.length} orders</CardDescription>
                </div>
                <Button variant="gold" className="gap-2" onClick={() => setAddPOOpen(true)}>
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
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No purchase orders yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    purchaseOrders.map((po) => (
                      <TableRow key={po.id}>
                        <TableCell className="font-mono">{po.order_number}</TableCell>
                        <TableCell>{po.supplier?.name || "-"}</TableCell>
                        <TableCell>{format(new Date(po.order_date), "MMM d, yyyy")}</TableCell>
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
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedPO(po);
                              setViewPOOpen(true);
                            }}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* New Purchase Order Dialog */}
          <Dialog open={addPOOpen} onOpenChange={setAddPOOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>New Purchase Order</DialogTitle>
                <DialogDescription>Create a new order for items</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label>Supplier *</Label>
                  <Select value={newPO.supplier_id} onValueChange={(v) => setNewPO({ ...newPO, supplier_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select Supplier" /></SelectTrigger>
                    <SelectContent>
                      {suppliers.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Expected Delivery</Label>
                  <Input type="date" value={newPO.expected_delivery} onChange={(e) => setNewPO({ ...newPO, expected_delivery: e.target.value })} />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Notes</Label>
                  <Input value={newPO.notes} onChange={(e) => setNewPO({ ...newPO, notes: e.target.value })} />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Order Items</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setNewPO({
                      ...newPO,
                      items: [...newPO.items, { item_id: "", quantity: 1, unit_price: 0 }]
                    })}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Item
                  </Button>
                </div>

                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead className="w-24">Quantity</TableHead>
                        <TableHead className="w-32">Unit Price</TableHead>
                        <TableHead className="w-32">Total</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {newPO.items.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4 text-muted-foreground text-xs">
                            No items added yet. Click 'Add Item' to start.
                          </TableCell>
                        </TableRow>
                      ) : (
                        newPO.items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Select
                                value={item.item_id}
                                onValueChange={(v) => {
                                  const updatedItems = [...newPO.items];
                                  const selectedItem = items.find(i => i.id === v);
                                  updatedItems[index] = {
                                    ...item,
                                    item_id: v,
                                    unit_price: selectedItem?.cost_price || 0
                                  };
                                  setNewPO({ ...newPO, items: updatedItems });
                                }}
                              >
                                <SelectTrigger><SelectValue placeholder="Select Item" /></SelectTrigger>
                                <SelectContent>
                                  {items.map((i) => (
                                    <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => {
                                  const updatedItems = [...newPO.items];
                                  updatedItems[index].quantity = Number(e.target.value);
                                  setNewPO({ ...newPO, items: updatedItems });
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={item.unit_price}
                                onChange={(e) => {
                                  const updatedItems = [...newPO.items];
                                  updatedItems[index].unit_price = Number(e.target.value);
                                  setNewPO({ ...newPO, items: updatedItems });
                                }}
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              ${(item.quantity * item.unit_price).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive"
                                onClick={() => {
                                  const updatedItems = newPO.items.filter((_, i) => i !== index);
                                  setNewPO({ ...newPO, items: updatedItems });
                                }}
                              >
                                &times;
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex flex-col items-end gap-1 px-4 py-2 bg-muted/50 rounded-lg">
                  <div className="text-sm flex justify-between w-48">
                    <span>Subtotal:</span>
                    <span>${newPO.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0).toFixed(2)}</span>
                  </div>
                  <div className="text-sm flex justify-between w-48">
                    <span>Tax (13%):</span>
                    <span>${(newPO.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0) * 0.13).toFixed(2)}</span>
                  </div>
                  <div className="text-lg font-bold flex justify-between w-48 border-t mt-1 pt-1">
                    <span>Total:</span>
                    <span>${(newPO.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0) * 1.13).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setAddPOOpen(false)}>Cancel</Button>
                <Button onClick={handleCreatePO} disabled={!newPO.supplier_id || createPurchaseOrder.isPending}>
                  {createPurchaseOrder.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Order
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* View Purchase Order Dialog */}
          <Dialog open={viewPOOpen} onOpenChange={setViewPOOpen}>
            <DialogContent className="max-w-3xl">
              {selectedPO && (
                <>
                  <DialogHeader>
                    <div className="flex justify-between items-start w-full">
                      <div>
                        <DialogTitle>Order {selectedPO.order_number}</DialogTitle>
                        <DialogDescription>
                          From {selectedPO.supplier?.name} on {format(new Date(selectedPO.order_date), "MMM d, yyyy")}
                        </DialogDescription>
                      </div>
                      <Badge className={
                        selectedPO.status === "received" ? "bg-success/20 text-success" :
                        selectedPO.status === "sent" ? "bg-blue-500/20 text-blue-400" :
                        "bg-muted text-muted-foreground"
                      }>
                        {selectedPO.status}
                      </Badge>
                    </div>
                  </DialogHeader>

                  <div className="py-4 space-y-6">
                    <div className="grid grid-cols-2 gap-8 text-sm">
                      <div>
                        <h4 className="font-semibold mb-1">Supplier Info</h4>
                        <p>{selectedPO.supplier?.name}</p>
                        <p className="text-muted-foreground">{selectedPO.supplier?.contact_person}</p>
                        <p className="text-muted-foreground">{selectedPO.supplier?.email}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Shipping Info</h4>
                        <p>Expected: {selectedPO.expected_delivery ? format(new Date(selectedPO.expected_delivery), "MMM d, yyyy") : "Not specified"}</p>
                        {selectedPO.received_date && (
                          <p>Received: {format(new Date(selectedPO.received_date), "MMM d, yyyy")}</p>
                        )}
                      </div>
                    </div>

                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead className="text-right">Quantity</TableHead>
                            <TableHead className="text-right">Unit Price</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedPO.items?.map((item: any) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">{item.item?.name}</TableCell>
                              <TableCell className="text-right">{item.quantity}</TableCell>
                              <TableCell className="text-right">${item.unit_price.toFixed(2)}</TableCell>
                              <TableCell className="text-right">${(item.quantity * item.unit_price).toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="flex flex-col items-end text-sm space-y-1">
                      <div className="flex justify-between w-48">
                        <span className="text-muted-foreground">Subtotal:</span>
                        <span>${selectedPO.subtotal?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between w-48">
                        <span className="text-muted-foreground">Tax:</span>
                        <span>${selectedPO.tax_amount?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between w-48 font-bold text-lg pt-1 border-t">
                        <span>Total:</span>
                        <span>${selectedPO.total?.toFixed(2)}</span>
                      </div>
                    </div>

                    {selectedPO.notes && (
                      <div className="bg-muted p-3 rounded-md text-sm">
                        <span className="font-semibold block mb-1">Notes:</span>
                        {selectedPO.notes}
                      </div>
                    )}
                  </div>

                  <DialogFooter className="flex justify-between sm:justify-between w-full border-t pt-4">
                    <Button
                      variant="destructive"
                      onClick={async () => {
                        if (window.confirm("Delete this purchase order?")) {
                          await deletePurchaseOrder.mutateAsync(selectedPO.id);
                          toast.success("Order deleted");
                          setViewPOOpen(false);
                        }
                      }}
                    >
                      Delete
                    </Button>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setViewPOOpen(false)}>Close</Button>
                      {selectedPO.status !== "received" && (
                        <Button
                          variant="gold"
                          onClick={() => handleReceivePO(selectedPO.id)}
                          disabled={updatePurchaseOrderStatus.isPending}
                        >
                          {updatePurchaseOrderStatus.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          Mark as Received
                        </Button>
                      )}
                    </div>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="movements">
          <div className="flex flex-wrap gap-4 mb-4 items-end">
            <div className="w-64">
              <Label className="text-xs mb-1 block">Filter by Item</Label>
              <Select value={movementFilters.itemId} onValueChange={(v) => setMovementFilters({ ...movementFilters, itemId: v })}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Items</SelectItem>
                  {items.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="w-40">
              <Label className="text-xs mb-1 block">Movement Type</Label>
              <Select value={movementFilters.type} onValueChange={(v) => setMovementFilters({ ...movementFilters, type: v })}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="in">Stock In</SelectItem>
                  <SelectItem value="out">Stock Out</SelectItem>
                  <SelectItem value="adjustment">Adjustment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setMovementFilters({ itemId: "all", type: "all" })}>
              Clear Filters
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportToExcel(movements, "Stock_Movements")} className="ml-auto">
              <FileDown className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Stock Movements</CardTitle>
                  <CardDescription>Recent inventory changes</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetchMovements()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
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
                        <TableCell>{format(new Date(m.created_at), "MMM d, HH:mm")}</TableCell>
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

        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Stock Value Trend</CardTitle>
                <CardDescription>Inventory valuation over the last 30 days</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={reportData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <RechartsTooltip />
                    <Line type="monotone" dataKey="value" stroke="#EAB308" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Distribution</CardTitle>
                <CardDescription>Stock value by category</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={Object.entries(stats.categoryDistribution || {}).map(([name, value]) => ({ name, value }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {Object.entries(stats.categoryDistribution || {}).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={[`#EAB308`, `#3B82F6`, `#10B981`, `#F59E0B`, `#6366F1`][index % 5]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Movement Volume</CardTitle>
                <CardDescription>Daily Stock In vs Stock Out</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <RechartsTooltip />
                    <Bar dataKey="in" fill="#10B981" name="Stock In" />
                    <Bar dataKey="out" fill="#EF4444" name="Stock Out" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Bulk Adjustment Dialog */}
      <Dialog open={bulkAdjustOpen} onOpenChange={setBulkAdjustOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bulk Stock Adjustment</DialogTitle>
            <DialogDescription>Update stock levels for multiple items at once</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Current</TableHead>
                  <TableHead className="w-32">Type</TableHead>
                  <TableHead className="w-24">Value</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bulkAdjustments.map((adj, index) => {
                  const item = items.find(i => i.id === adj.itemId);
                  return (
                    <TableRow key={adj.itemId}>
                      <TableCell className="font-medium">{item?.name}</TableCell>
                      <TableCell>{item?.current_stock}</TableCell>
                      <TableCell>
                        <Select value={adj.type} onValueChange={(v: any) => {
                          const newAdjs = [...bulkAdjustments];
                          newAdjs[index].type = v;
                          setBulkAdjustments(newAdjs);
                        }}>
                          <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="in">In (+)</SelectItem>
                            <SelectItem value="out">Out (-)</SelectItem>
                            <SelectItem value="adjustment">Set (=)</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          className="h-8"
                          value={adj.quantity}
                          onChange={(e) => {
                            const newAdjs = [...bulkAdjustments];
                            newAdjs[index].quantity = Number(e.target.value);
                            setBulkAdjustments(newAdjs);
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          className="h-8"
                          placeholder="Reason..."
                          value={adj.notes}
                          onChange={(e) => {
                            const newAdjs = [...bulkAdjustments];
                            newAdjs[index].notes = e.target.value;
                            setBulkAdjustments(newAdjs);
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkAdjustOpen(false)}>Cancel</Button>
            <Button onClick={handleBulkAdjust} disabled={bulkAdjustStock.isPending}>
              {bulkAdjustStock.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save All Adjustments
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Inventory;
