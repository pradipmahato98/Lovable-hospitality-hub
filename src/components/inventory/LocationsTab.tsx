import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Warehouse, Edit, Trash2, Plus } from "lucide-react";
import { InventoryLocation, InventoryItem } from "@/hooks/useInventory";

interface LocationsTabProps {
  locations: InventoryLocation[];
  items: InventoryItem[];
  onAddLocation: () => void;
  onEditLocation: (loc: InventoryLocation) => void;
  onDeleteLocation: (id: string) => void;
  onViewStock: (locationId: string) => void;
}

export const LocationsTab = ({
  locations,
  items,
  onAddLocation,
  onEditLocation,
  onDeleteLocation,
  onViewStock
}: LocationsTabProps) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Warehouse Locations</h2>
        <Button variant="gold" className="gap-2" onClick={onAddLocation}><Plus className="h-4 w-4" />Add Location</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {locations.length === 0 ? (
          <div className="col-span-full py-20 text-center text-muted-foreground">No storage locations configured</div>
        ) : locations.map(loc => (
          <Card key={loc.id} className="shadow-sm border-l-4 border-l-primary relative group hover:shadow-md transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2"><Warehouse className="h-5 w-5 text-primary/70" />{loc.name}</CardTitle>
              <CardDescription className="text-[10px] line-clamp-1">{loc.description || "No description"}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center text-sm mb-4">
                <span className="text-muted-foreground">Stored Items:</span>
                <span className="font-bold">{items.filter(i => i.location_id === loc.id).length}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-muted/50">
                <Button variant="ghost" size="sm" className="h-7 text-[10px] px-2" onClick={() => onViewStock(loc.id)}>View Stock</Button>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEditLocation(loc)}><Edit className="h-3 w-3" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDeleteLocation(loc.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
