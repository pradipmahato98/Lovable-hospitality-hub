import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  LayoutGrid,
  ClipboardList,
  Receipt,
  Plus,
  Minus,
  Trash2,
  Users,
  Clock,
  Search,
  Coffee,
  Utensils,
  Wine,
  IceCream,
  ShoppingCart,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface TableInfo {
  id: string;
  number: string;
  capacity: number;
  status: "available" | "occupied" | "reserved" | "billing";
  guests?: number;
  server?: string;
  startTime?: Date;
  orders: OrderItem[];
}

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  status: "pending" | "preparing" | "ready" | "served";
  notes?: string;
}

const menuItems = [
  { id: "1", name: "Coffee", price: 4.50, category: "Beverages", icon: Coffee },
  { id: "2", name: "Tea", price: 3.50, category: "Beverages", icon: Coffee },
  { id: "3", name: "Fresh Juice", price: 6.00, category: "Beverages", icon: Coffee },
  { id: "4", name: "Breakfast Combo", price: 15.00, category: "Food", icon: Utensils },
  { id: "5", name: "Lunch Special", price: 22.00, category: "Food", icon: Utensils },
  { id: "6", name: "Dinner Platter", price: 35.00, category: "Food", icon: Utensils },
  { id: "7", name: "Wine Glass", price: 12.00, category: "Bar", icon: Wine },
  { id: "8", name: "Cocktail", price: 14.00, category: "Bar", icon: Wine },
  { id: "9", name: "Beer", price: 8.00, category: "Bar", icon: Wine },
  { id: "10", name: "Ice Cream", price: 7.00, category: "Desserts", icon: IceCream },
  { id: "11", name: "Cake Slice", price: 9.00, category: "Desserts", icon: IceCream },
  { id: "12", name: "Fruit Bowl", price: 8.00, category: "Desserts", icon: IceCream },
];

const initialTables: TableInfo[] = [
  { id: "t1", number: "1", capacity: 4, status: "available", orders: [] },
  { id: "t2", number: "2", capacity: 2, status: "occupied", guests: 2, server: "John", startTime: new Date(Date.now() - 45 * 60000), orders: [
    { id: "o1", name: "Coffee", price: 4.50, quantity: 2, category: "Beverages", status: "served" },
    { id: "o2", name: "Breakfast Combo", price: 15.00, quantity: 2, category: "Food", status: "preparing" },
  ]},
  { id: "t3", number: "3", capacity: 6, status: "reserved", orders: [] },
  { id: "t4", number: "4", capacity: 4, status: "billing", guests: 4, server: "Sarah", startTime: new Date(Date.now() - 90 * 60000), orders: [
    { id: "o3", name: "Lunch Special", price: 22.00, quantity: 4, category: "Food", status: "served" },
    { id: "o4", name: "Wine Glass", price: 12.00, quantity: 2, category: "Bar", status: "served" },
  ]},
  { id: "t5", number: "5", capacity: 8, status: "available", orders: [] },
  { id: "t6", number: "6", capacity: 2, status: "occupied", guests: 2, server: "Mike", startTime: new Date(Date.now() - 20 * 60000), orders: [
    { id: "o5", name: "Cocktail", price: 14.00, quantity: 2, category: "Bar", status: "ready" },
  ]},
  { id: "t7", number: "7", capacity: 4, status: "available", orders: [] },
  { id: "t8", number: "8", capacity: 4, status: "available", orders: [] },
];

