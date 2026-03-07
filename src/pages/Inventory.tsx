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
  QrCode, ClipboardList, CheckCircle2, XCircle, Camera, LayoutDashboard, ShoppingCart
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
  ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie
} from "recharts";

const Inventory = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showLowStock, setShowLowStock] = useState(false);

  const [addItemOpen, setAddItemOpen] = useState(false);
  const [adjustStockOpen, setAdjustStockOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const [addReqOpen, setAddReqOpen] = useState(false);

  const [addPOOpen, setAddPOOpen] = useState(false);
  const [viewPOOpen, setViewPOOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<any>(null);

  const [addLocationOpen, setAddLocationOpen] = useState(false);
  const [stockOutOpen, setStockOutOpen] = useState(false);

  const { data: items = [], isLoading, createItem, adjustStock } = useInventoryItems({
    search: searchQuery,
    category: categoryFilter !== "all" ? categoryFilter : undefined,
    lowStock: showLowStock,
    showInactive: true
  });

  const { data: categories = [] } = useInventoryCategories();
  const { data: locations = [], createLocation } = useInventoryLocations();
  const { data: suppliers = [], createSupplier } = useSuppliers({ showInactive: true });
  const { data: purchaseOrders = [], createPurchaseOrder, updatePurchaseOrderStatus } = usePurchaseOrders();
  const { data: requisitions = [], createRequisition, updateRequisitionStatus, convertToPO } = useInventoryRequisitions();
  const { data: movements = [] } = useStockMovements();
  const stats = useInventoryStats();
  const { data: reportData = [] } = useInventoryReportData();

  const [newItem, setNewItem] = useState({
    name: "",
    sku: "",
    barcode: "",
    image_url: "",
    category_id: "",
    supplier_id: "",
    location_id: "",
    unit: "pieces",
    current_stock: 0,
    min_stock: 0,
    reorder_point: 0,
    cost_price: 0,
    department: "",
    is_active: true,
  });

  const [stockAdjustment, setStockAdjustment] = useState({
    quantity: 0,
    type: "in" as "in" | "out" | "adjustment",
    notes: "",
    department: "",
    locationId: "",
  });

  const [newReq, setNewReq] = useState({
    department: "",
    notes: "",
    items: [] as { item_id: string; quantity: number }[],
  });

  const [newPO, setNewPO] = useState({
    supplier_id: "",
    order_date: format(new Date(), "yyyy-MM-dd"),
    expected_delivery: "",
    notes: "",
    items: [] as { item_id: string; quantity: number; unit_price: number }[],
  });

  const [newLocation, setNewLocation] = useState({ name: "", description: "" });

  const handleCreateItem = async () => {
    try {
      await createItem.mutateAsync(newItem as any);
      toast.success("Item created successfully");
      setAddItemOpen(false);
    } catch (error) {
      toast.error("Failed to create item");
    }
  };

  const handleAdjustStock = async () => {
    if (!selectedItemId) return;
    try {
      await adjustStock.mutateAsync({ itemId: selectedItemId, ...stockAdjustment });
      toast.success("Stock adjusted successfully");
      setAdjustStockOpen(false);
    } catch (error) {
      toast.error("Failed to adjust stock");
    }
  };

  const handleCreateRequisition = async () => {
    try {
      if (newReq.items.length === 0) return toast.error("Add at least one item");
      await createRequisition.mutateAsync(newReq as any);
      toast.success("Requisition submitted for approval");
      setAddReqOpen(false);
      setNewReq({ department: "", notes: "", items: [] });
    } catch (error) {
      toast.error("Failed to submit requisition");
    }
  };

  const handleApproveReq = async (id: string) => {
    try {
      await updateRequisitionStatus.mutateAsync({ id, status: "approved" });
      toast.success("Requisition approved");
    } catch (error) {
      toast.error("Failed to approve");
    }
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
    } catch (error) {
      toast.error("Failed to create PO");
    }
  };

  const handleStockOut = async () => {
    if (!selectedItemId) return;
    try {
      await adjustStock.mutateAsync({
        itemId: selectedItemId,
        quantity: stockAdjustment.quantity,
        type: "out",
        notes: stockAdjustment.notes,
        department: stockAdjustment.department
      });
      toast.success("Consumption recorded");
      setStockOutOpen(false);
    } catch (error) {
      toast.error("Failed to record consumption");
    }
  };

  const exportToExcel = (data: any[], fileName: string) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, `${fileName}_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
  };

  return (
    <MainLayout title="Inventory Management" subtitle="Comprehensive stock tracking and procurement">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
          <TabsTrigger value="dashboard" className="gap-2"><LayoutDashboard className="h-4 w-4" />Dashboard</TabsTrigger>
          <TabsTrigger value="items" className="gap-2"><Package className="h-4 w-4" />Items</TabsTrigger>
          <TabsTrigger value="requisitions" className="gap-2"><ClipboardList className="h-4 w-4" />Requisitions</TabsTrigger>
          <TabsTrigger value="orders" className="gap-2"><ShoppingCart className="h-4 w-4" />Orders</TabsTrigger>
          <TabsTrigger value="suppliers" className="gap-2"><Truck className="h-4 w-4" />Suppliers</TabsTrigger>
          <TabsTrigger value="locations" className="gap-2"><Warehouse className="h-4 w-4" />Locations</TabsTrigger>
          <TabsTrigger value="movements" className="gap-2"><ArrowUpDown className="h-4 w-4" />Movements</TabsTrigger>
          <TabsTrigger value="reports" className="gap-2"><BarChart3 className="h-4 w-4" />Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-primary/5 border-primary/20 shadow-sm">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Inventory Value</p>
                    <p className="text-2xl font-bold text-primary">${stats.totalValue.toLocaleString()}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-primary/40" />
                </div>
              </CardContent>
            </Card>
            <Card className={`shadow-sm ${stats.lowStock > 0 ? "bg-amber-500/5 border-amber-500/20" : ""}`}>
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
            <Card className="shadow-sm">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pending Requisitions</p>
                    <p className="text-2xl font-bold">{requisitions.filter(r => r.status === "pending").length}</p>
                  </div>
                  <ClipboardList className="h-8 w-8 text-muted-foreground/20" />
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
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
                            setNewReq({ department: "General", notes: "Auto-generated from low stock alert", items: [{ item_id: item.id, quantity: item.reorder_point * 2 }] });
                            setAddReqOpen(true);
                          }}>Restock</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {items.filter(i => i.current_stock <= i.reorder_point).length === 0 && (
                      <TableRow><TableCell colSpan={4} className="text-center py-4 text-muted-foreground">All stock levels are healthy</TableCell></TableRow>
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
                <Button variant="outline" className="justify-start gap-3" onClick={() => setAddItemOpen(true)}>
                  <Plus className="h-4 w-4" /> Add New Item
                </Button>
                <Button variant="outline" className="justify-start gap-3" onClick={() => setAddReqOpen(true)}>
                  <ClipboardList className="h-4 w-4" /> Submit Requisition
                </Button>
                <Button variant="outline" className="justify-start gap-3" onClick={() => setActiveTab("movements")}>
                  <ArrowUpDown className="h-4 w-4" /> Record Movement
                </Button>
                <Button variant="outline" className="justify-start gap-3" onClick={() => exportToExcel(items, "Inventory_Report")}>
                  <FileDown className="h-4 w-4" /> Export Stock List
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="items" className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="flex gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search name, SKU, or barcode..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              <Button variant="outline" size="icon"><QrCode className="h-4 w-4" /></Button>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="gold" onClick={() => setAddItemOpen(true)} className="gap-2"><Plus className="h-4 w-4" />Add Item</Button>
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
                  <TableRow><TableCell colSpan={7} className="text-center py-10"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                ) : items.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {item.image_url ? (
                        <img src={item.image_url} alt="" className="h-8 w-8 rounded object-cover" />
                      ) : (
                        <div className="h-8 w-8 rounded bg-muted flex items-center justify-center"><Package className="h-4 w-4 text-muted-foreground" /></div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{item.name}</span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-mono">{item.sku}</span>
                          {item.barcode && <span className="flex items-center gap-1"><QrCode className="h-3 w-3" />{item.barcode}</span>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{item.category?.name || "Uncategorized"}</Badge></TableCell>
                    <TableCell className="text-sm">{item.location?.name || "No Location"}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className={`font-bold ${item.current_stock <= item.reorder_point ? "text-amber-500" : ""}`}>
                          {item.current_stock} {item.unit}
                        </span>
                        <div className="h-1 w-20 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full ${item.current_stock <= item.reorder_point ? "bg-amber-500" : "bg-success"}`}
                            style={{ width: `${Math.min(100, (item.current_stock / (item.reorder_point * 2)) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>${item.cost_price.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setSelectedItemId(item.id); setStockOutOpen(true); }} title="Record Consumption"><TrendingDown className="h-4 w-4 text-destructive" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { setSelectedItemId(item.id); setAdjustStockOpen(true); }} title="Adjust Stock"><Plus className="h-4 w-4 text-success" /></Button>
                      </div>
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
              <Card key={req.id} className="overflow-hidden shadow-sm">
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
                      <p className="text-sm text-muted-foreground">Dept: {req.department} • Requested by {req.requested_by_name || "Staff"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden md:block">
                      <p className="text-xs text-muted-foreground">{format(new Date(req.created_at), "MMM d, yyyy")}</p>
                      <p className="text-sm font-medium">{req.items?.length || 0} items requested</p>
                    </div>
                    <div className="flex gap-2">
                      {req.status === "pending" && (
                        <Button variant="outline" size="sm" className="text-success gap-2" onClick={() => handleApproveReq(req.id)}><CheckCircle2 className="h-4 w-4" />Approve</Button>
                      )}
                      {req.status === "approved" && (
                        <Button variant="gold" size="sm" className="gap-2" onClick={() => convertToPO.mutate(req.id)}><ShoppingCart className="h-4 w-4" />Generate PO</Button>
                      )}
                      <Button variant="ghost" size="sm">Details</Button>
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
                  <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No purchase orders found</TableCell></TableRow>
                ) : purchaseOrders.map(po => (
                  <TableRow key={po.id}>
                    <TableCell className="font-mono">{po.order_number}</TableCell>
                    <TableCell>{po.supplier?.name || "-"}</TableCell>
                    <TableCell>{format(new Date(po.order_date), "MMM d, yyyy")}</TableCell>
                    <TableCell>
                      <Badge className={
                        po.status === "received" ? "bg-success/20 text-success" :
                        po.status === "sent" ? "bg-blue-500/20 text-blue-400" :
                        "bg-muted text-muted-foreground"
                      }>{po.status}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">${po.total.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedPO(po); setViewPOOpen(true); }}>View</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-4">
           <div className="flex justify-end">
              <Button variant="gold" className="gap-2"><Plus className="h-4 w-4" />Add Supplier</Button>
           </div>
           <Card className="shadow-sm">
             <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliers.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>{s.contact_person || "-"}</TableCell>
                      <TableCell>{s.email || "-"}</TableCell>
                      <TableCell>{s.phone || "-"}</TableCell>
                      <TableCell className="text-right"><Button variant="ghost" size="sm">Edit</Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
             </Table>
           </Card>
        </TabsContent>

        <TabsContent value="locations" className="space-y-4">
           <div className="flex justify-end">
              <Button variant="gold" className="gap-2" onClick={() => setAddLocationOpen(true)}><Plus className="h-4 w-4" />Add Location</Button>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {locations.map(loc => (
                <Card key={loc.id} className="shadow-sm border-l-4 border-l-primary">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2"><Warehouse className="h-5 w-5 text-primary" />{loc.name}</CardTitle>
                    <CardDescription>{loc.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Items stored:</span>
                      <span className="font-bold">{items.filter(i => i.location_id === loc.id).length}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
           </div>
        </TabsContent>

        <TabsContent value="movements" className="space-y-4">
           <Card className="shadow-sm">
             <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Dept/Note</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">No recent movements</TableCell></TableRow>
                  ) : movements.map(m => (
                    <TableRow key={m.id}>
                      <TableCell className="text-xs">{format(new Date(m.created_at), "MMM d, HH:mm")}</TableCell>
                      <TableCell className="font-medium">{(m.item as any)?.name}</TableCell>
                      <TableCell>
                        <Badge className={
                          m.movement_type === "in" ? "bg-success/20 text-success" :
                          m.movement_type === "out" ? "bg-destructive/20 text-destructive" :
                          "bg-muted text-muted-foreground"
                        }>{m.movement_type}</Badge>
                      </TableCell>
                      <TableCell className="font-bold">{m.quantity}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{m.department || m.notes || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
             </Table>
           </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-sm">
              <CardHeader><CardTitle className="text-lg">Inventory Valuation Trend</CardTitle></CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={reportData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                    <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} interval={4} />
                    <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                    <RechartsTooltip />
                    <Line type="monotone" dataKey="value" stroke="#EAB308" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader><CardTitle className="text-lg">Category Distribution</CardTitle></CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={Object.entries(stats.categoryDistribution || {}).map(([name, value]) => ({ name, value }))} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {Object.entries(stats.categoryDistribution || {}).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={[`#EAB308`, `#3B82F6`, `#10B981`, `#F59E0B`, `#6366F1`][index % 5]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value: number) => [`$${value.toFixed(2)}`, "Value"]} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <Dialog open={addItemOpen} onOpenChange={setAddItemOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Add Inventory Item</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2 flex justify-center py-4 bg-muted/30 rounded-lg border-2 border-dashed border-muted cursor-pointer hover:bg-muted/50 transition-colors">
               <div className="flex flex-col items-center gap-2">
                  <Camera className="h-8 w-8 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Click to upload item image</span>
               </div>
            </div>
            <div className="space-y-2"><Label>Name *</Label><Input value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} /></div>
            <div className="space-y-2"><Label>Barcode / GTIN</Label><Input value={newItem.barcode} onChange={e => setNewItem({...newItem, barcode: e.target.value})} placeholder="Scan or enter barcode" /></div>
            <div className="space-y-2"><Label>SKU</Label><Input value={newItem.sku} onChange={e => setNewItem({...newItem, sku: e.target.value})} /></div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={newItem.category_id} onValueChange={v => setNewItem({...newItem, category_id: v})}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Warehouse Location</Label>
              <Select value={newItem.location_id} onValueChange={v => setNewItem({...newItem, location_id: v})}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{locations.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Initial Stock</Label><Input type="number" value={newItem.current_stock} onChange={e => setNewItem({...newItem, current_stock: Number(e.target.value)})} /></div>
            <div className="space-y-2"><Label>Reorder Point</Label><Input type="number" value={newItem.reorder_point} onChange={e => setNewItem({...newItem, reorder_point: Number(e.target.value)})} /></div>
            <div className="space-y-2"><Label>Unit Cost</Label><Input type="number" value={newItem.cost_price} onChange={e => setNewItem({...newItem, cost_price: Number(e.target.value)})} /></div>
            <div className="space-y-2"><Label>Unit (e.g. Kg, Pcs)</Label><Input value={newItem.unit} onChange={e => setNewItem({...newItem, unit: e.target.value})} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddItemOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateItem}>Save Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={stockOutOpen} onOpenChange={setStockOutOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Consumption</DialogTitle><DialogDescription>Deduct stock for internal use</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Consuming Department</Label>
              <Select value={stockAdjustment.department} onValueChange={v => setStockAdjustment({...stockAdjustment, department: v})}>
                <SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Housekeeping">Housekeeping</SelectItem>
                  <SelectItem value="Kitchen">Kitchen</SelectItem>
                  <SelectItem value="Bar">Bar</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Quantity to Remove</Label><Input type="number" value={stockAdjustment.quantity} onChange={e => setStockAdjustment({...stockAdjustment, quantity: Number(e.target.value)})} /></div>
            <div className="space-y-2"><Label>Reason/Notes</Label><Input value={stockAdjustment.notes} onChange={e => setStockAdjustment({...stockAdjustment, notes: e.target.value})} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStockOutOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleStockOut}>Record Out</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addReqOpen} onOpenChange={setAddReqOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>New Internal Requisition</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2"><Label>Department</Label><Input value={newReq.department} onChange={e => setNewReq({...newReq, department: e.target.value})} /></div>
            <div className="col-span-2 space-y-4">
              <Label>Items Requested</Label>
              <Table className="border rounded-md">
                <TableHeader><TableRow><TableHead>Item</TableHead><TableHead className="w-24">Qty</TableHead><TableHead className="w-10"></TableHead></TableRow></TableHeader>
                <TableBody>
                  {newReq.items.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <Select value={item.item_id} onValueChange={v => {
                          const updatedReqItems = [...newReq.items];
                          updatedReqItems[idx].item_id = v;
                          setNewReq({...newReq, items: updatedReqItems});
                        }}>
                          <SelectTrigger><SelectValue placeholder="Select Item" /></SelectTrigger>
                          <SelectContent>{items.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell><Input type="number" value={item.quantity} onChange={e => {
                        const updatedReqItems = [...newReq.items];
                        updatedReqItems[idx].quantity = Number(e.target.value);
                        setNewReq({...newReq, items: updatedReqItems});
                      }} /></TableCell>
                      <TableCell><Button variant="ghost" size="sm" onClick={() => setNewReq({...newReq, items: newReq.items.filter((_, i) => i !== idx)})}>&times;</Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Button variant="outline" size="sm" onClick={() => setNewReq({...newReq, items: [...newReq.items, {item_id: "", quantity: 1}]})}><Plus className="h-4 w-4 mr-2" />Add Item</Button>
            </div>
          </div>
          <DialogFooter><Button onClick={handleCreateRequisition}>Submit Requisition</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PO View Dialog */}
      <Dialog open={viewPOOpen} onOpenChange={setViewPOOpen}>
        <DialogContent className="max-w-3xl">
          {selectedPO && (
            <>
              <DialogHeader>
                <div className="flex justify-between items-center w-full">
                  <DialogTitle>Order {selectedPO.order_number}</DialogTitle>
                  <Badge>{selectedPO.status}</Badge>
                </div>
              </DialogHeader>
              <div className="py-4">
                <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                  <div><Label className="text-muted-foreground">Supplier</Label><p className="font-medium">{selectedPO.supplier?.name}</p></div>
                  <div><Label className="text-muted-foreground">Date</Label><p>{format(new Date(selectedPO.order_date), "MMM d, yyyy")}</p></div>
                </div>
                <Table>
                  <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Qty</TableHead><TableHead>Unit</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {selectedPO.items?.map((i: any) => (
                      <TableRow key={i.id}>
                        <TableCell>{i.item?.name}</TableCell>
                        <TableCell>{i.quantity}</TableCell>
                        <TableCell>${i.unit_price}</TableCell>
                        <TableCell className="text-right">${(i.quantity * i.unit_price).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="text-right mt-4 font-bold text-lg">Total: ${selectedPO.total.toFixed(2)}</div>
              </div>
              <DialogFooter>
                {selectedPO.status === "sent" && (
                  <Button variant="gold" onClick={() => updatePurchaseOrderStatus.mutate({ id: selectedPO.id, status: "received" })}>Mark Received</Button>
                )}
                <Button variant="outline" onClick={() => setViewPOOpen(false)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* New PO Dialog */}
      <Dialog open={addPOOpen} onOpenChange={setAddPOOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>New Purchase Order</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Supplier</Label>
              <Select value={newPO.supplier_id} onValueChange={v => setNewPO({...newPO, supplier_id: v})}>
                <SelectTrigger><SelectValue placeholder="Select Supplier" /></SelectTrigger>
                <SelectContent>{suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Expected Date</Label><Input type="date" value={newPO.expected_delivery} onChange={e => setNewPO({...newPO, expected_delivery: e.target.value})} /></div>
            <div className="col-span-2">
              <Label>Items</Label>
              <Table className="mt-2">
                <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Qty</TableHead><TableHead>Price</TableHead><TableHead></TableHead></TableRow></TableHeader>
                <TableBody>
                  {newPO.items.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <Select value={item.item_id} onValueChange={v => {
                           const updatedPOItems = [...newPO.items];
                           const selectedMasterItem = items.find(i => i.id === v);
                           updatedPOItems[idx].item_id = v;
                           updatedPOItems[idx].unit_price = selectedMasterItem?.cost_price || 0;
                           setNewPO({...newPO, items: updatedPOItems});
                        }}>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>{items.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell><Input type="number" value={item.quantity} onChange={e => {
                        const updatedPOItems = [...newPO.items];
                        updatedPOItems[idx].quantity = Number(e.target.value);
                        setNewPO({...newPO, items: updatedPOItems});
                      }} /></TableCell>
                      <TableCell><Input type="number" value={item.unit_price} onChange={e => {
                        const updatedPOItems = [...newPO.items];
                        updatedPOItems[idx].unit_price = Number(e.target.value);
                        setNewPO({...newPO, items: updatedPOItems});
                      }} /></TableCell>
                      <TableCell><Button variant="ghost" size="sm" onClick={() => setNewPO({...newPO, items: newPO.items.filter((_, i) => i !== idx)})}>&times;</Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => setNewPO({...newPO, items: [...newPO.items, {item_id: "", quantity: 1, unit_price: 0}]})}><Plus className="h-4 w-4 mr-2" />Add Item</Button>
            </div>
          </div>
          <DialogFooter><Button onClick={handleCreatePO}>Create PO</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addLocationOpen} onOpenChange={setAddLocationOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Warehouse Location</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Location Name</Label><Input value={newLocation.name} onChange={e => setNewLocation({...newLocation, name: e.target.value})} /></div>
            <div className="space-y-2"><Label>Description</Label><Input value={newLocation.description} onChange={e => setNewLocation({...newLocation, description: e.target.value})} /></div>
          </div>
          <DialogFooter><Button onClick={async () => {
             await createLocation.mutateAsync(newLocation);
             toast.success("Location added");
             setAddLocationOpen(false);
          }}>Add Location</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Inventory;
