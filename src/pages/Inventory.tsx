import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useSearchParams } from "react-router-dom";
import {
  Package, Truck, Warehouse, ArrowUpDown, FolderTree,
  ArrowRightLeft, BarChart3, Settings2, ClipboardList,
  ChefHat, Trash2, Ruler, Store, ScanLine, ListChecks,
  Boxes, Settings, ArrowUpRight
} from "lucide-react";
import {
  ItemsTab, CategoriesTab, SuppliersTab, PurchaseOrdersTab,
  StockMovementsTab, TransfersTab, ReportsTab,
  UoMTab, StoresTab, RequisitionsTab, RecipesTab,
  WastageTab, StockCountTab, InventorySettingsTab, StockIssueTab
} from "@/components/inventory";
import { cn } from "@/lib/utils";

const Inventory = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const mainTab = searchParams.get("group") || "transactions";
  const activeSubTab = searchParams.get("tab") || (mainTab === "setup" ? "items" : mainTab === "transactions" ? "orders" : "stock-on-hand");

  const handleGroupChange = (value: string) => {
    setSearchParams(prev => {
      prev.set("group", value);
      // Set default sub-tab for the group
      if (value === "setup") prev.set("tab", "items");
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

  const navGroups = [
    { id: "setup", label: "Setup", icon: Settings2 },
    { id: "transactions", label: "Transactions", icon: ArrowRightLeft },
    { id: "reports", label: "Reports", icon: BarChart3 },
  ];

  const subTabs = {
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
      { id: "requisitions", label: "Requisitions", icon: ClipboardList },
      { id: "orders", label: "Purchase Orders / GRN", icon: Warehouse },
      { id: "issue", label: "Stock Issue", icon: ArrowUpRight },
      { id: "movements", label: "Movements", icon: ArrowUpDown },
      { id: "transfers", label: "Transfers", icon: ArrowRightLeft },
      { id: "stock-count", label: "Stock Count", icon: ListChecks },
      { id: "wastage", label: "Wastage", icon: Trash2 },
    ],
    reports: [
      { id: "stock-on-hand", label: "Stock on Hand", icon: Package },
      { id: "valuation", label: "Valuation Report", icon: BarChart3 },
      { id: "movement-rpt", label: "Movement History", icon: ArrowUpDown },
      { id: "expiry", label: "Expiry Report", icon: ScanLine },
    ]
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

            {/* Setup Content */}
            <TabsContent value="items"><ItemsTab /></TabsContent>
            <TabsContent value="categories"><CategoriesTab /></TabsContent>
            <TabsContent value="uoms"><UoMTab /></TabsContent>
            <TabsContent value="stores"><StoresTab /></TabsContent>
            <TabsContent value="suppliers"><SuppliersTab /></TabsContent>
            <TabsContent value="recipes"><RecipesTab /></TabsContent>
            <TabsContent value="settings"><InventorySettingsTab /></TabsContent>

            {/* Transactions Content */}
            <TabsContent value="requisitions"><RequisitionsTab /></TabsContent>
            <TabsContent value="orders"><PurchaseOrdersTab /></TabsContent>
            <TabsContent value="issue"><StockIssueTab /></TabsContent>
            <TabsContent value="movements"><StockMovementsTab /></TabsContent>
            <TabsContent value="transfers"><TransfersTab /></TabsContent>
            <TabsContent value="stock-count"><StockCountTab /></TabsContent>
            <TabsContent value="wastage"><WastageTab /></TabsContent>

            {/* Reports Content */}
            <TabsContent value="stock-on-hand"><ReportsTab /></TabsContent>
            <TabsContent value="valuation"><div className="p-4 border rounded-lg bg-card text-center text-muted-foreground">Valuation Report coming soon</div></TabsContent>
            <TabsContent value="movement-rpt"><div className="p-4 border rounded-lg bg-card text-center text-muted-foreground">Movement History Report coming soon</div></TabsContent>
            <TabsContent value="expiry"><div className="p-4 border rounded-lg bg-card text-center text-muted-foreground">Expiry Report coming soon</div></TabsContent>
          </Tabs>
        </ErrorBoundary>
      </div>
    </MainLayout>
  );
};

export default Inventory;
