import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search, Plus, Package, AlertTriangle, TrendingDown,
  QrCode, Edit, FileDown, FilterX, Loader2
} from "lucide-react";
import { InventoryItem, InventoryCategory, InventoryLocation } from "@/hooks/useInventory";
import { useInventoryUISettings } from "@/hooks/useSettings";

interface ItemsTabProps {
  items: InventoryItem[];
  categories: InventoryCategory[];
  locations: InventoryLocation[];
  isLoading: boolean;
  onAddItem: () => void;
  onEditItem: (item: InventoryItem) => void;
  onAdjustStock: (itemId: string, type: "in" | "out") => void;
  onExport: (data: any[], name: string) => void;
}

export const ItemsTab = ({
  items,
  categories,
  locations,
  isLoading,
  onAddItem,
  onEditItem,
  onAdjustStock,
  onExport
}: ItemsTabProps) => {
  const { data: uiSettings } = useInventoryUISettings();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [showLowStock, setShowLowStock] = useState(false);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.sku && item.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.barcode && item.barcode.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = categoryFilter === "all" || item.category_id === categoryFilter;
      const matchesLocation = locationFilter === "all" || item.location_id === locationFilter;
      const matchesLowStock = !showLowStock || item.current_stock <= item.reorder_point;

      return matchesSearch && matchesCategory && matchesLocation && matchesLowStock;
    });
  }, [items, searchQuery, categoryFilter, locationFilter, showLowStock]);

  const clearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("all");
    setLocationFilter("all");
    setShowLowStock(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search items..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
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
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowLowStock(!showLowStock)}
            className={showLowStock ? "bg-amber-500/10 text-amber-600 border-amber-500/50" : ""}
            title="Low Stock Only"
          >
            <AlertTriangle className="h-4 w-4" />
          </Button>
          {(searchQuery || categoryFilter !== "all" || locationFilter !== "all" || showLowStock) && (
            <Button variant="ghost" size="icon" onClick={clearFilters} title="Clear Filters"><FilterX className="h-4 w-4" /></Button>
          )}
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="outline" onClick={() => onExport(items, "Items")}><FileDown className="h-4 w-4 mr-2" />Export</Button>
          <Button variant="gold" onClick={onAddItem} className="gap-2"><Plus className="h-4 w-4" />Add Item</Button>
        </div>
      </div>

      <Card className="shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              {(!uiSettings || uiSettings.product_image_show) && <TableHead className="w-12"></TableHead>}
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
                {(!uiSettings || uiSettings.product_image_show) && (
                  <TableCell>
                    {item.image_url ? (
                      <img src={item.image_url} alt="" className="h-8 w-8 rounded object-cover shadow-sm" />
                    ) : (
                      <div className="h-8 w-8 rounded bg-muted flex items-center justify-center"><Package className="h-4 w-4 text-muted-foreground" /></div>
                    )}
                  </TableCell>
                )}
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{item.name}</span>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      {(!uiSettings || uiSettings.sku_show) && <span className="font-mono bg-muted px-1 rounded">{item.sku || "NO-SKU"}</span>}
                      {(!uiSettings || uiSettings.barcode_show) && item.barcode && <span className="flex items-center gap-0.5"><QrCode className="h-2.5 w-2.5" />{item.barcode}</span>}
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
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onAdjustStock(item.id, "out")} title="Record Consumption"><TrendingDown className="h-4 w-4 text-destructive" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onAdjustStock(item.id, "in")} title="Adjust Stock"><Plus className="h-4 w-4 text-success" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEditItem(item)} title="Edit"><Edit className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};
