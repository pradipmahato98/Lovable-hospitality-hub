import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Camera, Plus, Edit, Trash2, QrCode } from "lucide-react";
import { InventoryItem, InventoryCategory, InventoryLocation } from "@/hooks/useInventory";
import { useInventoryUISettings } from "@/hooks/useSettings";
import { toast } from "sonner";

interface ItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: InventoryItem | null;
  categories: InventoryCategory[];
  locations: InventoryLocation[];
  onSave: (data: any) => Promise<void>;
  onDelete?: (id: string) => void;
}

export const ItemDialog = ({
  open,
  onOpenChange,
  item,
  categories,
  locations,
  onSave,
  onDelete
}: ItemDialogProps) => {
  const { data: uiSettings } = useInventoryUISettings();
  const [formData, setFormData] = useState<any>({
    name: "", sku: "", barcode: "", image_url: "", category_id: "", supplier_id: "", location_id: "",
    unit: "pieces", current_stock: 0, min_stock: 0, reorder_point: 0, cost_price: 0, department: "", is_active: true,
    batch_number: "", expiry_date: "", is_perishable: false
  });

  useEffect(() => {
    if (item) {
      setFormData({
        ...item,
        sku: item.sku || "",
        barcode: item.barcode || "",
        image_url: item.image_url || "",
        category_id: item.category_id || "",
        supplier_id: item.supplier_id || "",
        location_id: item.location_id || "",
        department: item.department || "",
        batch_number: item.batch_number || "",
        expiry_date: item.expiry_date || "",
        is_perishable: item.is_perishable || false
      });
    } else {
      setFormData({
        name: "", sku: "", barcode: "", image_url: "", category_id: "", supplier_id: "", location_id: "",
        unit: "pieces", current_stock: 0, min_stock: 0, reorder_point: 0, cost_price: 0, department: "", is_active: true,
        batch_number: "", expiry_date: "", is_perishable: false
      });
    }
  }, [item, open]);

  const handleSubmit = async () => {
    await onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {!item ? <Plus className="h-5 w-5" /> : <Edit className="h-5 w-5" />}
            {!item ? "Add New Item" : "Modify Item Details"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          {(!uiSettings || uiSettings.product_image_show) && (
            <div className="md:col-span-2 flex flex-col items-center gap-4 py-6 bg-muted/30 rounded-xl border-2 border-dashed border-muted hover:border-primary/30 transition-colors group relative overflow-hidden">
               {formData.image_url ? (
                 <>
                   <img src={formData.image_url} alt="Preview" className="h-32 w-32 object-cover rounded-lg shadow-md" />
                   <Button
                     variant="ghost"
                     size="sm"
                     className="absolute top-2 right-2 text-destructive"
                     onClick={(e) => { e.stopPropagation(); setFormData({...formData, image_url: ""}); }}
                   >
                     <Trash2 className="h-4 w-4" />
                   </Button>
                 </>
               ) : (
                 <label className="flex flex-col items-center gap-2 cursor-pointer w-full h-full">
                    <Camera className="h-10 w-10 text-muted-foreground group-hover:text-primary/50 transition-colors" />
                    <span className="text-xs text-muted-foreground text-center px-4">Click to simulate upload<br/><span className="text-[10px] font-mono text-primary/60">(Simulated for dev mode)</span></span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          // In a real app, upload to Supabase storage.
                          // For this implementation, we use a local object URL to simulate immediate success.
                          const url = URL.createObjectURL(file);
                          setFormData({...formData, image_url: url});
                          toast.success("Image attached");
                        }
                      }}
                    />
                 </label>
               )}
            </div>
          )}
          <div className="space-y-1.5"><Label className="text-xs uppercase font-bold text-muted-foreground">Product Name *</Label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Bed Linen King Size" /></div>
          {(!uiSettings || uiSettings.sku_show) && (
            <div className="space-y-1.5"><Label className="text-xs uppercase font-bold text-muted-foreground">SKU / ID</Label><Input value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} placeholder="INTERNAL-ID-123" /></div>
          )}
          {(!uiSettings || uiSettings.barcode_show) && (
            <div className="space-y-1.5">
              <Label className="text-xs uppercase font-bold text-muted-foreground">Barcode / GTIN</Label>
              <div className="relative">
                <Input
                  value={formData.barcode}
                  onChange={e => setFormData({...formData, barcode: e.target.value})}
                  placeholder="Scan or enter barcode"
                  className="pr-10"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full text-muted-foreground hover:text-primary"
                  onClick={() => {
                    const simulatedBarcode = Math.floor(Math.random() * 9000000000000 + 1000000000000).toString();
                    setFormData({...formData, barcode: simulatedBarcode});
                    toast.success("Barcode scanned");
                  }}
                >
                  <QrCode className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          <div className="space-y-1.5"><Label className="text-xs uppercase font-bold text-muted-foreground">Category</Label>
            <Select value={formData.category_id} onValueChange={v => setFormData({...formData, category_id: v})}>
              <SelectTrigger><SelectValue placeholder="Categorize item" /></SelectTrigger>
              <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label className="text-xs uppercase font-bold text-muted-foreground">Storage Location</Label>
            <Select value={formData.location_id} onValueChange={v => setFormData({...formData, location_id: v})}>
              <SelectTrigger><SelectValue placeholder="Primary warehouse" /></SelectTrigger>
              <SelectContent>{locations.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label className="text-xs uppercase font-bold text-muted-foreground">Unit Type</Label><Input value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} placeholder="pcs, kg, liters, etc." /></div>
          <div className="space-y-1.5"><Label className="text-xs uppercase font-bold text-muted-foreground">Cost Price ($)</Label><Input type="number" value={formData.cost_price} onChange={e => setFormData({...formData, cost_price: Number(e.target.value)})} /></div>
          {(!uiSettings || uiSettings.re_order_show) && (
            <div className="space-y-1.5"><Label className="text-xs uppercase font-bold text-muted-foreground">Reorder Point</Label><Input type="number" value={formData.reorder_point} onChange={e => setFormData({...formData, reorder_point: Number(e.target.value)})} /></div>
          )}
          {!item && <div className="space-y-1.5"><Label className="text-xs uppercase font-bold text-muted-foreground">Initial Stock</Label><Input type="number" value={formData.current_stock} onChange={e => setFormData({...formData, current_stock: Number(e.target.value)})} /></div>}
          {(!uiSettings || uiSettings.batch_number_show) && (
            <div className="space-y-1.5"><Label className="text-xs uppercase font-bold text-muted-foreground">Batch Number</Label><Input value={formData.batch_number} onChange={e => setFormData({...formData, batch_number: e.target.value})} /></div>
          )}
          {(!uiSettings || uiSettings.expiration_show) && (
            <div className="space-y-1.5"><Label className="text-xs uppercase font-bold text-muted-foreground">Expiry Date</Label><Input type="date" value={formData.expiry_date} onChange={e => setFormData({...formData, expiry_date: e.target.value})} /></div>
          )}
          <div className="flex items-center gap-3 pt-6">
            <input type="checkbox" id="active-item" className="h-5 w-5 rounded-md border-primary text-primary focus:ring-primary" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} />
            <Label htmlFor="active-item" className="text-sm font-medium">Item is currently active</Label>
          </div>
        </div>
        <DialogFooter className="flex justify-between w-full border-t pt-4">
          {item && onDelete && (
            <Button variant="destructive" size="sm" onClick={() => { if(confirm("Are you sure? This item will be permanently removed.")) { onDelete(item.id); onOpenChange(false); } }}>
              <Trash2 className="h-4 w-4 mr-2" />Delete Item
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!formData.name}>{!item ? "Create Product" : "Save Changes"}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
