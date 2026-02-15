import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  GitPullRequest,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  ShieldAlert
} from "lucide-react";

export function ApprovalWorkflowService({ isReadOnly }: { isReadOnly?: boolean }) {
  const pendingApprovals = [
    { id: "APP-001", type: "Journal", initiator: "John Doe", amount: "$12,500.00", status: "Pending", date: "2023-11-05" },
    { id: "APP-002", type: "Payment", initiator: "Sarah Smith", amount: "$4,200.00", status: "Pending", date: "2023-11-06" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-display flex items-center gap-2">
            <GitPullRequest className="h-5 w-5 text-primary" /> Approval Workflow Engine
          </h2>
          <p className="text-muted-foreground text-sm">Centralized hub for multi-level financial approvals and maker-checker validation.</p>
        </div>
        <div className="flex gap-2">
           <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
              <ShieldAlert className="h-3 w-3 mr-1" /> Maker-Checker Enabled
           </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
               <Clock className="h-4 w-4 text-warning" /> Pending My Approval
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingApprovals.map((req) => (
              <div key={req.id} className="p-3 border rounded-lg space-y-3">
                 <div className="flex justify-between items-start">
                    <div>
                       <p className="text-xs font-bold">{req.id} - {req.type}</p>
                       <p className="text-[10px] text-muted-foreground">Initiated by {req.initiator} on {req.date}</p>
                    </div>
                    <span className="font-bold text-sm">{req.amount}</span>
                 </div>
                 <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="h-7 text-[10px] flex-1 border-success text-success hover:bg-success/10" disabled={isReadOnly}>
                       <CheckCircle2 className="h-3 w-3 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-[10px] flex-1 border-destructive text-destructive hover:bg-destructive/10" disabled={isReadOnly}>
                       <XCircle className="h-3 w-3 mr-1" /> Reject
                    </Button>
                 </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
               <UserCheck className="h-4 w-4 text-primary" /> Workflow Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg border text-center">
                   <p className="text-2xl font-bold">14</p>
                   <p className="text-[10px] text-muted-foreground uppercase">Approved Today</p>
                </div>
                <div className="p-3 rounded-lg border text-center">
                   <p className="text-2xl font-bold">0</p>
                   <p className="text-[10px] text-muted-foreground uppercase">Rejected Today</p>
                </div>
             </div>
             <Button variant="ghost" size="sm" className="w-full text-xs" disabled={isReadOnly}>
                View Historical Log
             </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