const statusColors = {
  available: "bg-success/20 text-success border-success/30",
  occupied: "bg-primary/20 text-primary border-primary/30",
  reserved: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  billing: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

const orderStatusColors = {
  pending: "bg-muted text-muted-foreground",
  preparing: "bg-amber-500/20 text-amber-400",
  ready: "bg-success/20 text-success",
  served: "bg-primary/20 text-primary",
};

interface POSTableSystemProps {
  onCheckout: (total: number, items: OrderItem[]) => void;
}

export function POSTableSystem({ onCheckout }: POSTableSystemProps) {
  const [tables, setTables] = useState<TableInfo[]>(initialTables);
  const [selectedTable, setSelectedTable] = useState<TableInfo | null>(null);
  const [activeTab, setActiveTab] = useState("tables");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [itemNotes, setItemNotes] = useState("");
  const [guestCount, setGuestCount] = useState("2");

  const categories = [...new Set(menuItems.map((item) => item.category))];

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !activeCategory || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSelectTable = (table: TableInfo) => {
    setSelectedTable(table);
    if (table.status === "available") {
      setActiveTab("tables");
    } else {
      setActiveTab("order");
    }
  };

  const handleOpenTable = () => {
    if (!selectedTable || !guestCount) return;
    setTables((prev) =>
      prev.map((t) =>
        t.id === selectedTable.id
          ? { ...t, status: "occupied" as const, guests: parseInt(guestCount), startTime: new Date(), server: "Current User" }
          : t
      )
    );
    setSelectedTable((prev) =>
      prev ? { ...prev, status: "occupied", guests: parseInt(guestCount), startTime: new Date(), server: "Current User" } : null
    );
    toast.success(`Table ${selectedTable.number} opened with ${guestCount} guests`);
    setActiveTab("order");
  };

  const handleAddItem = (item: typeof menuItems[0]) => {
    if (!selectedTable || selectedTable.status === "available") {
      toast.error("Please open a table first");
      return;
    }

    const newOrder: OrderItem = {
      id: Date.now().toString(),
      name: item.name,
      price: item.price,
      quantity: 1,
      category: item.category,
      status: "pending",
      notes: itemNotes || undefined,
    };

    setTables((prev) =>
      prev.map((t) => {
        if (t.id === selectedTable.id) {
          const existing = t.orders.find((o) => o.name === item.name && o.status === "pending");
          if (existing) {
            return {
              ...t,
              orders: t.orders.map((o) =>
                o.id === existing.id ? { ...o, quantity: o.quantity + 1 } : o
              ),
            };
          }
          return { ...t, orders: [...t.orders, newOrder] };
        }
        return t;
      })
    );

    setSelectedTable((prev) => {
      if (!prev) return null;
      const existing = prev.orders.find((o) => o.name === item.name && o.status === "pending");
      if (existing) {
        return {
          ...prev,
          orders: prev.orders.map((o) =>
            o.id === existing.id ? { ...o, quantity: o.quantity + 1 } : o
          ),
        };
      }
      return { ...prev, orders: [...prev.orders, newOrder] };
    });

    toast.success(`${item.name} added to Table ${selectedTable.number}`);
    setItemNotes("");
  };

  const handleUpdateQuantity = (orderId: string, delta: number) => {
    setTables((prev) =>
      prev.map((t) => ({
        ...t,
        orders: t.orders
          .map((o) => (o.id === orderId ? { ...o, quantity: Math.max(0, o.quantity + delta) } : o))
          .filter((o) => o.quantity > 0),
      }))
    );
    setSelectedTable((prev) =>
      prev
        ? {
            ...prev,
            orders: prev.orders
              .map((o) => (o.id === orderId ? { ...o, quantity: Math.max(0, o.quantity + delta) } : o))
              .filter((o) => o.quantity > 0),
          }
        : null
    );
  };

  const handleRemoveItem = (orderId: string) => {
    setTables((prev) =>
      prev.map((t) => ({
        ...t,
        orders: t.orders.filter((o) => o.id !== orderId),
      }))
    );
    setSelectedTable((prev) =>
      prev ? { ...prev, orders: prev.orders.filter((o) => o.id !== orderId) } : null
    );
    toast.success("Item removed");
  };

  const handleSendToKitchen = () => {
    if (!selectedTable) return;
    const pendingOrders = selectedTable.orders.filter((o) => o.status === "pending");
    if (pendingOrders.length === 0) {
      toast.error("No pending items to send");
      return;
    }

    setTables((prev) =>
      prev.map((t) => ({
        ...t,
        orders: t.orders.map((o) => (o.status === "pending" ? { ...o, status: "preparing" as const } : o)),
      }))
    );
    setSelectedTable((prev) =>
      prev
        ? {
            ...prev,
            orders: prev.orders.map((o) => (o.status === "pending" ? { ...o, status: "preparing" as const } : o)),
          }
        : null
    );
    toast.success(`${pendingOrders.length} item(s) sent to kitchen`);
  };

  const handleProceedToBilling = () => {
    if (!selectedTable) return;
    setTables((prev) =>
      prev.map((t) => (t.id === selectedTable.id ? { ...t, status: "billing" as const } : t))
    );
    setSelectedTable((prev) => (prev ? { ...prev, status: "billing" } : null));
    setActiveTab("billing");
  };

  const handleCheckout = () => {
    if (!selectedTable) return;
    const total = selectedTable.orders.reduce((sum, o) => sum + o.price * o.quantity, 0);
    onCheckout(total, selectedTable.orders);
  };

  const handleCloseTable = () => {
    if (!selectedTable) return;
    setTables((prev) =>
      prev.map((t) => (t.id === selectedTable.id ? { ...t, status: "available" as const, orders: [], guests: undefined, server: undefined, startTime: undefined } : t))
    );
    setSelectedTable(null);
    toast.success(`Table ${selectedTable.number} closed`);
    setActiveTab("tables");
  };

  const getTableTotal = (table: TableInfo) => {
    return table.orders.reduce((sum, o) => sum + o.price * o.quantity, 0);
  };

  const getElapsedTime = (startTime: Date | undefined) => {
    if (!startTime) return "";
    const diff = Date.now() - startTime.getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  return (
    <div className="h-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="tables" className="gap-2">
            <LayoutGrid className="h-4 w-4" />
            Tables
          </TabsTrigger>
          <TabsTrigger value="order" className="gap-2" disabled={!selectedTable || selectedTable.status === "available"}>
            <ClipboardList className="h-4 w-4" />
            Order
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2" disabled={!selectedTable || selectedTable.status !== "billing"}>
            <Receipt className="h-4 w-4" />
            Billing
          </TabsTrigger>
        </TabsList>

        {/* Tables Tab */}
        <TabsContent value="tables" className="flex-1 mt-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {tables.map((table) => (
              <Card
                key={table.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedTable?.id === table.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => handleSelectTable(table)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold">T{table.number}</span>
                    <Badge variant="outline" className={statusColors[table.status]}>
                      {table.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{table.guests || 0}/{table.capacity}</span>
                  </div>
                  {table.startTime && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Clock className="h-4 w-4" />
                      <span>{getElapsedTime(table.startTime)}</span>
                    </div>
                  )}
                  {table.orders.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-border">
                      <span className="text-sm font-medium text-primary">
                        ${getTableTotal(table).toFixed(2)}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Open Table Dialog */}
          {selectedTable?.status === "available" && (
            <Card variant="elevated" className="mt-4 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Open Table {selectedTable.number}</h3>
                  <p className="text-sm text-muted-foreground">Capacity: {selectedTable.capacity} guests</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Guests:</span>
                    <Input
                      type="number"
                      value={guestCount}
                      onChange={(e) => setGuestCount(e.target.value)}
                      className="w-16"
                      min={1}
                      max={selectedTable.capacity}
                    />
                  </div>
                  <Button variant="gold" onClick={handleOpenTable}>
                    Open Table
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Order Tab */}
        <TabsContent value="order" className="flex-1 mt-0">
          {selectedTable && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
              {/* Menu */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search menu..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    <Button
                      variant={activeCategory === null ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => setActiveCategory(null)}
                    >
                      All
                    </Button>
                    {categories.map((cat) => (
                      <Button
                        key={cat}
                        variant={activeCategory === cat ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => setActiveCategory(cat)}
                      >
                        {cat}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {filteredItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Card
                        key={item.id}
                        className="cursor-pointer hover:border-primary/50 transition-colors"
                        onClick={() => handleAddItem(item)}
                      >
                        <CardContent className="p-3 text-center">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <p className="font-medium text-sm truncate">{item.name}</p>
                          <p className="text-primary font-semibold text-sm">${item.price.toFixed(2)}</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Current Order */}
              <Card variant="elevated" className="h-fit">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      Table {selectedTable.number}
                    </h3>
                    <Badge variant="outline">{selectedTable.orders.length} items</Badge>
                  </div>

                  {selectedTable.orders.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No items yet</p>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {selectedTable.orders.map((order) => (
                        <div
                          key={order.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-secondary/50"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm truncate">{order.name}</p>
                              <Badge variant="outline" className={`text-xs ${orderStatusColors[order.status]}`}>
                                {order.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              ${order.price.toFixed(2)} × {order.quantity}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleUpdateQuantity(order.id, -1)}
                              disabled={order.status !== "pending"}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-6 text-center text-sm">{order.quantity}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleUpdateQuantity(order.id, 1)}
                              disabled={order.status !== "pending"}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={() => handleRemoveItem(order.id)}
                              disabled={order.status !== "pending"}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="border-t border-border pt-4 mt-4 space-y-2">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total</span>
                      <span className="text-primary">${getTableTotal(selectedTable).toFixed(2)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={handleSendToKitchen}
                        disabled={selectedTable.orders.filter((o) => o.status === "pending").length === 0}
                      >
                        <Check className="h-4 w-4" />
                        Send to Kitchen
                      </Button>
                      <Button variant="gold" className="gap-2" onClick={handleProceedToBilling}>
                        <Receipt className="h-4 w-4" />
                        Proceed to Bill
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="flex-1 mt-0">
          {selectedTable && selectedTable.status === "billing" && (
            <Card variant="elevated" className="max-w-md mx-auto">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold">Table {selectedTable.number}</h2>
                  <p className="text-muted-foreground">Bill Summary</p>
                </div>

                <div className="space-y-3 mb-6">
                  {selectedTable.orders.map((order) => (
                    <div key={order.id} className="flex justify-between text-sm">
                      <span>
                        {order.name} × {order.quantity}
                      </span>
                      <span>${(order.price * order.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${getTableTotal(selectedTable).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax (10%)</span>
                    <span>${(getTableTotal(selectedTable) * 0.1).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold border-t border-border pt-2">
                    <span>Total</span>
                    <span className="text-primary">${(getTableTotal(selectedTable) * 1.1).toFixed(2)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-6">
                  <Button variant="outline" onClick={handleCloseTable}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button variant="gold" onClick={handleCheckout}>
                    <Receipt className="h-4 w-4 mr-2" />
                    Checkout
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
