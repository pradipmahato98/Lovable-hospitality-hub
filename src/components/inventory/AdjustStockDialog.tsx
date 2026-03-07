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
import { ArrowUpDown } from "lucide-react";

interface AdjustStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdjust: (data: any) => Promise<void>;
}

export const AdjustStockDialog = ({
  open,
  onOpenChange,
  onAdjust
}: AdjustStockDialogProps) => {
  const [stockAdjustment, setStockAdjustment] = useState({
    quantity: 0, type: "in" as "in" | "out" | "adjustment", notes: "", department: "", locationId: "",
  });

  const handleSubmit = async () => {
    await onAdjust(stockAdjustment);
    onOpenChange(false);
    setStockAdjustment({ quantity: 0, type: "in", notes: "", department: "", locationId: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle className="flex items-center gap-2"><ArrowUpDown className="h-5 w-5" />Manual Stock Adjustment</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase font-bold text-muted-foreground">Adjustment Type</Label>
            <Select value={stockAdjustment.type} onValueChange={(v:any) => setStockAdjustment({...stockAdjustment, type: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="in">Restock / Return (+)</SelectItem>
                <SelectItem value="out">Lost / Damaged (-)</SelectItem>
                <SelectItem value="adjustment">Inventory Correction (=)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label className="text-xs uppercase font-bold text-muted-foreground">Quantity</Label><Input type="number" value={stockAdjustment.quantity} onChange={e => setStockAdjustment({...stockAdjustment, quantity: Number(e.target.value)})} /></div>
          <div className="space-y-1.5"><Label className="text-xs uppercase font-bold text-muted-foreground">Reason / Reference</Label><Input value={stockAdjustment.notes} onChange={e => setStockAdjustment({...stockAdjustment, notes: e.target.value})} placeholder="e.g. Annual stock take" /></div>
        </div>
        <DialogFooter><Button onClick={handleSubmit} className="w-full">Update Stock Level</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
