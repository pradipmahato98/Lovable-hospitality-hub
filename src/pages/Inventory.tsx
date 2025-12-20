import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Search, Filter, Plus, Package, AlertTriangle } from "lucide-react";

const inventoryItems = [
  {
    id: 1,
    name: "Towels (Bath)",
    category: "Linens",
    stock: 245,
    minStock: 100,
    unit: "pieces",
    lastRestocked: "Dec 15, 2024",
  },
  {
    id: 2,
    name: "Bed Sheets (King)",
    category: "Linens",
    stock: 82,
    minStock: 50,
    unit: "sets",
    lastRestocked: "Dec 10, 2024",
  },
  {
    id: 3,
    name: "Shampoo (200ml)",
    category: "Toiletries",
    stock: 15,
    minStock: 100,
    unit: "bottles",
    lastRestocked: "Dec 5, 2024",
  },
  {
    id: 4,
    name: "Coffee Pods",
    category: "Minibar",
    stock: 320,
    minStock: 200,
    unit: "pods",
    lastRestocked: "Dec 18, 2024",
  },
  {
    id: 5,
    name: "Mineral Water (500ml)",
    category: "Minibar",
    stock: 480,
    minStock: 300,
    unit: "bottles",
    lastRestocked: "Dec 19, 2024",
  },
  {
    id: 6,
    name: "Pillows",
    category: "Linens",
    stock: 45,
    minStock: 60,
    unit: "pieces",
    lastRestocked: "Nov 28, 2024",
  },
  {
    id: 7,
    name: "Shower Gel (200ml)",
    category: "Toiletries",
    stock: 28,
    minStock: 100,
    unit: "bottles",
    lastRestocked: "Dec 1, 2024",
  },
  {
    id: 8,
    name: "Chocolate Bars",
    category: "Minibar",
    stock: 156,
    minStock: 100,
    unit: "pieces",
    lastRestocked: "Dec 17, 2024",
  },
];

const categories = ["All", "Linens", "Toiletries", "Minibar", "Maintenance"];

const Inventory = () => {
  const getStockStatus = (stock: number, minStock: number) => {
    const ratio = stock / minStock;
    if (ratio < 0.5) return { label: "Critical", color: "text-destructive", bgColor: "bg-destructive/20" };
    if (ratio < 1) return { label: "Low", color: "text-warning", bgColor: "bg-warning/20" };
    return { label: "Good", color: "text-success", bgColor: "bg-success/20" };
  };

  const getProgressColor = (stock: number, minStock: number) => {
    const ratio = stock / minStock;
    if (ratio < 0.5) return "bg-destructive";
    if (ratio < 1) return "bg-warning";
    return "bg-success";
  };

  return (
    <MainLayout title="Inventory" subtitle="Track and manage supplies and resources">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search inventory..." className="w-64 pl-9 bg-secondary" />
          </div>
          <div className="flex gap-2">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={cat === "All" ? "default" : "outline"}
                size="sm"
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>
        <Button variant="gold" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </div>

      {/* Low Stock Alert */}
      <Card variant="highlight" className="mb-6 animate-fade-in">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-warning/20 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-warning" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-foreground">Low Stock Alert</p>
            <p className="text-sm text-muted-foreground">
              3 items are running low on stock and need to be restocked soon.
            </p>
          </div>
          <Button variant="outline" size="sm">
            View Items
          </Button>
        </CardContent>
      </Card>

      {/* Inventory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {inventoryItems.map((item, index) => {
          const status = getStockStatus(item.stock, item.minStock);
          const stockPercentage = Math.min((item.stock / (item.minStock * 2)) * 100, 100);

          return (
            <Card
              key={item.id}
              variant="elevated"
              className="animate-slide-up hover:shadow-glow transition-all"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                      <Package className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{item.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">{item.category}</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-3">
                  <div className="flex items-end justify-between mb-2">
                    <div>
                      <span className="text-2xl font-bold text-foreground">{item.stock}</span>
                      <span className="text-sm text-muted-foreground ml-1">{item.unit}</span>
                    </div>
                    <Badge variant="outline" className={`${status.bgColor} ${status.color} border-current/30`}>
                      {status.label}
                    </Badge>
                  </div>
                  <div className="relative h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className={`absolute left-0 top-0 h-full rounded-full transition-all ${getProgressColor(item.stock, item.minStock)}`}
                      style={{ width: `${stockPercentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Min. stock: {item.minStock} {item.unit}
                  </p>
                </div>
                <div className="pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    Last restocked: {item.lastRestocked}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </MainLayout>
  );
};

export default Inventory;
