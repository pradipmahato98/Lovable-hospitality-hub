import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Eye } from "lucide-react";
import { InventoryTransfer } from "@/hooks/useInventory";

interface TransfersTabProps {
  transfers: InventoryTransfer[];
  onAddTransfer: () => void;
  onUpdateStatus: (id: string, status: "sent" | "completed") => void;
  onViewDetails: (trf: InventoryTransfer) => void;
}

export const TransfersTab = ({
  transfers,
  onAddTransfer,
  onUpdateStatus,
  onViewDetails
}: TransfersTabProps) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Internal Stock Transfers</h2>
        <Button variant="gold" className="gap-2" onClick={onAddTransfer}><RefreshCw className="h-4 w-4" />New Transfer</Button>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {transfers.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground">No active transfers</Card>
        ) : transfers.map(trf => (
          <Card key={trf.id} className="p-4 shadow-sm border-l-4 border-l-blue-500">
            <div className="flex justify-between items-center">
               <div>
                 <div className="flex items-center gap-2">
                   <span className="font-bold">{trf.transfer_number}</span>
                   <Badge>{trf.status}</Badge>
                 </div>
                 <p className="text-xs text-muted-foreground">{trf.from_location?.name} → {trf.to_location?.name}</p>
               </div>
               <div className="flex gap-2">
                 {trf.status === "pending" && (
                   <Button variant="outline" size="sm" onClick={() => onUpdateStatus(trf.id, "sent")}>Ship Items</Button>
                 )}
                 {trf.status === "sent" && (
                   <Button variant="gold" size="sm" onClick={() => onUpdateStatus(trf.id, "completed")}>Confirm Receipt</Button>
                 )}
                 <Button variant="ghost" size="sm" onClick={() => onViewDetails(trf)}><Eye className="h-4 w-4" /></Button>
               </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
