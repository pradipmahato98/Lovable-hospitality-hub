import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, CheckCircle2, Loader2, ArrowUpRight, Search, Printer, RotateCcw, Package } from "lucide-react";
import { toast } from "sonner";
import { useInventoryRequisitions, useInventoryItems, useInventoryStores, useInventoryIssues } from "@/hooks/useInventory";

export function StockIssueTab() {
  const [isIssueOpen, setIsIssueOpen] = useState(false);
  const { data: requisitions = [], isLoading: loadingReqs } = useInventoryRequisitions();
  const { data: stores = [] } = useInventoryStores();
  const { createIssue } = useInventoryIssues();
  const [selectedReqId, setSelectedReqId] = useState<string | null>(null);

  // Local state for issue line items
  const [issueQtys, setIssueQtys] = useState<Record<string, { qty: number, batch: string }>>({});

  const pendingReqs = requisitions.filter(r => r.status === 'approved' || r.status === 'pending');

  const handleIssue = (req: any) => {
    setSelectedReqId(req.id);
    const initialQtys: any = {};
    req.items?.forEach((i: any) => {
      initialQtys[i.id] = { qty: i.quantity, batch: "" };
    });
    setIssueQtys(initialQtys);
    setIsIssueOpen(true);
  };

  const confirmIssue = async () => {
    const req = pendingReqs.find(r => r.id === selectedReqId);
    if (!req) return;

    try {
      const items = req.items?.map((i: any) => ({
        item_id: i.item_id,
        quantity: issueQtys[i.id]?.qty || 0,
        batch_number: issueQtys[i.id]?.batch
      })).filter((i: any) => i.quantity > 0);

      if (!items || items.length === 0) {
        toast.error("No items to issue");
        return;
      }

      await createIssue.mutateAsync({
        requisition_id: req.id,
        department: req.department,
        issued_to: req.requested_by, // Default to requester
        items
      });

      toast.success("Stock issue processed successfully");
      setIsIssueOpen(false);
    } catch {
      toast.error("Failed to process stock issue");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Departmental Stock Issues</h3>
          <p className="text-sm text-muted-foreground">Fulfill approved requisitions and track stock consumption by outlet</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" className="gap-2"><RotateCcw className="h-4 w-4" />Stock Return</Button>
           <Button variant="blue" className="gap-2" onClick={() => {}}><Plus className="h-4 w-4" />Direct Issue</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
         <Card className="bg-success/5 border-success/20">
            <CardContent className="pt-4">
               <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Pending Requisitions</p>
               <p className="text-2xl font-bold">{pendingReqs.length}</p>
            </CardContent>
         </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <ArrowUpRight className="h-4 w-4" /> Approved Requisitions for Fulfillment
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loadingReqs ? (
            <div className="flex items-center justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Req #</TableHead>
                  <TableHead>Dept / Outlet</TableHead>
                  <TableHead>Request Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingReqs.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No pending requisitions to issue</TableCell></TableRow>
                ) : (
                  pendingReqs.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-mono font-bold text-primary">{req.requisition_number}</TableCell>
                      <TableCell>{req.department}</TableCell>
                      <TableCell className="text-xs">{new Date(req.created_at).toLocaleDateString()}</TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{req.status}</Badge></TableCell>
                      <TableCell>{req.items?.length || 0} items</TableCell>
                      <TableCell className="text-right">
                        <Button variant="success" size="sm" onClick={() => handleIssue(req)}>Issue Stock</Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Issue Modal */}
      <Dialog open={isIssueOpen} onOpenChange={setIsIssueOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Issue Stock to {pendingReqs.find(r => r.id === selectedReqId)?.department}</DialogTitle><DialogDescription>Select source store and verify quantities for issue</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
             <div className="space-y-2">
                <Label>Source Store *</Label>
                <Select defaultValue={stores[0]?.id}>
                   <SelectTrigger><SelectValue placeholder="Select store" /></SelectTrigger>
                   <SelectContent>{stores.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
             </div>

             <Table>
                <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Requested</TableHead><TableHead>Available</TableHead><TableHead>To Issue</TableHead><TableHead>Batch #</TableHead></TableRow></TableHeader>
                <TableBody>
                   {pendingReqs.find(r => r.id === selectedReqId)?.items?.map((item: any) => (
                      <TableRow key={item.id}>
                         <TableCell className="font-medium">{item.item?.name}</TableCell>
                         <TableCell className="text-center font-bold">{item.quantity}</TableCell>
                         <TableCell><Badge variant="outline" className="text-success">{item.item?.current_stock}</Badge></TableCell>
                         <TableCell>
                            <Input type="number" className="w-20 h-8"
                              value={issueQtys[item.id]?.qty || 0}
                              onChange={(e) => setIssueQtys({...issueQtys, [item.id]: { ...issueQtys[item.id], qty: Number(e.target.value) }})} />
                         </TableCell>
                         <TableCell>
                            <Input className="h-8 text-xs w-24" placeholder="Optional"
                              value={issueQtys[item.id]?.batch || ""}
                              onChange={(e) => setIssueQtys({...issueQtys, [item.id]: { ...issueQtys[item.id], batch: e.target.value }})} />
                         </TableCell>
                      </TableRow>
                   ))}
                </TableBody>
             </Table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsIssueOpen(false)}>Cancel</Button>
            <Button variant="success" onClick={confirmIssue} disabled={createIssue.isPending} className="gap-2">
              {createIssue.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Confirm & Post Issue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
