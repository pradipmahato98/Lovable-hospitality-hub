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
import { Trash2 } from "lucide-react";
import { InventoryItem } from "@/hooks/useInventory";
import { toast } from "sonner";

interface WastageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: InventoryItem[];
  onConfirm: (data: any) => Promise<void>;
}

export const WastageDialog = ({
  open,
  onOpenChange,
  items,
  onConfirm
}: WastageDialogProps) => {
  const [formData, setFormData] = useState({
    item_id: "",
    quantity: 0,
    reason: "Expired",
    notes: ""
  });

  const handleSubmit = async () => {
    if(!formData.item_id || !formData.quantity) return toast.error("Complete all fields");
    await onConfirm(formData);
    onOpenChange(false);
    setFormData({ item_id: "", quantity: 0, reason: "Expired", notes: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Record Inventory Loss / Wastage</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-1.5"><Label>Product</Label>
            <Select value={formData.item_id} onValueChange={v => setFormData({...formData, item_id: v})}>
              <SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger>
              <SelectContent>{items.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>Quantity Lost</Label><Input type="number" value={formData.quantity} onChange={e => setFormData({...formData, quantity: Number(e.target.value)})} /></div>
            <div className="space-y-1.5"><Label>Reason</Label>
              <Select value={formData.reason} onValueChange={v => setFormData({...formData, reason: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Expired">Expired</SelectItem>
                  <SelectItem value="Damaged">Damaged</SelectItem>
                  <SelectItem value="Spillage">Spillage / Breakage</SelectItem>
                  <SelectItem value="Theft">Theft / Missing</SelectItem>
                  <SelectItem value="QC Fail">Quality Control Fail</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5"><Label>Notes</Label><Input value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Describe details..." /></div>
        </div>
        <DialogFooter><Button variant="destructive" onClick={handleSubmit} className="w-full">Confirm Stock Deduction</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
