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
  useInventoryReportData, useInventoryLocations, useInventoryRequisitions,
  useInventoryTransfers, useInventoryAudits, useInventoryRecipes,
  useInventoryWastage
} from "@/hooks/useInventory";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

// Modularized Components
import { ItemsTab } from "@/components/inventory/ItemsTab";
import { StatsCards } from "@/components/inventory/StatsCards";
import { TransferDialog } from "@/components/inventory/TransferDialog";
import { RequisitionsTab } from "@/components/inventory/RequisitionsTab";
import { OrdersTab } from "@/components/inventory/OrdersTab";
import { SuppliersTab } from "@/components/inventory/SuppliersTab";
import { CategoriesTab } from "@/components/inventory/CategoriesTab";
import { LocationsTab } from "@/components/inventory/LocationsTab";
import { TransfersTab } from "@/components/inventory/TransfersTab";
import { AuditsTab } from "@/components/inventory/AuditsTab";
import { RecipesTab } from "@/components/inventory/RecipesTab";
import { WastageTab } from "@/components/inventory/WastageTab";
import { MovementsTab } from "@/components/inventory/MovementsTab";
import { ReportsTab } from "@/components/inventory/ReportsTab";
import { ItemDialog } from "@/components/inventory/ItemDialog";
import { AdjustStockDialog } from "@/components/inventory/AdjustStockDialog";
import { StockOutDialog } from "@/components/inventory/StockOutDialog";
import { WastageDialog } from "@/components/inventory/WastageDialog";
import { BulkAdjustDialog } from "@/components/inventory/BulkAdjustDialog";
import { GeneralSettingsTab } from "@/components/inventory/GeneralSettingsTab";
import { SupplierDialog } from "@/components/inventory/SupplierDialog";
import { LocationDialog } from "@/components/inventory/LocationDialog";
import { CategoryDialog } from "@/components/inventory/CategoryDialog";

