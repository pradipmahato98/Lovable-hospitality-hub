import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChefHat,
  Clock,
  Check,
  AlertCircle,
  Bell,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

interface KitchenOrder {
  id: string;
  tableNumber: string;
  items: {
    id: string;
    name: string;
    quantity: number;
    notes?: string;
    status: "pending" | "preparing" | "ready";
  }[];
  createdAt: string;
  priority: "normal" | "rush";
}

const STORAGE_KEY = "pos_tables_data";
const KITCHEN_ORDERS_KEY = "kitchen_orders_data";

export default function KitchenDisplay() {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Load orders from localStorage
  const loadOrders = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const tables = JSON.parse(saved);
        const kitchenOrders: KitchenOrder[] = tables
          .filter((t: any) => t.status !== "available" && t.orders && t.orders.length > 0)
          .map((t: any) => ({
            id: t.id,
            tableNumber: t.number || t.table_number,
            items: t.orders
              .filter((o: any) => o.status !== "served" && o.status !== "cancelled")
              .map((o: any) => ({
                id: o.id,
                name: o.name || o.item_name,
                quantity: o.quantity,
                notes: o.notes,
                status: o.status,
              })),
            createdAt: t.startTime || t.start_time || new Date().toISOString(),
            priority: "normal" as const,
          }))
          .filter((o: KitchenOrder) => o.items.length > 0);
        setOrders(kitchenOrders);
        setLastUpdate(new Date());
      } catch {
        setOrders([]);
      }
    }
  };

  useEffect(() => {
    loadOrders();
    
    // Poll for updates every 5 seconds
    const interval = setInterval(loadOrders, 5000);
    
    // Listen for storage changes
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        loadOrders();
      }
    };
    window.addEventListener("storage", handleStorage);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const updateItemStatus = (orderId: string, itemId: string, newStatus: "preparing" | "ready") => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const tables = JSON.parse(saved);
        const updatedTables = tables.map((t: any) => {
          if (t.id === orderId) {
            return {
              ...t,
              orders: t.orders.map((o: any) => 
                o.id === itemId ? { ...o, status: newStatus } : o
              ),
            };
          }
          return t;
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTables));
        window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
        loadOrders();
        toast.success(`Item marked as ${newStatus}`);
      } catch {
        toast.error("Failed to update item status");
      }
    }
  };

  const markAllReady = (orderId: string) => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const tables = JSON.parse(saved);
        const updatedTables = tables.map((t: any) => {
          if (t.id === orderId) {
            return {
              ...t,
              orders: t.orders.map((o: any) => ({ ...o, status: "ready" })),
            };
          }
          return t;
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTables));
        window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
        loadOrders();
        toast.success("All items marked as ready");
      } catch {
        toast.error("Failed to update order status");
      }
    }
  };

  const getElapsedTime = (createdAt: string) => {
    const diff = Date.now() - new Date(createdAt).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m ago`;
  };

  const getTimeClass = (createdAt: string) => {
    const diff = Date.now() - new Date(createdAt).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes > 20) return "text-destructive";
    if (minutes > 10) return "text-amber-400";
    return "text-muted-foreground";
  };

  const statusColors = {
    pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    preparing: "bg-primary/20 text-primary border-primary/30",
    ready: "bg-success/20 text-success border-success/30",
  };

  const pendingOrders = orders.filter(o => o.items.some(i => i.status === "pending"));
  const preparingOrders = orders.filter(o => o.items.some(i => i.status === "preparing") && !o.items.some(i => i.status === "pending"));
  const readyOrders = orders.filter(o => o.items.every(i => i.status === "ready"));

  return (
    <MainLayout title="Kitchen Display" subtitle="Real-time order management">
      <div className="space-y-6">
        {/* Stats Bar */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-lg px-3 py-1">
                {pendingOrders.length}
              </Badge>
              <span className="text-sm text-muted-foreground">Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30 text-lg px-3 py-1">
                {preparingOrders.length}
              </Badge>
              <span className="text-sm text-muted-foreground">Preparing</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-success/20 text-success border-success/30 text-lg px-3 py-1">
                {readyOrders.length}
              </Badge>
              <span className="text-sm text-muted-foreground">Ready</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Last updated: {lastUpdate.toLocaleTimeString()}</span>
            <Button variant="outline" size="sm" onClick={loadOrders}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Orders Grid */}
        {orders.length === 0 ? (
          <Card className="py-16 text-center">
            <CardContent>
              <ChefHat className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No Active Orders</h3>
              <p className="text-muted-foreground">Orders will appear here when placed from the POS</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {orders.map((order) => (
              <Card 
                key={order.id} 
                className={`${
                  order.items.some(i => i.status === "pending") 
                    ? "border-amber-500/50" 
                    : order.items.every(i => i.status === "ready")
                    ? "border-success/50"
                    : "border-primary/50"
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">Table {order.tableNumber}</CardTitle>
                    <div className={`flex items-center gap-1 text-sm ${getTimeClass(order.createdAt)}`}>
                      <Clock className="h-4 w-4" />
                      {getElapsedTime(order.createdAt)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {order.items.map((item) => (
                    <div 
                      key={item.id} 
                      className="flex items-start justify-between p-2 rounded-lg bg-secondary/30"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg">{item.quantity}×</span>
                          <span className="font-medium">{item.name}</span>
                        </div>
                        {item.notes && (
                          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {item.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={statusColors[item.status]}>
                          {item.status}
                        </Badge>
                        {item.status === "pending" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateItemStatus(order.id, item.id, "preparing")}
                          >
                            <ChefHat className="h-4 w-4" />
                          </Button>
                        )}
                        {item.status === "preparing" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-success"
                            onClick={() => updateItemStatus(order.id, item.id, "ready")}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        {item.status === "ready" && (
                          <Bell className="h-4 w-4 text-success animate-pulse" />
                        )}
                      </div>
                    </div>
                  ))}

                  {!order.items.every(i => i.status === "ready") && (
                    <Button
                      variant="gold"
                      className="w-full mt-2"
                      onClick={() => markAllReady(order.id)}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Mark All Ready
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
