import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InventoryItem } from "@/hooks/useInventory";
import { toast } from "sonner";

interface BulkAdjustDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: InventoryItem[];
  onApply: (adjustments: any[]) => Promise<void>;
}

export const BulkAdjustDialog = ({
  open,
  onOpenChange,
  items,
  onApply
}: BulkAdjustDialogProps) => {
  const [adjustments, setAdjustments] = useState<any[]>(
    items.map(i => ({ itemId: i.id, quantity: 0, type: "adjustment", notes: "" }))
  );

  const handleSubmit = async () => {
    const activeAdjustments = adjustments.filter(adj => adj.quantity !== 0 || adj.type === 'adjustment');
    if (activeAdjustments.length === 0) return toast.error("No changes to apply");

    await onApply(activeAdjustments);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Bulk Inventory Update</DialogTitle><DialogDescription>Adjust multiple items in a single action</DialogDescription></DialogHeader>
        <Table className="mt-4">
          <TableHeader><TableRow><TableHead>Item</TableHead><TableHead className="w-32">Type</TableHead><TableHead className="w-24">Value</TableHead><TableHead>Notes</TableHead></TableRow></TableHeader>
          <TableBody>
            {adjustments.map((adj, idx) => (
              <TableRow key={adj.itemId}>
                <TableCell className="font-medium text-xs truncate max-w-[150px]">{items.find(i => i.id === adj.itemId)?.name}</TableCell>
                <TableCell>
                  <Select value={adj.type} onValueChange={v => { const a = [...adjustments]; a[idx].type = v; setAdjustments(a); }}>
                    <SelectTrigger className="h-8 text-[10px]"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="in">In (+)</SelectItem><SelectItem value="out">Out (-)</SelectItem><SelectItem value="adjustment">Set (=)</SelectItem></SelectContent>
                  </Select>
                </TableCell>
                <TableCell><Input type="number" className="h-8 text-xs" value={adj.quantity} onChange={e => { const a = [...adjustments]; a[idx].quantity = Number(e.target.value); setAdjustments(a); }} /></TableCell>
                <TableCell><Input className="h-8 text-xs" placeholder="..." value={adj.notes} onChange={e => { const a = [...adjustments]; a[idx].notes = e.target.value; setAdjustments(a); }} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit}>Apply All Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
