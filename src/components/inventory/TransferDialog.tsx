import { useState } from "react";
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
import {
  Table, TableBody, TableCell, TableRow
} from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { InventoryItem, InventoryLocation } from "@/hooks/useInventory";
import { toast } from "sonner";

interface TransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locations: InventoryLocation[];
  items: InventoryItem[];
  onCreate: (data: any) => Promise<void>;
}

export const TransferDialog = ({
  open,
  onOpenChange,
  locations,
  items,
  onCreate
}: TransferDialogProps) => {
  const [formData, setFormData] = useState({
    from_location_id: "",
    to_location_id: "",
    notes: "",
    items: [] as { item_id: string; requested_quantity: number }[]
  });

  const handleSubmit = async () => {
    if (!formData.from_location_id || !formData.to_location_id) {
      return toast.error("Please select source and destination");
    }
    if (formData.items.length === 0) {
      return toast.error("Add at least one item");
    }

    try {
      await onCreate(formData);
      onOpenChange(false);
      setFormData({ from_location_id: "", to_location_id: "", notes: "", items: [] });
    } catch (e) {
      toast.error("Error creating transfer");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader><DialogTitle>Stock Transfer Request</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase font-bold text-muted-foreground">From Location</Label>
            <Select
              value={formData.from_location_id}
              onValueChange={v => setFormData({...formData, from_location_id: v, items: []})}
            >
              <SelectTrigger><SelectValue placeholder="Source" /></SelectTrigger>
              <SelectContent>{locations.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase font-bold text-muted-foreground">To Location</Label>
            <Select
              value={formData.to_location_id}
              onValueChange={v => setFormData({...formData, to_location_id: v})}
            >
              <SelectTrigger><SelectValue placeholder="Destination" /></SelectTrigger>
              <SelectContent>{locations.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="col-span-2 space-y-3">
             <div className="flex justify-between items-center">
               <Label className="text-xs uppercase font-bold text-muted-foreground">Items</Label>
               <Button
                 variant="outline"
                 size="sm"
                 disabled={!formData.from_location_id}
                 onClick={() => setFormData({...formData, items: [...formData.items, {item_id: "", requested_quantity: 1}]})}
               >
                 <Plus className="h-3 w-3 mr-2" /> Add Item
               </Button>
             </div>
             <div className="border rounded-lg max-h-[300px] overflow-y-auto">
               <Table>
                 <TableBody>
                   {formData.items.map((item, idx) => (
                     <TableRow key={idx}>
                       <TableCell className="w-[60%]">
                         <Select
                           value={item.item_id}
                           onValueChange={v => {
                             const a = [...formData.items];
                             a[idx].item_id = v;
                             setFormData({...formData, items: a});
                           }}
                         >
                           <SelectTrigger className="h-9"><SelectValue placeholder="Product" /></SelectTrigger>
                           <SelectContent>
                             {items
                               .filter(i => i.location_id === formData.from_location_id)
                               .map(i => <SelectItem key={i.id} value={i.id}>{i.name} ({i.current_stock})</SelectItem>)
                             }
                           </SelectContent>
                         </Select>
                       </TableCell>
                       <TableCell>
                         <Input
                           type="number"
                           className="h-9"
                           value={item.requested_quantity}
                           onChange={e => {
                             const a = [...formData.items];
                             a[idx].requested_quantity = Number(e.target.value);
                             setFormData({...formData, items: a});
                           }}
                         />
                       </TableCell>
                       <TableCell className="text-right">
                         <Button
                           variant="ghost"
                           size="icon"
                           className="h-9 w-9 text-destructive"
                           onClick={() => setFormData({...formData, items: formData.items.filter((_, i) => i !== idx)})}
                         >
                           <Trash2 className="h-4 w-4" />
                         </Button>
                       </TableCell>
                     </TableRow>
                   ))}
                   {formData.items.length === 0 && (
                     <TableRow>
                       <TableCell colSpan={3} className="text-center py-6 text-muted-foreground italic text-xs">
                         {!formData.from_location_id ? "Select source location first" : "No items added"}
                       </TableCell>
                     </TableRow>
                   )}
                 </TableBody>
               </Table>
             </div>
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label className="text-xs uppercase font-bold text-muted-foreground">Notes</Label>
            <Input
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
              placeholder="Reason for transfer..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} className="w-full">Create Transfer Request</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