const Inventory = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [showLowStock, setShowLowStock] = useState(false);

  // Dialog States
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [adjustStockOpen, setAdjustStockOpen] = useState(false);
  const [bulkAdjustOpen, setBulkAdjustOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const [addReqOpen, setAddReqOpen] = useState(false);
  const [viewReqOpen, setViewReqOpen] = useState(false);
  const [selectedReq, setSelectedReq] = useState<any>(null);

  const [addPOOpen, setAddPOOpen] = useState(false);
  const [viewPOOpen, setViewPOOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<any>(null);

  const [addTransferOpen, setAddTransferOpen] = useState(false);
  const [viewTransferOpen, setViewTransferOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<any>(null);

  const [addAuditOpen, setAddAuditOpen] = useState(false);
  const [viewAuditOpen, setViewAuditOpen] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<any>(null);

  const [addRecipeOpen, setAddRecipeOpen] = useState(false);
  const [produceRecipeOpen, setProduceRecipeOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);

  const [addWastageOpen, setAddWastageOpen] = useState(false);
  const [selectedWastage, setSelectedWastage] = useState<any>(null);

  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any | null>(null);

  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<any | null>(null);

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any | null>(null);

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
  const { data: transfers = [], createTransfer, updateTransferStatus } = useInventoryTransfers();
  const { data: audits = [], createAudit, reconcileAudit } = useInventoryAudits();
  const { data: recipes = [], createRecipe, produceRecipe } = useInventoryRecipes();
  const { data: wastage = [], recordWastage } = useInventoryWastage();
  const { data: movements = [] } = useStockMovements();
  const stats = useInventoryStats();
  const { data: reportData = [] } = useInventoryReportData();

  const expiryWatchlist = useMemo(() => {
    return items.filter(i => i.expiry_date && new Date(i.expiry_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  }, [items]);

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
    // We fetch all active items for dropdowns to ensure selection works even if filtering is active
    return items;
  }, [items]);

  const [stockAdjustment, setStockAdjustment] = useState({
    quantity: 0, type: "in" as "in" | "out" | "adjustment", notes: "", department: "", locationId: "",
  });

  const [bulkAdjustments, setBulkAdjustments] = useState<any[]>([]);

  const [newReq, setNewReq] = useState({ department: "", notes: "", items: [] as { item_id: string; quantity: number }[] });

  const [newPO, setNewPO] = useState({
    supplier_id: "", order_date: format(new Date(), "yyyy-MM-dd"), expected_delivery: "", notes: "",
    items: [] as { item_id: string; quantity: number; unit_price: number }[],
  });

  const [newTransfer, setNewTransfer] = useState({
    from_location_id: "", to_location_id: "", notes: "",
    items: [] as { item_id: string; requested_quantity: number }[],
  });

  const [newAudit, setNewAudit] = useState({ location_id: "", item_ids: [] as string[] });
  const [reconcileData, setReconcileData] = useState<any[]>([]);

  const [newRecipe, setNewRecipe] = useState({
    name: "", description: "", category: "F&B", yield_quantity: 1, yield_unit: "portion",
    ingredients: [] as { item_id: string; quantity: number; unit: string }[]
  });

  const [productionQty, setProductionQty] = useState(1);
  const [wastageForm, setWastageForm] = useState({ item_id: "", quantity: 0, reason: "Expired", notes: "" });

  const resetForms = () => {
    setNewTransfer({ from_location_id: "", to_location_id: "", notes: "", items: [] });
    setNewRecipe({ name: "", description: "", category: "F&B", yield_quantity: 1, yield_unit: "portion", ingredients: [] });
    setNewAudit({ location_id: "", item_ids: [] });
    setWastageForm({ item_id: "", quantity: 0, reason: "Expired", notes: "" });
  };

  // Handlers
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
      const cleanItems = newReq.items.filter(i => i.item_id && i.quantity > 0);
      if (cleanItems.length === 0) return toast.error("Items must have valid product and quantity");

      await createRequisition.mutateAsync({ ...newReq, items: cleanItems } as any);
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
      const cleanItems = newPO.items.filter(i => i.item_id && i.quantity > 0);
      if (cleanItems.length === 0) return toast.error("Add valid items to order");

      const subtotal = cleanItems.reduce((sum, i) => sum + (i.quantity * i.unit_price), 0);
      await createPurchaseOrder.mutateAsync({
        ...newPO,
        items: cleanItems,
        subtotal,
        tax_amount: subtotal * 0.13,
        total: subtotal * 1.13,
        status: "sent"
      } as any);
      toast.success("Purchase order created");
      setAddPOOpen(false);
      setNewPO({ supplier_id: "", order_date: format(new Date(), "yyyy-MM-dd"), expected_delivery: "", notes: "", items: [] });
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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" orientation="vertical">
        <div className="flex flex-col md:flex-row gap-6 min-h-[calc(100vh-12rem)]">
          <div className="md:w-56 flex flex-col gap-6 shrink-0">
            <TabsList className="flex flex-col h-auto bg-muted/30 p-1.5 gap-6 border rounded-xl shadow-none items-stretch">
              <div className="space-y-1">
                <h3 className="text-[10px] uppercase font-bold text-muted-foreground mb-2 px-3 tracking-widest">General</h3>
                <TabsTrigger value="dashboard" className="w-full justify-start gap-3 py-2 px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><LayoutDashboard className="h-4 w-4" />Dashboard</TabsTrigger>
                <TabsTrigger value="reports" className="w-full justify-start gap-3 py-2 px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><BarChart3 className="h-4 w-4" />Reports</TabsTrigger>

                <h3 className="text-[10px] uppercase font-bold text-muted-foreground mt-4 mb-2 px-3 tracking-widest">Inventory Control</h3>
                <TabsTrigger value="items" className="w-full justify-start gap-3 py-2 px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><Package className="h-4 w-4" />Items</TabsTrigger>
                <TabsTrigger value="categories" className="w-full justify-start gap-3 py-2 px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><Layers className="h-4 w-4" />Categories</TabsTrigger>
                <TabsTrigger value="locations" className="w-full justify-start gap-3 py-2 px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><Warehouse className="h-4 w-4" />Locations</TabsTrigger>
                <TabsTrigger value="movements" className="w-full justify-start gap-3 py-2 px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><ArrowUpDown className="h-4 w-4" />Movements</TabsTrigger>

                <h3 className="text-[10px] uppercase font-bold text-muted-foreground mt-4 mb-2 px-3 tracking-widest">Procurement</h3>
                <TabsTrigger value="requisitions" className="w-full justify-start gap-3 py-2 px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><ClipboardList className="h-4 w-4" />Requisitions</TabsTrigger>
                <TabsTrigger value="orders" className="w-full justify-start gap-3 py-2 px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><ShoppingCart className="h-4 w-4" />Orders</TabsTrigger>
                <TabsTrigger value="suppliers" className="w-full justify-start gap-3 py-2 px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><Truck className="h-4 w-4" />Suppliers</TabsTrigger>

                <h3 className="text-[10px] uppercase font-bold text-muted-foreground mt-4 mb-2 px-3 tracking-widest">Logistics & Quality</h3>
                <TabsTrigger value="transfers" className="w-full justify-start gap-3 py-2 px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><RefreshCw className="h-4 w-4" />Transfers</TabsTrigger>
                <TabsTrigger value="audits" className="w-full justify-start gap-3 py-2 px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><CheckCircle2 className="h-4 w-4" />Audits</TabsTrigger>
                <TabsTrigger value="recipes" className="w-full justify-start gap-3 py-2 px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><Layers className="h-4 w-4" />Recipes</TabsTrigger>
                <TabsTrigger value="wastage" className="w-full justify-start gap-3 py-2 px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><Trash2 className="h-4 w-4" />Wastage</TabsTrigger>

                <h3 className="text-[10px] uppercase font-bold text-muted-foreground mt-4 mb-2 px-3 tracking-widest">Configuration</h3>
                <TabsTrigger value="settings" className="w-full justify-start gap-3 py-2 px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><Settings2 className="h-4 w-4" />General Settings</TabsTrigger>
              </div>
            </TabsList>

            <div className="hidden md:block mt-auto">
              <Card className="bg-primary/5 border-primary/10">
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-bold">System Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Low Stock Items</span>
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">{stats.lowStock}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Pending Reqs</span>
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">{requisitions.filter(r => r.status === "pending").length}</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex-1 space-y-6">
            <TabsContent value="dashboard" className="space-y-6 mt-0">
              <StatsCards
                stats={stats}
                requisitions={requisitions}
                purchaseOrders={purchaseOrders}
                wastage={wastage}
                onTabChange={setActiveTab}
                onShowLowStock={() => { setShowLowStock(true); setActiveTab("items"); }}
              />

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
                <CardTitle className="text-lg">Expiry Watchlist</CardTitle>
                <CardDescription>Perishables expiring within 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {expiryWatchlist.slice(0, 5).map(item => (
                    <div key={item.id} className="flex justify-between items-center text-xs p-2 bg-muted/30 rounded-lg">
                      <div>
                        <p className="font-bold">{item.name}</p>
                        <p className="text-[10px] text-muted-foreground">Expires: {item.expiry_date}</p>
                      </div>
                      <Badge variant="destructive">{item.current_stock} {item.unit} left</Badge>
                    </div>
                  ))}
                  {expiryWatchlist.length === 0 && (
                    <p className="text-center py-4 text-muted-foreground italic text-xs">No imminent expirations</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-2">
                <Button variant="outline" className="justify-start gap-3 h-12" onClick={() => {
                  setSelectedItem(null);
                  setItemDialogOpen(true);
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
          <ItemsTab
            items={items}
            categories={categories}
            locations={locations}
            isLoading={isLoading}
            onAddItem={() => {
              setSelectedItem(null);
              setItemDialogOpen(true);
            }}
            onEditItem={(item) => {
              setSelectedItem(item);
              setItemDialogOpen(true);
            }}
            onAdjustStock={(itemId, type) => {
              setSelectedItemId(itemId);
              if (type === "out") {
                const item = items.find(i => i.id === itemId);
                setStockAdjustment({ ...stockAdjustment, type: "out", quantity: 0, department: item?.department || "" });
                setStockOutOpen(true);
              } else {
                setStockAdjustment({ ...stockAdjustment, type: "in", quantity: 0 });
                setAdjustStockOpen(true);
              }
            }}
            onExport={handleExport}
          />
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <CategoriesTab
            categories={categories}
            onAddCategory={() => { setSelectedCategory(null); setCategoryDialogOpen(true); }}
            onEditCategory={(c) => { setSelectedCategory(c); setCategoryDialogOpen(true); }}
            onDeleteCategory={(id) => { if (confirm("Delete category?")) deleteCategory.mutate(id); }}
          />
        </TabsContent>

        <TabsContent value="requisitions" className="space-y-4">
          <RequisitionsTab
            requisitions={requisitions}
            onAddRequisition={() => setAddReqOpen(true)}
            onApprove={handleApproveReq}
            onConvertToPO={(id) => convertToPO.mutate(id)}
            onViewDetails={(req) => { setSelectedReq(req); setViewReqOpen(true); }}
            onDelete={(id) => { if (confirm("Cancel requisition?")) deleteRequisition.mutate(id); }}
          />
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <OrdersTab
            purchaseOrders={purchaseOrders}
            onAddPO={() => setAddPOOpen(true)}
            onViewDetails={(po) => { setSelectedPO(po); setViewPOOpen(true); }}
          />
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-4">
          <SuppliersTab
            suppliers={suppliers}
            onAddSupplier={() => { setSelectedSupplier(null); setSupplierDialogOpen(true); }}
            onEditSupplier={(s) => { setSelectedSupplier(s); setSupplierDialogOpen(true); }}
            onDeleteSupplier={(id) => { if (confirm("Delete supplier?")) deleteSupplier.mutate(id); }}
          />
        </TabsContent>

        <TabsContent value="locations" className="space-y-4">
          <LocationsTab
            locations={locations}
            items={items}
            onAddLocation={() => { setSelectedLocation(null); setLocationDialogOpen(true); }}
            onEditLocation={(loc) => { setSelectedLocation(loc); setLocationDialogOpen(true); }}
            onDeleteLocation={(id) => { if (confirm("Delete location?")) deleteLocation.mutate(id); }}
            onViewStock={(id) => { setLocationFilter(id); setActiveTab("items"); }}
          />
        </TabsContent>

        <TabsContent value="transfers" className="space-y-4">
          <TransfersTab
            transfers={transfers}
            onAddTransfer={() => setAddTransferOpen(true)}
            onUpdateStatus={(id, status) => updateTransferStatus.mutate({ id, status })}
            onViewDetails={(trf) => { setSelectedTransfer(trf); setViewTransferOpen(true); }}
          />
        </TabsContent>

        <TabsContent value="audits" className="space-y-4">
          <AuditsTab
            audits={audits}
            onAddAudit={() => setAddAuditOpen(true)}
            onReconcile={(audit) => {
              setSelectedAudit(audit);
              setReconcileData(audit.items.map((i: any) => ({ id: i.id, item_id: i.item_id, physical_stock: i.theoretical_stock, reason: "" })));
              setViewAuditOpen(true);
            }}
            onViewDetails={(audit) => { setSelectedAudit(audit); setViewAuditOpen(true); }}
          />
        </TabsContent>

        <TabsContent value="recipes" className="space-y-4">
          <RecipesTab
            recipes={recipes}
            onAddRecipe={() => setAddRecipeOpen(true)}
            onProduce={(recipe) => { setSelectedRecipe(recipe); setProductionQty(recipe.yield_quantity); setProduceRecipeOpen(true); }}
          />
        </TabsContent>

        <TabsContent value="wastage" className="space-y-4">
          <WastageTab
            wastage={wastage}
            onAddWastage={() => setAddWastageOpen(true)}
          />
        </TabsContent>

        <TabsContent value="movements" className="space-y-4">
          <MovementsTab
            movements={movements}
            onExport={handleExport}
          />
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <ReportsTab
            reportData={reportData}
            stats={stats}
          />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <GeneralSettingsTab />
        </TabsContent>

      <ItemDialog
        open={itemDialogOpen}
        onOpenChange={setItemDialogOpen}
        item={selectedItem}
        categories={categories}
        locations={locations}
        onSave={async (data) => {
          if (selectedItem) {
            const { current_stock, ...updates } = data;
            await updateItem.mutateAsync({ id: selectedItem.id, ...updates } as any);
            toast.success("Item updated");
          } else {
            await createItem.mutateAsync(data as any);
            toast.success("Item created");
          }
          setItemDialogOpen(false);
        }}
        onDelete={(id) => deleteItem.mutate(id)}
      />

      <AdjustStockDialog
        open={adjustStockOpen}
        onOpenChange={setAdjustStockOpen}
        onAdjust={async (data) => {
          if (!selectedItemId) return;
          await adjustStock.mutateAsync({ itemId: selectedItemId, ...data });
          toast.success("Stock adjusted");
        }}
      />

      <BulkAdjustDialog
        open={bulkAdjustOpen}
        onOpenChange={setBulkAdjustOpen}
        items={items}
        onApply={async (adjustments) => {
          for (const adj of adjustments) {
            await adjustStock.mutateAsync(adj);
          }
          toast.success("Bulk adjustment completed");
        }}
      />

      <StockOutDialog
        open={stockOutOpen}
        onOpenChange={setStockOutOpen}
        initialDepartment={items.find(i => i.id === selectedItemId)?.department || ""}
        onConfirm={async (data) => {
          if (!selectedItemId) return;
          await adjustStock.mutateAsync({ itemId: selectedItemId, ...data, type: "out" });
          toast.success("Consumption logged");
        }}
      />

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

      <TransferDialog
        open={addTransferOpen}
        onOpenChange={setAddTransferOpen}
        locations={locations}
        items={items}
        onCreate={async (data) => {
          await createTransfer.mutateAsync(data as any);
          toast.success("Transfer created");
        }}
      />

      {/* Audit Reconcile Dialog */}
      <Dialog open={viewAuditOpen} onOpenChange={setViewAuditOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Audit Reconciliation: {selectedAudit?.audit_number}</DialogTitle></DialogHeader>
          <Table>
            <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>System</TableHead><TableHead className="w-24">Physical</TableHead><TableHead>Variance</TableHead><TableHead>Reason</TableHead></TableRow></TableHeader>
            <TableBody>
              {selectedAudit?.items?.map((item: any, idx: number) => {
                const reconcileItem = reconcileData.find(rd => rd.id === item.id) || { physical_stock: item.theoretical_stock, reason: "" };
                const variance = reconcileItem.physical_stock - item.theoretical_stock;
                return (
                  <TableRow key={item.id}>
                    <TableCell className="text-xs">{item.item?.name}</TableCell>
                    <TableCell className="text-xs font-mono">{item.theoretical_stock}</TableCell>
                    <TableCell><Input type="number" className="h-8 text-xs" value={reconcileItem.physical_stock} onChange={e => {
                      const newData = [...reconcileData];
                      const idxInReconcile = newData.findIndex(rd => rd.id === item.id);
                      if (idxInReconcile !== -1) {
                        newData[idxInReconcile].physical_stock = Number(e.target.value);
                        setReconcileData(newData);
                      }
                    }} disabled={selectedAudit.status === "completed"} /></TableCell>
                    <TableCell className={`text-xs font-bold ${variance < 0 ? "text-destructive" : variance > 0 ? "text-success" : ""}`}>{variance > 0 ? "+" : ""}{variance}</TableCell>
                    <TableCell><Input className="h-8 text-xs" value={reconcileItem.reason} onChange={e => {
                      const newData = [...reconcileData];
                      const idxInReconcile = newData.findIndex(rd => rd.id === item.id);
                      if (idxInReconcile !== -1) {
                        newData[idxInReconcile].reason = e.target.value;
                        setReconcileData(newData);
                      }
                    }} disabled={selectedAudit.status === "completed"} /></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewAuditOpen(false)}>Close</Button>
            {selectedAudit?.status === "in_progress" && (
              <Button onClick={async () => {
                await reconcileAudit.mutateAsync({ audit_id: selectedAudit.id, items: reconcileData });
                toast.success("Audit completed and stock reconciled");
                setViewAuditOpen(false);
              }}>Submit Final Reconcile</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Production Dialog */}
      <Dialog open={produceRecipeOpen} onOpenChange={setProduceRecipeOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Recipe Production: {selectedRecipe?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5"><Label>Quantity to Produce ({selectedRecipe?.yield_unit})</Label><Input type="number" value={productionQty} onChange={e => setProductionQty(Number(e.target.value))} /></div>
            <div className="bg-muted/30 p-4 rounded-lg space-y-2">
              <Label className="text-[10px] uppercase font-bold">Estimated Ingredient Usage</Label>
              {selectedRecipe?.ingredients?.map((ing: any) => (
                <div key={ing.id} className="flex justify-between text-xs">
                  <span>{ing.item?.name}</span>
                  <span className="font-mono">{ing.quantity * (productionQty / selectedRecipe.yield_quantity)} {ing.unit || ing.item?.unit}</span>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter><Button onClick={async () => { await produceRecipe.mutateAsync({ recipe_id: selectedRecipe.id, quantity: productionQty }); toast.success("Production recorded, ingredients deducted"); setProduceRecipeOpen(false); }} className="w-full">Confirm Production</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Audit Dialog */}
      <Dialog open={addAuditOpen} onOpenChange={setAddAuditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Initiate Stock Audit</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5"><Label>Audit Location</Label>
              <Select value={newAudit.location_id} onValueChange={v => setNewAudit({...newAudit, location_id: v})}>
                <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                <SelectContent>{locations.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground italic">Note: All items in this location will be included in the audit sheet for verification.</p>
          </div>
          <DialogFooter><Button onClick={async () => {
            const itemIds = items.filter(i => i.location_id === newAudit.location_id).map(i => i.id);
            if(itemIds.length === 0) return toast.error("No items in this location");
            await createAudit.mutateAsync({ location_id: newAudit.location_id, item_ids: itemIds });
            toast.success("Audit initiated");
            setAddAuditOpen(false);
          }} className="w-full">Start Audit Session</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Recipe Dialog */}
      <Dialog open={addRecipeOpen} onOpenChange={setAddRecipeOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Define New Recipe / BOM</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
             <div className="col-span-2 space-y-1.5"><Label>Recipe Name</Label><Input value={newRecipe.name} onChange={e => setNewRecipe({...newRecipe, name: e.target.value})} /></div>
             <div className="space-y-1.5"><Label>Yield Quantity</Label><Input type="number" value={newRecipe.yield_quantity} onChange={e => setNewRecipe({...newRecipe, yield_quantity: Number(e.target.value)})} /></div>
             <div className="space-y-1.5"><Label>Yield Unit</Label><Input value={newRecipe.yield_unit} onChange={e => setNewRecipe({...newRecipe, yield_unit: e.target.value})} /></div>
             <div className="col-span-2 space-y-3">
               <div className="flex justify-between items-center"><Label>Ingredients</Label><Button variant="outline" size="sm" onClick={() => setNewRecipe({...newRecipe, ingredients: [...newRecipe.ingredients, {item_id: "", quantity: 1, unit: ""}]})}>Add Ingredient</Button></div>
               <Table>
                 <TableBody>
                   {newRecipe.ingredients.map((ing, idx) => (
                     <TableRow key={idx}>
                       <TableCell>
                         <Select value={ing.item_id} onValueChange={v => { const a = [...newRecipe.ingredients]; a[idx].item_id = v; setNewRecipe({...newRecipe, ingredients: a}); }}>
                           <SelectTrigger className="h-9"><SelectValue placeholder="Ingredient" /></SelectTrigger>
                           <SelectContent>{items.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent>
                         </Select>
                       </TableCell>
                       <TableCell><Input type="number" className="h-9" value={ing.quantity} onChange={e => { const a = [...newRecipe.ingredients]; a[idx].quantity = Number(e.target.value); setNewRecipe({...newRecipe, ingredients: a}); }} /></TableCell>
                       <TableCell><Input className="h-9" placeholder="Unit" value={ing.unit} onChange={e => { const a = [...newRecipe.ingredients]; a[idx].unit = e.target.value; setNewRecipe({...newRecipe, ingredients: a}); }} /></TableCell>
                       <TableCell><Button variant="ghost" size="icon" onClick={() => setNewRecipe({...newRecipe, ingredients: newRecipe.ingredients.filter((_, i) => i !== idx)})}><Trash2 className="h-4 w-4" /></Button></TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
             </div>
          </div>
          <DialogFooter><Button onClick={async () => { await createRecipe.mutateAsync(newRecipe as any); toast.success("Recipe defined"); setAddRecipeOpen(false); }} className="w-full">Save Recipe</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <WastageDialog
        open={addWastageOpen}
        onOpenChange={setAddWastageOpen}
        items={items}
        onConfirm={async (data) => {
          await recordWastage.mutateAsync(data as any);
          toast.success("Wastage recorded");
        }}
      />

      <SupplierDialog
        open={supplierDialogOpen}
        onOpenChange={setSupplierDialogOpen}
        supplier={selectedSupplier}
        onSave={async (data) => {
          if (selectedSupplier) {
            await updateSupplier.mutateAsync({ id: selectedSupplier.id, ...data });
            toast.success("Supplier updated");
          } else {
            await createSupplier.mutateAsync(data);
            toast.success("Supplier created");
          }
        }}
      />

      <LocationDialog
        open={locationDialogOpen}
        onOpenChange={setLocationDialogOpen}
        location={selectedLocation}
        onSave={async (data) => {
          if (selectedLocation) {
            await updateLocation.mutateAsync({ id: selectedLocation.id, ...data });
            toast.success("Location updated");
          } else {
            await createLocation.mutateAsync(data);
            toast.success("Location created");
          }
        }}
      />

      <CategoryDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        category={selectedCategory}
        onSave={async (data) => {
          if (selectedCategory) {
            await updateCategory.mutateAsync({ id: selectedCategory.id, ...data });
            toast.success("Category updated");
          } else {
            await createCategory.mutateAsync(data);
            toast.success("Category created");
          }
        }}
      />

          </div>
        </div>
      </Tabs>
    </MainLayout>
  );
};

export default Inventory;
