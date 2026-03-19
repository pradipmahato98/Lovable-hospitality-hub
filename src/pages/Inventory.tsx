import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useSearchParams } from "react-router-dom";
import {
  Package, Truck, Warehouse, ArrowUpDown, FolderTree,
  ArrowRightLeft, BarChart3, Settings2, ClipboardList,
  ChefHat, Trash2, Ruler, Store, ScanLine, ListChecks,
  Boxes, Settings, ArrowUpRight, Utensils, ShieldCheck, Undo2
} from "lucide-react";
import {
  ItemsTab, CategoriesTab, SuppliersTab, PurchaseOrdersTab,
  StockMovementsTab, TransfersTab, ReportsTab,
  UoMTab, StoresTab, RequisitionsTab, RecipesTab,
  WastageTab, StockCountTab, InventorySettingsTab, StockIssueTab,
  InventoryValuationReport, ExpiryReport, FoodCostReport,
  ApprovalsQueueTab, ReturnsTab, ReplenishmentTab, InventoryDashboard
} from "@/components/inventory";
import { cn } from "@/lib/utils";

const Inventory = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const navGroups = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "setup", label: "Setup", icon: Settings2 },
    { id: "transactions", label: "Transactions", icon: ArrowRightLeft },
    { id: "reports", label: "Reports", icon: BarChart3 },
  ];

  const subTabs = {
    dashboard: [
      { id: "overview", label: "Overview", icon: BarChart3 },
    ],
    setup: [
      { id: "items", label: "Item Master", icon: Package },
      { id: "categories", label: "Categories", icon: FolderTree },
      { id: "uoms", label: "Units (UoM)", icon: Ruler },
      { id: "stores", label: "Stores", icon: Store },
      { id: "suppliers", label: "Suppliers", icon: Truck },
      { id: "recipes", label: "Recipes / BOM", icon: ChefHat },
      { id: "settings", label: "Settings", icon: Settings },
    ],
    transactions: [
      { id: "approvals", label: "Approvals", icon: ShieldCheck },
      { id: "replenish", label: "Replenishment", icon: ShoppingCart },
      { id: "requisitions", label: "Requisitions", icon: ClipboardList },
      { id: "orders", label: "Purchase Orders / GRN", icon: Warehouse },
      { id: "issue", label: "Stock Issue", icon: ArrowUpRight },
      { id: "movements", label: "Movements", icon: ArrowUpDown },
      { id: "transfers", label: "Transfers", icon: ArrowRightLeft },
      { id: "stock-count", label: "Stock Count", icon: ListChecks },
      { id: "wastage", label: "Wastage", icon: Trash2 },
      { id: "returns", label: "Returns", icon: Undo2 },
    ],
    reports: [
      { id: "stock-on-hand", label: "Stock on Hand", icon: Package },
      { id: "valuation", label: "Valuation Report", icon: BarChart3 },
      { id: "food-cost", label: "Food Costing", icon: Utensils },
      { id: "movement-rpt", label: "Movement History", icon: ArrowUpDown },
      { id: "expiry", label: "Expiry Report", icon: ScanLine },
    ]
  };

  const activeSubTab = searchParams.get("tab") || (searchParams.get("group") === "dashboard" ? "overview" : "items");

  // Derive mainTab from activeSubTab if not explicitly set
  const derivedGroup = Object.entries(subTabs).find(([_, tabs]) =>
    tabs.some(t => (t as any).id === activeSubTab)
  )?.[0] || "transactions";

  const mainTab = searchParams.get("group") || derivedGroup;

  const handleGroupChange = (value: string) => {
    setSearchParams(prev => {
      prev.set("group", value);
      // Set default sub-tab for the group
      if (value === "dashboard") prev.set("tab", "overview");
      else if (value === "setup") prev.set("tab", "items");
      else if (value === "transactions") prev.set("tab", "orders");
      else if (value === "reports") prev.set("tab", "stock-on-hand");
      return prev;
    });
  };

  const handleTabChange = (value: string) => {
    setSearchParams(prev => {
      prev.set("tab", value);
      return prev;
    });
  };


  return (
    <MainLayout title="Inventory Management" subtitle="Comprehensive stock control for all departments">
      <div className="flex flex-col space-y-6">
        {/* Main Navigation Groups */}
        <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg self-start">
          {navGroups.map((group) => (
            <button
              key={group.id}
              onClick={() => handleGroupChange(group.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all rounded-md",
                mainTab === group.id
                  ? "bg-background text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-background/50"
              )}
            >
              <group.icon className="h-4 w-4" />
              {group.label}
            </button>
          ))}
        </div>

        <ErrorBoundary>
          <Tabs value={activeSubTab} onValueChange={handleTabChange} className="space-y-6">
            {mainTab !== "dashboard" && (
              <div className="overflow-x-auto pb-1">
                <TabsList className="inline-flex w-auto">
                  {(subTabs[mainTab as keyof typeof subTabs] || []).map((tab) => (
                    <TabsTrigger key={tab.id} value={tab.id} className="gap-2 shrink-0">
                      <tab.icon className="h-4 w-4" />
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            )}

            {/* Setup Content */}
            <TabsContent value="overview" className="mt-0 focus-visible:outline-none"><InventoryDashboard /></TabsContent>
            <TabsContent value="items" className="mt-0 focus-visible:outline-none"><ItemsTab /></TabsContent>
            <TabsContent value="categories" className="mt-0 focus-visible:outline-none"><CategoriesTab /></TabsContent>
            <TabsContent value="uoms" className="mt-0 focus-visible:outline-none"><UoMTab /></TabsContent>
            <TabsContent value="stores" className="mt-0 focus-visible:outline-none"><StoresTab /></TabsContent>
            <TabsContent value="suppliers" className="mt-0 focus-visible:outline-none"><SuppliersTab /></TabsContent>
            <TabsContent value="recipes" className="mt-0 focus-visible:outline-none"><RecipesTab /></TabsContent>
            <TabsContent value="settings" className="mt-0 focus-visible:outline-none"><InventorySettingsTab /></TabsContent>

            {/* Transactions Content */}
            {/* Transactions Content */}
            <TabsContent value="approvals" className="mt-0 focus-visible:outline-none"><ApprovalsQueueTab /></TabsContent>
            <TabsContent value="requisitions" className="mt-0 focus-visible:outline-none"><RequisitionsTab /></TabsContent>
            <TabsContent value="orders" className="mt-0 focus-visible:outline-none"><PurchaseOrdersTab /></TabsContent>
            <TabsContent value="issue" className="mt-0 focus-visible:outline-none"><StockIssueTab /></TabsContent>
            <TabsContent value="movements" className="mt-0 focus-visible:outline-none"><StockMovementsTab /></TabsContent>
            <TabsContent value="transfers" className="mt-0 focus-visible:outline-none"><TransfersTab /></TabsContent>
            <TabsContent value="stock-count" className="mt-0 focus-visible:outline-none"><StockCountTab /></TabsContent>
            <TabsContent value="wastage" className="mt-0 focus-visible:outline-none"><WastageTab /></TabsContent>
            <TabsContent value="returns" className="mt-0 focus-visible:outline-none"><ReturnsTab /></TabsContent>
            <TabsContent value="replenish" className="mt-0 focus-visible:outline-none"><ReplenishmentTab /></TabsContent>

            {/* Reports Content */}
            <TabsContent value="stock-on-hand" className="mt-0 focus-visible:outline-none"><ReportsTab /></TabsContent>
            <TabsContent value="valuation" className="mt-0 focus-visible:outline-none"><InventoryValuationReport /></TabsContent>
            <TabsContent value="food-cost" className="mt-0 focus-visible:outline-none"><FoodCostReport /></TabsContent>
            <TabsContent value="movement-rpt" className="mt-0 focus-visible:outline-none"><StockMovementsTab /></TabsContent>
            <TabsContent value="expiry" className="mt-0 focus-visible:outline-none"><ExpiryReport /></TabsContent>
          </Tabs>
        </ErrorBoundary>
      </div>
    </MainLayout>
  );
};

export default Inventory;
