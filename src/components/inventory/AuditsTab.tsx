import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Eye, Plus } from "lucide-react";
import { format } from "date-fns";
import { InventoryAudit } from "@/hooks/useInventory";

interface AuditsTabProps {
  audits: InventoryAudit[];
  onAddAudit: () => void;
  onReconcile: (audit: InventoryAudit) => void;
  onViewDetails: (audit: InventoryAudit) => void;
}

export const AuditsTab = ({
  audits,
  onAddAudit,
  onReconcile,
  onViewDetails
}: AuditsTabProps) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Physical Inventory Audits</h2>
        <Button variant="gold" className="gap-2" onClick={onAddAudit}><CheckCircle2 className="h-4 w-4" />Start New Audit</Button>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {audits.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground">No audits recorded</Card>
        ) : audits.map(audit => (
          <Card key={audit.id} className="p-4 shadow-sm">
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{audit.audit_number}</span>
                  <Badge variant={audit.status === "completed" ? "success" : "secondary" as any}>{audit.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Location: {audit.location?.name} • {format(new Date(audit.created_at), "MMM d, yyyy")}</p>
              </div>
              <div className="flex gap-2">
                {audit.status === "in_progress" ? (
                  <Button variant="gold" size="sm" onClick={() => onReconcile(audit)}>Reconcile</Button>
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => onViewDetails(audit)}><Eye className="h-4 w-4" /></Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
