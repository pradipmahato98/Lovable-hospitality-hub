import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2 } from "lucide-react";
import { format } from "date-fns";
import { InventoryWastage } from "@/hooks/useInventory";

interface WastageTabProps {
  wastage: InventoryWastage[];
  onAddWastage: () => void;
}

export const WastageTab = ({
  wastage,
  onAddWastage
}: WastageTabProps) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Wastage & Loss Tracking</h2>
        <Button variant="gold" className="gap-2" onClick={onAddWastage}><Trash2 className="h-4 w-4" />Record Loss</Button>
      </div>
      <Card className="shadow-sm">
        <Table>
          <TableHeader>
            <TableRow><TableHead>Date</TableHead><TableHead>Item</TableHead><TableHead>Reason</TableHead><TableHead>Qty</TableHead><TableHead>Value Lost</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {wastage.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground">No wastage records found</TableCell></TableRow>
            ) : wastage.map(w => (
              <TableRow key={w.id}>
                <TableCell className="text-xs text-muted-foreground">{format(new Date(w.created_at), "MMM d, HH:mm")}</TableCell>
                <TableCell className="font-medium">{w.item?.name}</TableCell>
                <TableCell><Badge variant="outline">{w.reason}</Badge></TableCell>
                <TableCell className="font-bold text-destructive">-{w.quantity} {w.item?.unit}</TableCell>
                <TableCell className="font-mono text-sm">${(w.quantity * (w.item?.cost_price || 0)).toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};
