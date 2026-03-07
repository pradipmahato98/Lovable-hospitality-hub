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
import { Eye, Plus, ShoppingCart } from "lucide-react";
import { format } from "date-fns";
import { PurchaseOrder } from "@/hooks/useInventory";

interface OrdersTabProps {
  purchaseOrders: PurchaseOrder[];
  onAddPO: () => void;
  onViewDetails: (po: PurchaseOrder) => void;
}

export const OrdersTab = ({
  purchaseOrders,
  onAddPO,
  onViewDetails
}: OrdersTabProps) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Purchase Orders</h2>
        <Button variant="gold" className="gap-2" onClick={onAddPO}><Plus className="h-4 w-4" />New Order</Button>
      </div>
      <Card className="shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Total</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchaseOrders.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-20 text-muted-foreground">No purchase orders found</TableCell></TableRow>
            ) : purchaseOrders.map(po => (
              <TableRow key={po.id}>
                <TableCell className="font-mono text-xs font-bold">{po.order_number}</TableCell>
                <TableCell className="text-sm">{po.supplier?.name || "-"}</TableCell>
                <TableCell className="text-sm">{format(new Date(po.order_date), "MMM d, yyyy")}</TableCell>
                <TableCell>
                  <Badge className={
                    po.status === "received" ? "bg-success/20 text-success border-success/30" :
                    po.status === "sent" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                    "bg-muted text-muted-foreground"
                  }>{po.status}</Badge>
                </TableCell>
                <TableCell className="font-bold text-sm">${po.total.toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => onViewDetails(po)} className="h-8 gap-1"><Eye className="h-3.5 w-3.5" />View</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};
