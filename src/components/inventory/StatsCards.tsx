import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle, ClipboardList, ShoppingCart,
  DollarSign, Trash2
} from "lucide-react";
import { InventoryRequisition, PurchaseOrder, InventoryWastage } from "@/hooks/useInventory";

interface StatsCardsProps {
  stats: {
    totalValue: number;
    lowStock: number;
  };
  requisitions: InventoryRequisition[];
  purchaseOrders: PurchaseOrder[];
  wastage: InventoryWastage[];
  onTabChange: (tab: string) => void;
  onShowLowStock: () => void;
}

export const StatsCards = ({
  stats,
  requisitions,
  purchaseOrders,
  wastage,
  onTabChange,
  onShowLowStock
}: StatsCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <Card className="bg-primary/5 border-primary/20 shadow-sm transition-all hover:shadow-md">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Inventory Value</p>
              <p className="text-xl font-bold text-primary">${stats.totalValue.toLocaleString()}</p>
            </div>
            <DollarSign className="h-6 w-6 text-primary/40" />
          </div>
        </CardContent>
      </Card>

      <Card
        className={`shadow-sm transition-all hover:shadow-md cursor-pointer ${stats.lowStock > 0 ? "bg-amber-500/5 border-amber-500/20" : ""}`}
        onClick={onShowLowStock}
      >
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Low Stock Alerts</p>
              <p className={`text-xl font-bold ${stats.lowStock > 0 ? "text-amber-500" : ""}`}>{stats.lowStock}</p>
            </div>
            <AlertTriangle className={`h-6 w-6 ${stats.lowStock > 0 ? "text-amber-500/40" : "text-muted-foreground/20"}`} />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm transition-all hover:shadow-md cursor-pointer" onClick={() => onTabChange("requisitions")}>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Pending Reqs</p>
              <p className="text-xl font-bold">{requisitions.filter(r => r.status === "pending").length}</p>
            </div>
            <ClipboardList className="h-6 w-6 text-muted-foreground/20" />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm transition-all hover:shadow-md cursor-pointer" onClick={() => onTabChange("orders")}>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Active POs</p>
              <p className="text-xl font-bold">{purchaseOrders.filter(o => o.status === "sent").length}</p>
            </div>
            <ShoppingCart className="h-6 w-6 text-muted-foreground/20" />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm transition-all hover:shadow-md cursor-pointer border-l-2 border-l-destructive" onClick={() => onTabChange("wastage")}>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Monthly Wastage</p>
              <p className="text-xl font-bold text-destructive">${wastage.reduce((sum, w) => sum + (w.quantity * (w.item?.cost_price || 0)), 0).toLocaleString()}</p>
            </div>
            <Trash2 className="h-6 w-6 text-destructive/20" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
