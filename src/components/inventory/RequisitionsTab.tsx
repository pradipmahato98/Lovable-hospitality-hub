import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardList, CheckCircle2, ShoppingCart, Eye, Trash2, Plus
} from "lucide-react";
import { format } from "date-fns";
import { InventoryRequisition } from "@/hooks/useInventory";

interface RequisitionsTabProps {
  requisitions: InventoryRequisition[];
  onAddRequisition: () => void;
  onApprove: (id: string) => void;
  onConvertToPO: (id: string) => void;
  onViewDetails: (req: InventoryRequisition) => void;
  onDelete: (id: string) => void;
}

export const RequisitionsTab = ({
  requisitions,
  onAddRequisition,
  onApprove,
  onConvertToPO,
  onViewDetails,
  onDelete
}: RequisitionsTabProps) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Internal Requisitions</h2>
        <Button variant="gold" className="gap-2" onClick={onAddRequisition}><Plus className="h-4 w-4" />New Requisition</Button>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {requisitions.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground">No active requisitions</Card>
        ) : requisitions.map(req => (
          <Card key={req.id} className="overflow-hidden shadow-sm border-l-4 border-l-primary hover:shadow-md transition-shadow">
            <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-primary/10 text-primary"><ClipboardList className="h-6 w-6" /></div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">{req.requisition_number}</span>
                    <Badge className={
                      req.status === "approved" ? "bg-success/20 text-success" :
                      req.status === "pending" ? "bg-amber-500/20 text-amber-500" :
                      req.status === "completed" ? "bg-blue-500/20 text-blue-500" :
                      "bg-muted text-muted-foreground"
                    }>{req.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground uppercase tracking-tight">Dept: {req.department} • {format(new Date(req.created_at), "MMM d, yyyy HH:mm")}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right hidden md:block mr-4">
                  <p className="text-sm font-medium">{req.items?.length || 0} items requested</p>
                </div>
                <div className="flex gap-2">
                  {req.status === "pending" && (
                    <Button variant="outline" size="sm" className="text-success gap-2 hover:bg-success hover:text-white" onClick={() => onApprove(req.id)}><CheckCircle2 className="h-4 w-4" />Approve</Button>
                  )}
                  {req.status === "approved" && (
                    <Button variant="gold" size="sm" className="gap-2" onClick={() => onConvertToPO(req.id)}><ShoppingCart className="h-4 w-4" />Generate PO</Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => onViewDetails(req)}><Eye className="h-4 w-4 mr-2" />Details</Button>
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => onDelete(req.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
