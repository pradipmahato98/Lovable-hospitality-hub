import { useState, useMemo } from "react";
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
  PieChart as PieChartIcon, FileDown, Layers, Settings2, BarChart3,
  QrCode, ClipboardList, CheckCircle2, XCircle, Camera, LayoutDashboard, ShoppingCart,
  Edit, Trash2, Eye, FilterX
} from "lucide-react";
import { toast } from "sonner";
import { 
  useInventoryItems, useInventoryCategories, useSuppliers, 
  usePurchaseOrders, useStockMovements, useInventoryStats,
  useInventoryReportData, useInventoryLocations, useInventoryRequisitions
} from "@/hooks/useInventory";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

const Inventory = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [showLowStock, setShowLowStock] = useState(false);

  // Dialog States
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [editItemOpen, setEditItemOpen] = useState(false);
  const [adjustStockOpen, setAdjustStockOpen] = useState(false);
  const [bulkAdjustOpen, setBulkAdjustOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const [addReqOpen, setAddReqOpen] = useState(false);
  const [viewReqOpen, setViewReqOpen] = useState(false);
  const [selectedReq, setSelectedReq] = useState<any>(null);

  const [addPOOpen, setAddPOOpen] = useState(false);
  const [viewPOOpen, setViewPOOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<any>(null);

  const [addLocationOpen, setAddLocationOpen] = useState(false);
  const [editLocationOpen, setEditLocationOpen] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);

  const [addSupplierOpen, setAddSupplierOpen] = useState(false);
  const [editSupplierOpen, setEditSupplierOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);

  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [editCategoryOpen, setEditCategoryOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const [stockOutOpen, setStockOutOpen] = useState(false);

  // Data Hooks
  const { data: items = [], isLoading, createItem, updateItem, deleteItem, adjustStock } = useInventoryItems({
    search: searchQuery,
    category: categoryFilter !== "all" ? categoryFilter : undefined,
    lowStock: showLowStock,
    showInactive: true
  });

  const { data: categories = [], createCategory, updateCategory, deleteCategory } = useInventoryCategories();
  const { data: locations = [], createLocation, updateLocation, deleteLocation } = useInventoryLocations();
  const { data: suppliers = [], createSupplier, updateSupplier, deleteSupplier } = useSuppliers({ showInactive: true });
  const { data: purchaseOrders = [], createPurchaseOrder, updatePurchaseOrderStatus } = usePurchaseOrders();
  const { data: requisitions = [], createRequisition, updateRequisitionStatus, deleteRequisition, convertToPO } = useInventoryRequisitions();
  const { data: movements = [] } = useStockMovements();
  const stats = useInventoryStats();
  const { data: reportData = [] } = useInventoryReportData();

  // Filtered Items for Display (applying location and department client-side)
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesLocation = locationFilter === "all" || item.location_id === locationFilter;
      const matchesDept = departmentFilter === "all" || item.department === departmentFilter;
      return matchesLocation && matchesDept;
    });
  }, [items, locationFilter, departmentFilter]);

  const departments = useMemo(() => {
    const set = new Set(items.map(i => i.department).filter(Boolean));
    return Array.from(set) as string[];
  }, [items]);

  const masterItems = useMemo(() => {
    // We could fetch non-filtered here but for now using items from hook is fine if we want dropdowns to match
    return items;
  }, [items]);

  // Form States
  const [itemForm, setItemForm] = useState({
    name: "", sku: "", barcode: "", image_url: "", category_id: "", supplier_id: "", location_id: "",
    unit: "pieces", current_stock: 0, min_stock: 0, reorder_point: 0, cost_price: 0, department: "", is_active: true,
  });

  const [supplierForm, setSupplierForm] = useState({
    name: "", contact_person: "", email: "", phone: "", address: "", payment_terms: "", notes: "", is_active: true,
  });

  const [locationForm, setLocationForm] = useState({ name: "", description: "" });
  const [categoryForm, setCategoryForm] = useState({ name: "", description: "" });

  const [stockAdjustment, setStockAdjustment] = useState({
    quantity: 0, type: "in" as "in" | "out" | "adjustment", notes: "", department: "", locationId: "",
  });

  const [bulkAdjustments, setBulkAdjustments] = useState<any[]>([]);

  const [newReq, setNewReq] = useState({ department: "", notes: "", items: [] as { item_id: string; quantity: number }[] });

  const [newPO, setNewPO] = useState({
    supplier_id: "", order_date: format(new Date(), "yyyy-MM-dd"), expected_delivery: "", notes: "",
    items: [] as { item_id: string; quantity: number; unit_price: number }[],
  });

  // Handlers
  const handleCreateItem = async () => {
    try {
      await createItem.mutateAsync(itemForm as any);
      toast.success("Item created");
      setAddItemOpen(false);
    } catch (e) { toast.error("Error creating item"); }
  };

  const handleUpdateItem = async () => {
    if (!selectedItemId) return;
    try {
      const { current_stock, ...updates } = itemForm;
      await updateItem.mutateAsync({ id: selectedItemId, ...updates } as any);
      toast.success("Item updated");
      setEditItemOpen(false);
    } catch (e) { toast.error("Error updating item"); }
  };

  const handleAdjustStock = async () => {
    if (!selectedItemId) return;
    try {
      await adjustStock.mutateAsync({ itemId: selectedItemId, ...stockAdjustment });
      toast.success("Stock adjusted");
      setAdjustStockOpen(false);
    } catch (e) { toast.error("Error adjusting stock"); }
  };

  const handleCreateRequisition = async () => {
    try {
      if (newReq.items.length === 0) return toast.error("Add at least one item");
      await createRequisition.mutateAsync(newReq as any);
      toast.success("Requisition submitted");
      setAddReqOpen(false);
      setNewReq({ department: "", notes: "", items: [] });
    } catch (e) { toast.error("Error submitting requisition"); }
  };

  const handleApproveReq = async (id: string) => {
    try {
      await updateRequisitionStatus.mutateAsync({ id, status: "approved" });
      toast.success("Requisition approved");
    } catch (e) { toast.error("Error approving requisition"); }
  };

  const handleCreatePO = async () => {
    try {
      if (newPO.items.length === 0) return toast.error("Add items to order");
      const subtotal = newPO.items.reduce((sum, i) => sum + (i.quantity * i.unit_price), 0);
      await createPurchaseOrder.mutateAsync({
        ...newPO,
        subtotal,
        tax_amount: subtotal * 0.13,
        total: subtotal * 1.13,
        status: "sent"
      } as any);
      toast.success("Purchase order created");
      setAddPOOpen(false);
    } catch (e) { toast.error("Error creating PO"); }
  };

  const handleExport = (data: any[], name: string) => {
    if (!data || data.length === 0) return toast.error("No data to export");
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventory");
    XLSX.writeFile(wb, `${name}_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("all");
    setLocationFilter("all");
    setDepartmentFilter("all");
    setShowLowStock(false);
  };

  return (
    <MainLayout title="Inventory Management" subtitle="Comprehensive stock tracking and procurement">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
          <TabsTrigger value="dashboard" className="gap-2"><LayoutDashboard className="h-4 w-4" />Dashboard</TabsTrigger>
          <TabsTrigger value="items" className="gap-2"><Package className="h-4 w-4" />Items</TabsTrigger>
          <TabsTrigger value="categories" className="gap-2"><Layers className="h-4 w-4" />Categories</TabsTrigger>
          <TabsTrigger value="requisitions" className="gap-2"><ClipboardList className="h-4 w-4" />Requisitions</TabsTrigger>
          <TabsTrigger value="orders" className="gap-2"><ShoppingCart className="h-4 w-4" />Orders</TabsTrigger>
          <TabsTrigger value="suppliers" className="gap-2"><Truck className="h-4 w-4" />Suppliers</TabsTrigger>
          <TabsTrigger value="locations" className="gap-2"><Warehouse className="h-4 w-4" />Locations</TabsTrigger>
          <TabsTrigger value="movements" className="gap-2"><ArrowUpDown className="h-4 w-4" />Movements</TabsTrigger>
          <TabsTrigger value="reports" className="gap-2"><BarChart3 className="h-4 w-4" />Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-primary/5 border-primary/20 shadow-sm transition-all hover:shadow-md">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Inventory Value</p>
                    <p className="text-2xl font-bold text-primary">${stats.totalValue.toLocaleString()}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-primary/40" />
                </div>
              </CardContent>
            </Card>
            <Card
              className={`shadow-sm transition-all hover:shadow-md cursor-pointer ${stats.lowStock > 0 ? "bg-amber-500/5 border-amber-500/20" : ""}`}
              onClick={() => { setShowLowStock(true); setActiveTab("items"); }}
            >
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Low Stock Alerts</p>
                    <p className={`text-2xl font-bold ${stats.lowStock > 0 ? "text-amber-500" : ""}`}>{stats.lowStock}</p>
                  </div>
                  <AlertTriangle className={`h-8 w-8 ${stats.lowStock > 0 ? "text-amber-500/40" : "text-muted-foreground/20"}`} />
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm transition-all hover:shadow-md cursor-pointer" onClick={() => setActiveTab("requisitions")}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pending Reqs</p>
                    <p className="text-2xl font-bold">{requisitions.filter(r => r.status === "pending").length}</p>
                  </div>
                  <ClipboardList className="h-8 w-8 text-muted-foreground/20" />
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm transition-all hover:shadow-md cursor-pointer" onClick={() => setActiveTab("orders")}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active POs</p>
                    <p className="text-2xl font-bold">{purchaseOrders.filter(o => o.status === "sent").length}</p>
                  </div>
                  <ShoppingCart className="h-8 w-8 text-muted-foreground/20" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Low Stock Items</CardTitle>
                <CardDescription>Items below reorder point requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Current</TableHead>
                      <TableHead>Reorder</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.filter(i => i.current_stock <= i.reorder_point).slice(0, 5).map(item => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-destructive font-bold">{item.current_stock} {item.unit}</TableCell>
                        <TableCell>{item.reorder_point}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => {
                            setNewReq({ department: "General", notes: "Auto-generated from low stock alert", items: [{ item_id: item.id, quantity: Math.max(1, item.reorder_point * 2) }] });
                            setAddReqOpen(true);
                          }}>Restock</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {items.filter(i => i.current_stock <= i.reorder_point).length === 0 && (
                      <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">All stock levels are healthy</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-2">
                <Button variant="outline" className="justify-start gap-3 h-12" onClick={() => {
                  setItemForm({ name: "", sku: "", barcode: "", image_url: "", category_id: "", supplier_id: "", location_id: "", unit: "pieces", current_stock: 0, min_stock: 0, reorder_point: 0, cost_price: 0, department: "", is_active: true });
                  setAddItemOpen(true);
                }}>
                  <Plus className="h-4 w-4" /> Add New Item
                </Button>
                <Button variant="outline" className="justify-start gap-3 h-12" onClick={() => setAddReqOpen(true)}>
                  <ClipboardList className="h-4 w-4" /> Submit Requisition
                </Button>
                <Button variant="outline" className="justify-start gap-3 h-12" onClick={() => {
                  setBulkAdjustments(items.map(i => ({ itemId: i.id, quantity: 0, type: "adjustment", notes: "" })));
                  setBulkAdjustOpen(true);
                }}>
                  <Settings2 className="h-4 w-4" /> Bulk Adjust Stock
                </Button>
                <Button variant="outline" className="justify-start gap-3 h-12" onClick={() => handleExport(items, "Inventory_Report")}>
                  <FileDown className="h-4 w-4" /> Export Stock List
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="items" className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search items..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-36"><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="w-36"><SelectValue placeholder="Location" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={() => setShowLowStock(!showLowStock)} className={showLowStock ? "bg-amber-500/10 text-amber-600 border-amber-500/50" : ""} title="Low Stock Only">
                <AlertTriangle className="h-4 w-4" />
              </Button>
              {(searchQuery || categoryFilter !== "all" || locationFilter !== "all" || showLowStock) && (
                <Button variant="ghost" size="icon" onClick={clearFilters} title="Clear Filters"><FilterX className="h-4 w-4" /></Button>
              )}
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Button variant="outline" onClick={() => handleExport(items, "Items")}><FileDown className="h-4 w-4 mr-2" />Export</Button>
              <Button variant="gold" onClick={() => {
                setItemForm({ name: "", sku: "", barcode: "", image_url: "", category_id: "", supplier_id: "", location_id: "", unit: "pieces", current_stock: 0, min_stock: 0, reorder_point: 0, cost_price: 0, department: "", is_active: true });
                setAddItemOpen(true);
              }} className="gap-2"><Plus className="h-4 w-4" />Add Item</Button>
            </div>
          </div>

          <Card className="shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Item Details</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Stock Level</TableHead>
                  <TableHead>Unit Cost</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-20"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary/50" /></TableCell></TableRow>
                ) : filteredItems.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-20 text-muted-foreground">No items match your filters</TableCell></TableRow>
                ) : filteredItems.map(item => (
                  <TableRow key={item.id} className={item.is_active ? "" : "opacity-50"}>
                    <TableCell>
                      {item.image_url ? (
                        <img src={item.image_url} alt="" className="h-8 w-8 rounded object-cover shadow-sm" />
                      ) : (
                        <div className="h-8 w-8 rounded bg-muted flex items-center justify-center"><Package className="h-4 w-4 text-muted-foreground" /></div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{item.name}</span>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span className="font-mono bg-muted px-1 rounded">{item.sku || "NO-SKU"}</span>
                          {item.barcode && <span className="flex items-center gap-0.5"><QrCode className="h-2.5 w-2.5" />{item.barcode}</span>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline" className="font-normal text-[10px]">{item.category?.name || "Uncategorized"}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{item.location?.name || "-"}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className={`text-xs font-bold ${item.current_stock <= item.reorder_point ? "text-amber-500" : ""}`}>
                          {item.current_stock} {item.unit}
                        </span>
                        <div className="h-1 w-20 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${item.current_stock <= item.reorder_point ? "bg-amber-500" : "bg-success"}`}
                            style={{ width: `${Math.min(100, (item.current_stock / (Math.max(item.reorder_point, 1) * 2)) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-medium">${item.cost_price.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-0.5">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelectedItemId(item.id); setStockAdjustment({ ...stockAdjustment, type: "out", quantity: 0, department: item.department || "" }); setStockOutOpen(true); }} title="Record Consumption"><TrendingDown className="h-4 w-4 text-destructive" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelectedItemId(item.id); setStockAdjustment({ ...stockAdjustment, type: "in", quantity: 0 }); setAdjustStockOpen(true); }} title="Adjust Stock"><Plus className="h-4 w-4 text-success" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                          setSelectedItemId(item.id);
                          setItemForm({ ...item, sku: item.sku || "", barcode: item.barcode || "", image_url: item.image_url || "", category_id: item.category_id || "", supplier_id: item.supplier_id || "", location_id: item.location_id || "", department: item.department || "" });
                          setEditItemOpen(true);
                        }} title="Edit"><Edit className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
           <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Item Categories</h2>
              <Button variant="gold" onClick={() => { setCategoryForm({ name: "", description: "" }); setAddCategoryOpen(true); }} className="gap-2"><Plus className="h-4 w-4" />Add Category</Button>
           </div>
           <Card className="shadow-sm">
             <Table>
                <TableHeader>
                  <TableRow><TableHead>Name</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {categories.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center py-10 text-muted-foreground">No categories defined</TableCell></TableRow>
                  ) : categories.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{c.description || "-"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => { setSelectedCategoryId(c.id); setCategoryForm({ name: c.name, description: c.description || "" }); setEditCategoryOpen(true); }}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => { if (confirm("Delete category?")) deleteCategory.mutate(c.id); }}><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
             </Table>
           </Card>
        </TabsContent>

        <TabsContent value="requisitions" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Internal Requisitions</h2>
            <Button variant="gold" className="gap-2" onClick={() => setAddReqOpen(true)}><Plus className="h-4 w-4" />New Requisition</Button>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {requisitions.length === 0 ? (
              <Card className="p-10 text-center text-muted-foreground">No active requisitions</Card>
            ) : requisitions.map(req => (
              <Card key={req.id} className="overflow-hidden shadow-sm border-l-4 border-l-primary hover:shadow-md transition-shadow">
                <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary"><ClipboardList className="h-6 w-6" /></div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">{req.requisition_number}</span>
                        <Badge className={
                          req.status === "approved" ? "bg-success/20 text-success" :
                          req.status === "pending" ? "bg-amber-500/20 text-amber-500" :
                          req.status === "completed" ? "bg-blue-500/20 text-blue-500" :
                          "bg-muted text-muted-foreground"
                        }>{req.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground uppercase tracking-tight">Dept: {req.department} • {format(new Date(req.created_at), "MMM d, yyyy HH:mm")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden md:block mr-4">
                      <p className="text-sm font-medium">{req.items?.length || 0} items requested</p>
                    </div>
                    <div className="flex gap-2">
                      {req.status === "pending" && (
                        <Button variant="outline" size="sm" className="text-success gap-2 hover:bg-success hover:text-white" onClick={() => handleApproveReq(req.id)}><CheckCircle2 className="h-4 w-4" />Approve</Button>
                      )}
                      {req.status === "approved" && (
                        <Button variant="gold" size="sm" className="gap-2" onClick={() => convertToPO.mutate(req.id)}><ShoppingCart className="h-4 w-4" />Generate PO</Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => { setSelectedReq(req); setViewReqOpen(true); }}><Eye className="h-4 w-4 mr-2" />Details</Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { if (confirm("Cancel requisition?")) deleteRequisition.mutate(req.id); }}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Purchase Orders</h2>
            <Button variant="gold" className="gap-2" onClick={() => setAddPOOpen(true)}><Plus className="h-4 w-4" />New Order</Button>
          </div>
          <Card className="shadow-sm">
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
                  <TableRow><TableCell colSpan={6} className="text-center py-20 text-muted-foreground">No purchase orders found</TableCell></TableRow>
                ) : purchaseOrders.map(po => (
                  <TableRow key={po.id}>
                    <TableCell className="font-mono text-xs font-bold">{po.order_number}</TableCell>
                    <TableCell className="text-sm">{po.supplier?.name || "-"}</TableCell>
                    <TableCell className="text-sm">{format(new Date(po.order_date), "MMM d, yyyy")}</TableCell>
                    <TableCell>
                      <Badge className={
                        po.status === "received" ? "bg-success/20 text-success border-success/30" :
                        po.status === "sent" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                        "bg-muted text-muted-foreground"
                      }>{po.status}</Badge>
                    </TableCell>
                    <TableCell className="font-bold text-sm">${po.total.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedPO(po); setViewPOOpen(true); }} className="h-8 gap-1"><Eye className="h-3.5 w-3.5" />View</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-4">
           <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Suppliers</h2>
              <Button variant="gold" className="gap-2" onClick={() => { setSupplierForm({ name: "", contact_person: "", email: "", phone: "", address: "", payment_terms: "", notes: "", is_active: true }); setAddSupplierOpen(true); }}><Plus className="h-4 w-4" />Add Supplier</Button>
           </div>
           <Card className="shadow-sm">
             <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliers.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-20 text-muted-foreground">No suppliers registered</TableCell></TableRow>
                  ) : suppliers.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="text-sm">{s.contact_person || "-"}</TableCell>
                      <TableCell className="text-sm">{s.email || "-"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => {
                          setSelectedSupplierId(s.id);
                          setSupplierForm({ ...s, contact_person: s.contact_person || "", email: s.email || "", phone: s.phone || "", address: s.address || "", payment_terms: s.payment_terms || "", notes: s.notes || "" });
                          setEditSupplierOpen(true);
                        }}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => { if (confirm("Delete supplier?")) deleteSupplier.mutate(s.id); }}><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
             </Table>
           </Card>
        </TabsContent>

        <TabsContent value="locations" className="space-y-4">
           <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Warehouse Locations</h2>
              <Button variant="gold" className="gap-2" onClick={() => { setLocationForm({ name: "", description: "" }); setAddLocationOpen(true); }}><Plus className="h-4 w-4" />Add Location</Button>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {locations.length === 0 ? (
                <div className="col-span-full py-20 text-center text-muted-foreground">No storage locations configured</div>
              ) : locations.map(loc => (
                <Card key={loc.id} className="shadow-sm border-l-4 border-l-primary relative group hover:shadow-md transition-all">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2"><Warehouse className="h-5 w-5 text-primary/70" />{loc.name}</CardTitle>
                    <CardDescription className="text-[10px] line-clamp-1">{loc.description || "No description"}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center text-sm mb-4">
                      <span className="text-muted-foreground">Stored Items:</span>
                      <span className="font-bold">{items.filter(i => i.location_id === loc.id).length}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-muted/50">
                      <Button variant="ghost" size="sm" className="h-7 text-[10px] px-2" onClick={() => { setLocationFilter(loc.id); setActiveTab("items"); }}>View Stock</Button>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedLocationId(loc.id); setLocationForm({ name: loc.name, description: loc.description || "" }); setEditLocationOpen(true); }}><Edit className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { if (confirm("Delete location?")) deleteLocation.mutate(loc.id); }}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
           </div>
        </TabsContent>

        <TabsContent value="movements" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Stock Movements</h2>
            <Button variant="outline" onClick={() => handleExport(movements, "Stock_Movements")}><FileDown className="h-4 w-4 mr-2" />Export Log</Button>
          </div>
           <Card className="shadow-sm">
             <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Reference/Dept</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground">No recent inventory changes recorded</TableCell></TableRow>
                  ) : movements.map(m => (
                    <TableRow key={m.id}>
                      <TableCell className="text-[10px] text-muted-foreground">{format(new Date(m.created_at), "MMM d, HH:mm:ss")}</TableCell>
                      <TableCell className="font-medium text-sm">{(m.item as any)?.name || "Unknown Item"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] font-normal ${
                          m.movement_type === "in" ? "bg-success/10 text-success border-success/30" :
                          m.movement_type === "out" ? "bg-destructive/10 text-destructive border-destructive/30" :
                          "bg-muted text-muted-foreground"
                        }`}>{m.movement_type.toUpperCase()}</Badge>
                      </TableCell>
                      <TableCell className="font-bold text-sm">{m.movement_type === "out" ? "-" : "+"}{m.quantity}</TableCell>
                      <TableCell className="text-xs text-muted-foreground truncate max-w-[200px]">{m.department || m.notes || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
             </Table>
           </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-sm border-t-4 border-t-amber-500">
              <CardHeader><CardTitle className="text-lg">Inventory Valuation Trend</CardTitle><CardDescription>30-day cumulative value</CardDescription></CardHeader>
              <CardContent className="h-[300px]">
                {reportData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={reportData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                      <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} interval={4} />
                      <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                      <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                      <Line type="monotone" dataKey="value" name="Value" stroke="#EAB308" strokeWidth={3} dot={{ r: 0 }} activeDot={{ r: 4 }} animationDuration={1000} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground italic">Insufficient data for trend analysis</div>
                )}
              </CardContent>
            </Card>
            <Card className="shadow-sm border-t-4 border-t-primary">
              <CardHeader><CardTitle className="text-lg">Value by Category</CardTitle><CardDescription>Total value distribution</CardDescription></CardHeader>
              <CardContent className="h-[300px]">
                {Object.keys(stats.categoryDistribution || {}).length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={Object.entries(stats.categoryDistribution || {}).map(([name, value]) => ({ name, value }))} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value" labelLine={false} animationDuration={1000}>
                        {Object.entries(stats.categoryDistribution || {}).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={[`#EAB308`, `#3B82F6`, `#10B981`, `#F59E0B`, `#6366F1`, `#EC4899`][index % 6]} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(v: number) => [`$${v.toLocaleString()}`, "Value"]} contentStyle={{ borderRadius: '8px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground italic">No category data available</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Item Dialogs (Add/Edit) */}
      <Dialog open={addItemOpen || editItemOpen} onOpenChange={(v) => { if(!v) { setAddItemOpen(false); setEditItemOpen(false); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2">{addItemOpen ? <Plus className="h-5 w-5" /> : <Edit className="h-5 w-5" />}{addItemOpen ? "Add New Item" : "Modify Item Details"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="md:col-span-2 flex justify-center py-6 bg-muted/30 rounded-xl border-2 border-dashed border-muted hover:border-primary/30 transition-colors cursor-pointer group">
               <div className="flex flex-col items-center gap-2">
                  <Camera className="h-10 w-10 text-muted-foreground group-hover:text-primary/50 transition-colors" />
                  <span className="text-xs text-muted-foreground">Click to upload product photo</span>
               </div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs uppercase font-bold text-muted-foreground">Product Name *</Label><Input value={itemForm.name} onChange={e => setItemForm({...itemForm, name: e.target.value})} placeholder="e.g. Bed Linen King Size" /></div>
            <div className="space-y-1.5"><Label className="text-xs uppercase font-bold text-muted-foreground">SKU / ID</Label><Input value={itemForm.sku} onChange={e => setItemForm({...itemForm, sku: e.target.value})} placeholder="INTERNAL-ID-123" /></div>
            <div className="space-y-1.5"><Label className="text-xs uppercase font-bold text-muted-foreground">Barcode / GTIN</Label><Input value={itemForm.barcode} onChange={e => setItemForm({...itemForm, barcode: e.target.value})} placeholder="Scan barcode here" /></div>
            <div className="space-y-1.5"><Label className="text-xs uppercase font-bold text-muted-foreground">Category</Label>
              <Select value={itemForm.category_id} onValueChange={v => setItemForm({...itemForm, category_id: v})}>
                <SelectTrigger><SelectValue placeholder="Categorize item" /></SelectTrigger>
                <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label className="text-xs uppercase font-bold text-muted-foreground">Storage Location</Label>
              <Select value={itemForm.location_id} onValueChange={v => setItemForm({...itemForm, location_id: v})}>
                <SelectTrigger><SelectValue placeholder="Primary warehouse" /></SelectTrigger>
                <SelectContent>{locations.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label className="text-xs uppercase font-bold text-muted-foreground">Unit Type</Label><Input value={itemForm.unit} onChange={e => setItemForm({...itemForm, unit: e.target.value})} placeholder="pcs, kg, liters, etc." /></div>
            <div className="space-y-1.5"><Label className="text-xs uppercase font-bold text-muted-foreground">Cost Price ($)</Label><Input type="number" value={itemForm.cost_price} onChange={e => setItemForm({...itemForm, cost_price: Number(e.target.value)})} /></div>
            <div className="space-y-1.5"><Label className="text-xs uppercase font-bold text-muted-foreground">Reorder Point</Label><Input type="number" value={itemForm.reorder_point} onChange={e => setItemForm({...itemForm, reorder_point: Number(e.target.value)})} /></div>
            {addItemOpen && <div className="space-y-1.5"><Label className="text-xs uppercase font-bold text-muted-foreground">Initial Stock</Label><Input type="number" value={itemForm.current_stock} onChange={e => setItemForm({...itemForm, current_stock: Number(e.target.value)})} /></div>}
            <div className="flex items-center gap-3 pt-6">
              <input type="checkbox" id="active-item" className="h-5 w-5 rounded-md border-primary text-primary focus:ring-primary" checked={itemForm.is_active} onChange={e => setItemForm({...itemForm, is_active: e.target.checked})} />
              <Label htmlFor="active-item" className="text-sm font-medium">Item is currently active</Label>
            </div>
          </div>
          <DialogFooter className="flex justify-between w-full border-t pt-4">
            {editItemOpen && <Button variant="destructive" size="sm" onClick={() => { if(confirm("Are you sure? This item will be permanently removed.")) { deleteItem.mutate(selectedItemId!); setEditItemOpen(false); } }}><Trash2 className="h-4 w-4 mr-2" />Delete Item</Button>}
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={() => { setAddItemOpen(false); setEditItemOpen(false); }}>Cancel</Button>
              <Button onClick={addItemOpen ? handleCreateItem : handleUpdateItem} disabled={!itemForm.name}>{addItemOpen ? "Create Product" : "Save Changes"}</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjust Stock Dialog */}
      <Dialog open={adjustStockOpen} onOpenChange={setAdjustStockOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><ArrowUpDown className="h-5 w-5" />Manual Stock Adjustment</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase font-bold text-muted-foreground">Adjustment Type</Label>
              <Select value={stockAdjustment.type} onValueChange={(v:any) => setStockAdjustment({...stockAdjustment, type: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">Restock / Return (+)</SelectItem>
                  <SelectItem value="out">Lost / Damaged (-)</SelectItem>
                  <SelectItem value="adjustment">Inventory Correction (=)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label className="text-xs uppercase font-bold text-muted-foreground">Quantity</Label><Input type="number" value={stockAdjustment.quantity} onChange={e => setStockAdjustment({...stockAdjustment, quantity: Number(e.target.value)})} /></div>
            <div className="space-y-1.5"><Label className="text-xs uppercase font-bold text-muted-foreground">Reason / Reference</Label><Input value={stockAdjustment.notes} onChange={e => setStockAdjustment({...stockAdjustment, notes: e.target.value})} placeholder="e.g. Annual stock take" /></div>
          </div>
          <DialogFooter><Button onClick={handleAdjustStock} className="w-full">Update Stock Level</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Adjust Dialog */}
      <Dialog open={bulkAdjustOpen} onOpenChange={setBulkAdjustOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Bulk Inventory Update</DialogTitle><DialogDescription>Adjust multiple items in a single action</DialogDescription></DialogHeader>
          <Table className="mt-4">
            <TableHeader><TableRow><TableHead>Item</TableHead><TableHead className="w-32">Type</TableHead><TableHead className="w-24">Value</TableHead><TableHead>Notes</TableHead></TableRow></TableHeader>
            <TableBody>
              {bulkAdjustments.map((adj, idx) => (
                <TableRow key={adj.itemId}>
                  <TableCell className="font-medium text-xs truncate max-w-[150px]">{items.find(i => i.id === adj.itemId)?.name}</TableCell>
                  <TableCell>
                    <Select value={adj.type} onValueChange={v => { const a = [...bulkAdjustments]; a[idx].type = v; setBulkAdjustments(a); }}>
                      <SelectTrigger className="h-8 text-[10px]"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="in">In (+)</SelectItem><SelectItem value="out">Out (-)</SelectItem><SelectItem value="adjustment">Set (=)</SelectItem></SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell><Input type="number" className="h-8 text-xs" value={adj.quantity} onChange={e => { const a = [...bulkAdjustments]; a[idx].quantity = Number(e.target.value); setBulkAdjustments(a); }} /></TableCell>
                  <TableCell><Input className="h-8 text-xs" placeholder="..." value={adj.notes} onChange={e => { const a = [...bulkAdjustments]; a[idx].notes = e.target.value; setBulkAdjustments(a); }} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setBulkAdjustOpen(false)}>Cancel</Button>
            <Button onClick={async () => {
              for (const adj of bulkAdjustments) {
                if (adj.quantity > 0 || adj.type === 'adjustment') {
                  await adjustStock.mutateAsync(adj);
                }
              }
              toast.success("Bulk adjustment completed");
              setBulkAdjustOpen(false);
            }}>Apply All Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock Out Dialog */}
      <Dialog open={stockOutOpen} onOpenChange={setStockOutOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><TrendingDown className="h-5 w-5 text-destructive" />Internal Consumption</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase font-bold text-muted-foreground">Issuing to Department</Label>
              <Select value={stockAdjustment.department} onValueChange={v => setStockAdjustment({...stockAdjustment, department: v})}>
                <SelectTrigger><SelectValue placeholder="Select receiver" /></SelectTrigger>
                <SelectContent>
                  {["Housekeeping", "Kitchen", "Bar", "Maintenance", "Front Desk", "Engineering", "Admin"].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label className="text-xs uppercase font-bold text-muted-foreground">Quantity Removed</Label><Input type="number" value={stockAdjustment.quantity} onChange={e => setStockAdjustment({...stockAdjustment, quantity: Number(e.target.value)})} /></div>
            <div className="space-y-1.5"><Label className="text-xs uppercase font-bold text-muted-foreground">Reason</Label><Input value={stockAdjustment.notes} onChange={e => setStockAdjustment({...stockAdjustment, notes: e.target.value})} placeholder="e.g. Room 301 setup" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStockOutOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={async () => {
              if(!stockAdjustment.department) return toast.error("Specify department");
              if(!stockAdjustment.quantity) return toast.error("Specify quantity");
              await adjustStock.mutateAsync({ itemId: selectedItemId!, ...stockAdjustment, type: "out" });
              toast.success("Consumption logged");
              setStockOutOpen(false);
            }}>Confirm Issue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Requisition Details */}
      <Dialog open={viewReqOpen} onOpenChange={setViewReqOpen}>
        <DialogContent className="max-w-2xl">
          {selectedReq && (
            <>
              <DialogHeader><DialogTitle>Requisition Details - {selectedReq.requisition_number}</DialogTitle></DialogHeader>
              <div className="py-4 space-y-6">
                <div className="grid grid-cols-2 gap-8 text-sm">
                  <div><Label className="text-muted-foreground text-[10px] uppercase">Department</Label><p className="font-bold text-lg">{selectedReq.department}</p></div>
                  <div><Label className="text-muted-foreground text-[10px] uppercase">Status</Label><div><Badge variant="outline">{selectedReq.status.toUpperCase()}</Badge></div></div>
                </div>
                <div className="border rounded-xl overflow-hidden shadow-sm">
                  <Table>
                    <TableHeader className="bg-muted/50"><TableRow><TableHead>Item Name</TableHead><TableHead className="text-right">Requested Qty</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {selectedReq.items?.map((i: any) => (
                        <TableRow key={i.id}><TableCell className="font-medium">{i.item?.name}</TableCell><TableCell className="text-right font-bold">{i.quantity} {i.item?.unit}</TableCell></TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              <DialogFooter><Button variant="outline" onClick={() => setViewReqOpen(false)} className="w-full">Close View</Button></DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* PO View */}
      <Dialog open={viewPOOpen} onOpenChange={setViewPOOpen}>
        <DialogContent className="max-w-3xl">
          {selectedPO && (
            <>
              <DialogHeader><div className="flex justify-between items-center w-full"><DialogTitle>Order Summary - {selectedPO.order_number}</DialogTitle><Badge variant="secondary">{selectedPO.status.toUpperCase()}</Badge></div></DialogHeader>
              <div className="py-4 space-y-6">
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div className="bg-muted/30 p-3 rounded-lg"><Label className="text-muted-foreground uppercase">Supplier</Label><p className="font-bold">{selectedPO.supplier?.name}</p></div>
                  <div className="bg-muted/30 p-3 rounded-lg"><Label className="text-muted-foreground uppercase">Order Date</Label><p className="font-bold">{format(new Date(selectedPO.order_date), "MMM d, yyyy")}</p></div>
                  <div className="bg-muted/30 p-3 rounded-lg"><Label className="text-muted-foreground uppercase">Delivery</Label><p className="font-bold">{selectedPO.expected_delivery ? format(new Date(selectedPO.expected_delivery), "MMM d, yyyy") : "-"}</p></div>
                </div>
                <div className="border rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50"><TableRow><TableHead>Item</TableHead><TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Rate</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {selectedPO.items?.map((i: any) => (
                        <TableRow key={i.id}><TableCell>{i.item?.name}</TableCell><TableCell className="text-right font-medium">{i.quantity}</TableCell><TableCell className="text-right">${i.unit_price}</TableCell><TableCell className="text-right font-bold">${(i.quantity * i.unit_price).toFixed(2)}</TableCell></TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex flex-col items-end gap-1">
                   <div className="text-sm flex justify-between w-40"><span>Subtotal</span><span>${selectedPO.subtotal.toFixed(2)}</span></div>
                   <div className="text-sm flex justify-between w-40"><span>Tax (13%)</span><span>${selectedPO.tax_amount.toFixed(2)}</span></div>
                   <div className="text-lg font-bold flex justify-between w-40 border-t pt-1"><span>Total</span><span>${selectedPO.total.toFixed(2)}</span></div>
                </div>
              </div>
              <DialogFooter className="border-t pt-4">
                {selectedPO.status === "sent" && (
                  <Button variant="gold" onClick={() => { updatePurchaseOrderStatus.mutate({ id: selectedPO.id, status: "received" }); setViewPOOpen(false); }} className="gap-2"><CheckCircle2 className="h-4 w-4" />Mark as Received & Update Stock</Button>
                )}
                <Button variant="outline" onClick={() => setViewPOOpen(false)}>Close Window</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* New Requisition Dialog */}
      <Dialog open={addReqOpen} onOpenChange={setAddReqOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>New Internal Requisition</DialogTitle><DialogDescription>Request items from the main warehouse</DialogDescription></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            <div className="space-y-1.5"><Label className="text-xs uppercase font-bold text-muted-foreground">Your Department</Label><Input value={newReq.department} onChange={e => setNewReq({...newReq, department: e.target.value})} placeholder="e.g. Housekeeping" /></div>
            <div className="md:col-span-2 space-y-3">
              <div className="flex justify-between items-center"><Label className="text-xs uppercase font-bold text-muted-foreground">Items Requested</Label><Button variant="outline" size="sm" onClick={() => setNewReq({...newReq, items: [...newReq.items, {item_id: "", quantity: 1}]})} className="h-8 text-xs gap-1"><Plus className="h-3 w-3" />Add Line Item</Button></div>
              <div className="border rounded-xl overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/30"><TableRow><TableHead>Product</TableHead><TableHead className="w-32">Qty</TableHead><TableHead className="w-12"></TableHead></TableRow></TableHeader>
                  <TableBody>
                    {newReq.items.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Select value={item.item_id} onValueChange={v => { const a = [...newReq.items]; a[idx].item_id = v; setNewReq({...newReq, items: a}); }}>
                            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select product" /></SelectTrigger>
                            <SelectContent>{masterItems.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell><Input type="number" className="h-9 text-xs" value={item.quantity} onChange={e => { const a = [...newReq.items]; a[idx].quantity = Number(e.target.value); setNewReq({...newReq, items: a}); }} /></TableCell>
                        <TableCell><Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => setNewReq({...newReq, items: newReq.items.filter((_, i) => i !== idx)})}><XCircle className="h-4 w-4" /></Button></TableCell>
                      </TableRow>
                    ))}
                    {newReq.items.length === 0 && <TableRow><TableCell colSpan={3} className="text-center py-6 text-muted-foreground italic text-xs">No items added to requisition</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
          <DialogFooter className="border-t pt-4"><Button onClick={handleCreateRequisition} disabled={!newReq.department || newReq.items.length === 0} className="w-full">Submit for Approval</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New PO Dialog */}
      <Dialog open={addPOOpen} onOpenChange={setAddPOOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Generate Purchase Order</DialogTitle><DialogDescription>Order items from a third-party supplier</DialogDescription></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase font-bold text-muted-foreground">Select Supplier</Label>
              <Select value={newPO.supplier_id} onValueChange={v => setNewPO({...newPO, supplier_id: v})}>
                <SelectTrigger className="h-10"><SelectValue placeholder="Which supplier?" /></SelectTrigger>
                <SelectContent>{suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label className="text-xs uppercase font-bold text-muted-foreground">Expected Arrival</Label><Input type="date" className="h-10" value={newPO.expected_delivery} onChange={e => setNewPO({...newPO, expected_delivery: e.target.value})} /></div>
            <div className="md:col-span-2 space-y-3 mt-4">
               <div className="flex justify-between items-center"><Label className="text-xs uppercase font-bold text-muted-foreground">Line Items</Label><Button variant="outline" size="sm" onClick={() => setNewPO({...newPO, items: [...newPO.items, {item_id: "", quantity: 1, unit_price: 0}]})} className="h-8 text-xs gap-1"><Plus className="h-3 w-3" />Add Product</Button></div>
              <div className="border rounded-xl overflow-hidden shadow-inner">
                <Table>
                  <TableHeader className="bg-muted/50"><TableRow><TableHead>Product</TableHead><TableHead className="w-24">Qty</TableHead><TableHead className="w-32">Unit Price ($)</TableHead><TableHead className="w-12"></TableHead></TableRow></TableHeader>
                  <TableBody>
                    {newPO.items.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Select value={item.item_id} onValueChange={v => {
                             const a = [...newPO.items];
                             const sel = masterItems.find(i => i.id === v);
                             a[idx].item_id = v;
                             a[idx].unit_price = sel?.cost_price || 0;
                             setNewPO({...newPO, items: a});
                          }}>
                            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Choose product" /></SelectTrigger>
                            <SelectContent>{masterItems.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell><Input type="number" className="h-9 text-xs" value={item.quantity} onChange={e => { const a = [...newPO.items]; a[idx].quantity = Number(e.target.value); setNewPO({...newPO, items: a}); }} /></TableCell>
                        <TableCell><Input type="number" className="h-9 text-xs" value={item.unit_price} onChange={e => { const a = [...newPO.items]; a[idx].unit_price = Number(e.target.value); setNewPO({...newPO, items: a}); }} /></TableCell>
                        <TableCell><Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => setNewPO({...newPO, items: newPO.items.filter((_, i) => i !== idx)})}><XCircle className="h-4 w-4" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
          <DialogFooter className="border-t pt-4"><Button onClick={handleCreatePO} disabled={!newPO.supplier_id || newPO.items.length === 0} className="w-full h-11">Issue Purchase Order</Button></DialogFooter>
        </DialogContent>
      </Dialog>

    </MainLayout>
  );
};

export default Inventory;
