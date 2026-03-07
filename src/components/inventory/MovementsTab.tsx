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
import { FileDown } from "lucide-react";
import { format } from "date-fns";
import { StockMovement } from "@/hooks/useInventory";

interface MovementsTabProps {
  movements: StockMovement[];
  onExport: (data: any[], name: string) => void;
}

export const MovementsTab = ({
  movements,
  onExport
}: MovementsTabProps) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Stock Movements</h2>
        <Button variant="outline" onClick={() => onExport(movements, "Stock_Movements")}><FileDown className="h-4 w-4 mr-2" />Export Log</Button>
      </div>
      <Card className="shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Reference/Dept</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movements.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground">No recent inventory changes recorded</TableCell></TableRow>
            ) : movements.map(m => (
              <TableRow key={m.id}>
                <TableCell className="text-[10px] text-muted-foreground">{format(new Date(m.created_at), "MMM d, HH:mm:ss")}</TableCell>
                <TableCell className="font-medium text-sm">{(m.item as any)?.name || "Unknown Item"}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={`text-[10px] font-normal ${
                    m.movement_type === "in" ? "bg-success/10 text-success border-success/30" :
                    m.movement_type === "out" ? "bg-destructive/10 text-destructive border-destructive/30" :
                    "bg-muted text-muted-foreground"
                  }`}>{m.movement_type.toUpperCase()}</Badge>
                </TableCell>
                <TableCell className="font-bold text-sm">{m.movement_type === "out" ? "-" : "+"}{m.quantity}</TableCell>
                <TableCell className="text-xs text-muted-foreground truncate max-w-[200px]">{m.department || m.notes || "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};
