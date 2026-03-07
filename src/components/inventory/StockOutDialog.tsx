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
import { TrendingDown } from "lucide-react";
import { toast } from "sonner";

interface StockOutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: any) => Promise<void>;
  initialDepartment?: string;
}

export const StockOutDialog = ({
  open,
  onOpenChange,
  onConfirm,
  initialDepartment
}: StockOutDialogProps) => {
  const [formData, setFormData] = useState({
    quantity: 0,
    department: initialDepartment || "",
    notes: ""
  });

  const handleSubmit = async () => {
    if(!formData.department) return toast.error("Specify department");
    if(!formData.quantity) return toast.error("Specify quantity");

    await onConfirm(formData);
    onOpenChange(false);
    setFormData({ quantity: 0, department: initialDepartment || "", notes: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle className="flex items-center gap-2"><TrendingDown className="h-5 w-5 text-destructive" />Internal Consumption</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase font-bold text-muted-foreground">Issuing to Department</Label>
            <Select value={formData.department} onValueChange={v => setFormData({...formData, department: v})}>
              <SelectTrigger><SelectValue placeholder="Select receiver" /></SelectTrigger>
              <SelectContent>
                {["Housekeeping", "Kitchen", "Bar", "Maintenance", "Front Desk", "Engineering", "Admin"].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label className="text-xs uppercase font-bold text-muted-foreground">Quantity Removed</Label><Input type="number" value={formData.quantity} onChange={e => setFormData({...formData, quantity: Number(e.target.value)})} /></div>
          <div className="space-y-1.5"><Label className="text-xs uppercase font-bold text-muted-foreground">Reason</Label><Input value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="e.g. Room 301 setup" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" onClick={handleSubmit}>Confirm Issue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
