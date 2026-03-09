import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Package, Truck, Warehouse, ArrowUpDown, FolderTree, ArrowRightLeft, BarChart3 } from "lucide-react";
import { ItemsTab, CategoriesTab, SuppliersTab, PurchaseOrdersTab, StockMovementsTab, TransfersTab, ReportsTab } from "@/components/inventory";

const Inventory = () => {
  return (
    <MainLayout title="Inventory Management" subtitle="Track stock, suppliers, purchase orders, transfers & reports">
      <ErrorBoundary>
        <Tabs defaultValue="items" className="space-y-6">
          <TabsList className="flex-wrap">
            <TabsTrigger value="items" className="gap-2"><Package className="h-4 w-4" />Items</TabsTrigger>
            <TabsTrigger value="categories" className="gap-2"><FolderTree className="h-4 w-4" />Categories</TabsTrigger>
            <TabsTrigger value="suppliers" className="gap-2"><Truck className="h-4 w-4" />Suppliers</TabsTrigger>
            <TabsTrigger value="orders" className="gap-2"><Warehouse className="h-4 w-4" />Purchase Orders</TabsTrigger>
            <TabsTrigger value="movements" className="gap-2"><ArrowUpDown className="h-4 w-4" />Movements</TabsTrigger>
            <TabsTrigger value="transfers" className="gap-2"><ArrowRightLeft className="h-4 w-4" />Transfers</TabsTrigger>
            <TabsTrigger value="reports" className="gap-2"><BarChart3 className="h-4 w-4" />Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="items"><ItemsTab /></TabsContent>
          <TabsContent value="categories"><CategoriesTab /></TabsContent>
          <TabsContent value="suppliers"><SuppliersTab /></TabsContent>
          <TabsContent value="orders"><PurchaseOrdersTab /></TabsContent>
          <TabsContent value="movements"><StockMovementsTab /></TabsContent>
          <TabsContent value="transfers"><TransfersTab /></TabsContent>
          <TabsContent value="reports"><ReportsTab /></TabsContent>
        </Tabs>
      </ErrorBoundary>
    </MainLayout>
  );
};

export default Inventory;
