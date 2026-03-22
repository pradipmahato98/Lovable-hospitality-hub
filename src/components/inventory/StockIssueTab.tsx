import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, CheckCircle2, Loader2, ArrowUpRight, Search, Printer, RotateCcw, Package, History, ArrowDownLeft, XCircle, User, Building } from "lucide-react";
import { toast } from "sonner";
import { useProcurementService } from "@/hooks/inventory/useProcurementService";
import { useItemService } from "@/hooks/inventory/useItemService";
import { useStoreService } from "@/hooks/inventory/useStoreService";
import { useInventoryTransactionService } from "@/hooks/inventory/useInventoryTransactionService";
import { useReportingService } from "@/hooks/inventory/useReportingService";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Database } from "@/integrations/supabase/types";

type Requisition = Database['public']['Tables']['purchase_requisitions']['Row'] & {
  items?: (Database['public']['Tables']['purchase_requisition_items']['Row'] & {
     item?: Database['public']['Tables']['items']['Row']
  })[]
};

export function StockIssueTab() {
  const [isIssueOpen, setIsIssueOpen] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [isDirectIssueOpen, setIsDirectIssueOpen] = useState(false);

  const { requisitions: requisitionsQuery } = useProcurementService();
  const requisitions = (requisitionsQuery.data || []) as Requisition[];

  const { stores: storesQuery } = useStoreService();
  const stores = storesQuery.data || [];

  const queryClient = useQueryClient();
  const { items: itemsQuery } = useItemService();
  const items = itemsQuery.data || [];
  const { createMovement } = useInventoryTransactionService();

  const { data: issueHistory = [] } = useQuery({
     queryKey: ["inventory-stock-issues"],
     queryFn: async () => {
        const { data, error } = await supabase.from('inventory_stock_issues').select('*, items:inventory_stock_issue_items(*, item:items(*))').order('created_at', { ascending: false });
        if (error) throw error;
        return data;
     }
  });

  const createIssue = useMutation({
     mutationFn: async (payload: any) => {
        const { data: issue, error } = await supabase.from('inventory_stock_issues').insert({
           requisition_id: payload.requisition_id,
           department: payload.department,
           issue_number: `SIV-${Date.now()}`,
           status: 'issued'
        }).select().single();
        if (error) throw error;

        for (const item of payload.items) {
           await supabase.from('inventory_stock_issue_items').insert({
              stock_issue_id: issue.id,
              item_id: item.item_id,
              quantity: item.quantity
           });

           await createMovement.mutateAsync({
              item_id: item.item_id,
              quantity: item.quantity,
              movement_type: 'out',
              reference_id: issue.id,
              reference_type: 'stock_issue',
              notes: `Issue to ${payload.department}`
           });
        }
        return issue;
     },
     onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inventory-stock-issues"] })
  });

  const [selectedReqId, setSelectedReqId] = useState<string | null>(null);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  const [issueQtys, setIssueQtys] = useState<Record<string, { qty: number, batch: string }>>({});
  const [returnQtys, setReturnQtys] = useState<Record<string, number>>({});

  const [directIssueForm, setDirectIssueForm] = useState({
     department: "",
     store_id: "",
     issued_to_name: "",
     items: [] as { item_id: string, quantity: number }[]
  });

  const pendingReqs = requisitions.filter(r => r.status === 'approved' || r.status === 'pending');

  const handleIssue = (req: Requisition) => {
    setSelectedReqId(req.requisition_id);
    const initialQtys: Record<string, { qty: number, batch: string }> = {};
    req.items?.forEach((i) => {
      initialQtys[i.id] = { qty: i.quantity, batch: "" };
    });
    setIssueQtys(initialQtys);
    setIsIssueOpen(true);
  };

  const confirmIssue = async () => {
    const req = pendingReqs.find(r => r.requisition_id === selectedReqId);
    if (!req) return;

    try {
      const itemsToIssue = (req.items || []).map((i) => ({
        item_id: i.item_id,
        quantity: issueQtys[i.id]?.qty || 0,
        batch_number: issueQtys[i.id]?.batch
      })).filter((i) => i.quantity > 0);

      if (!itemsToIssue || itemsToIssue.length === 0) {
        toast.error("No items to issue");
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();

      await createIssue.mutateAsync({
        requisition_id: req.requisition_id,
        department: (req as any).department || "General",
        items: itemsToIssue
      });

      toast.success("Stock issue processed");
      setIsIssueOpen(false);
    } catch { toast.error("Failed"); }
  };

  const handleDirectIssue = async () => {
     try {
        if (!directIssueForm.department || directIssueForm.items.length === 0) {
           toast.error("Complete all fields and add items");
           return;
        }
        const { data: { user } } = await supabase.auth.getUser();
        await createIssue.mutateAsync({
           department: directIssueForm.department,
           items: directIssueForm.items
        });
        toast.success("Direct stock issue complete");
        setIsDirectIssueOpen(false);
        setDirectIssueForm({ department: "", store_id: "", issued_to_name: "", items: [] });
     } catch { toast.error("Failed"); }
  };

  const addDirectItem = () => {
     setDirectIssueForm({ ...directIssueForm, items: [...directIssueForm.items, { item_id: "", quantity: 1 }] });
  };

  const handleReturn = (issue: any) => {
    setSelectedIssueId(issue.id);
    const initialQtys: Record<string, number> = {};
    issue.items?.forEach((i: any) => {
      initialQtys[i.id] = 0;
    });
    setReturnQtys(initialQtys);
    setIsReturnOpen(true);
  };

  const confirmReturn = async () => {
    const issue = issueHistory.find(i => i.id === selectedIssueId);
    if (!issue) return;

    try {
      for (const item of (issue.items || [])) {
        const qty = returnQtys[item.id] || 0;
        if (qty > 0) {
          const { data: invItem } = await supabase.from('items').select('current_stock').eq('item_id', item.item_id).single();
          await supabase.from('items').update({ current_stock: (invItem?.current_stock || 0) + qty }).eq('item_id', item.item_id);

          await supabase.from('stock_movements').insert({
            item_id: item.item_id,
            movement_type: 'in',
            quantity: qty,
            reference_type: 'stock_issue',
            reference_id: issue.id,
            notes: `Return from ${issue.department}`
          });
        }
      }

      await supabase.from('inventory_stock_issues').update({ status: 'returned' }).eq('id', issue.id);
      toast.success("Returns processed");
      setIsReturnOpen(false);
    } catch { toast.error("Failed"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Departmental Stock Issues</h3>
          <p className="text-sm text-muted-foreground">Fulfill approved requisitions and track consumption</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" className="gap-2 h-9" onClick={() => setIsReturnOpen(true)}><RotateCcw className="h-4 w-4" />Process Return</Button>
           <Button variant="blue" className="gap-2 h-9" onClick={() => setIsDirectIssueOpen(true)}><Plus className="h-4 w-4" />Direct Issue</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {/* Pending Req View */}
         <Card>
            <CardHeader className="pb-2 border-b bg-amber-50/50">
               <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-amber-700"><ArrowUpRight className="h-3 w-3" /> Fulfill Pending Requisitions</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
               <Table>
                  <TableHeader><TableRow><TableHead className="text-[10px]">Req #</TableHead><TableHead className="text-[10px]">Dept</TableHead><TableHead className="text-right text-[10px]">Action</TableHead></TableRow></TableHeader>
                  <TableBody>
                     {pendingReqs.map(req => (
                        <TableRow key={req.requisition_id}>
                           <TableCell className="font-mono text-[10px] font-bold">{req.requisition_number}</TableCell>
                           <TableCell className="text-xs">{(req as any).department}</TableCell>
                           <TableCell className="text-right">
                              {req.status === 'approved' ? (
                                <Button variant="success" size="xs" className="h-6 text-[10px]" onClick={() => handleIssue(req)}>Issue Stock</Button>
                              ) : (
                                <Badge variant="secondary" className="text-[9px]">Awaiting</Badge>
                              )}
                           </TableCell>
                        </TableRow>
                     ))}
                     {pendingReqs.length === 0 && <TableRow><TableCell colSpan={3} className="text-center py-6 text-xs text-muted-foreground italic">Clean queue</TableCell></TableRow>}
                  </TableBody>
               </Table>
            </CardContent>
         </Card>

         {/* SIV History */}
         <Card>
            <CardHeader className="pb-2 border-b bg-blue-50/50">
               <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-blue-700"><History className="h-3 w-3" /> Stock Issue Ledger (SIV)</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
               <Table>
                  <TableHeader><TableRow><TableHead className="text-[10px]">SIV #</TableHead><TableHead className="text-[10px]">Dept</TableHead><TableHead className="text-[10px]">Status</TableHead><TableHead className="text-right text-[10px]">Action</TableHead></TableRow></TableHeader>
                  <TableBody>
                     {issueHistory.slice(0, 8).map(issue => (
                        <TableRow key={issue.id}>
                           <TableCell className="font-mono text-[10px] font-bold text-primary">{issue.issue_number}</TableCell>
                           <TableCell className="text-xs">{issue.department}</TableCell>
                           <TableCell><Badge variant="outline" className="text-[9px] h-4 uppercase">{issue.status}</Badge></TableCell>
                           <TableCell className="text-right">
                              {issue.status === 'issued' && (
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-amber-600" onClick={() => handleReturn(issue)}><RotateCcw className="h-3 w-3" /></Button>
                              )}
                           </TableCell>
                        </TableRow>
                     ))}
                  </TableBody>
               </Table>
            </CardContent>
         </Card>
      </div>

      {/* Direct Issue Modal */}
      <Dialog open={isDirectIssueOpen} onOpenChange={setIsDirectIssueOpen}>
         <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Direct Stock Issue (Ad-hoc)</DialogTitle><DialogDescription>Issue items without a pre-existing requisition</DialogDescription></DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
               <div className="space-y-1"><Label>Recipient Department *</Label><Input value={directIssueForm.department} onChange={(e) => setDirectIssueForm({...directIssueForm, department: e.target.value})} placeholder="e.g. Banquet 01" /></div>
               <div className="space-y-1"><Label>Source Store *</Label>
                  <Select value={directIssueForm.store_id} onValueChange={(v) => setDirectIssueForm({...directIssueForm, store_id: v})}>
                     <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                     <SelectContent>{stores.map((s: any) => <SelectItem key={s.store_id} value={s.store_id}>{s.store_name}</SelectItem>)}</SelectContent>
                  </Select>
               </div>
               <div className="col-span-2 space-y-1"><Label>Issued To (Person Name)</Label><Input value={directIssueForm.issued_to_name} onChange={(e) => setDirectIssueForm({...directIssueForm, issued_to_name: e.target.value})} /></div>

               <div className="col-span-2 pt-4 border-t space-y-3">
                  <div className="flex justify-between items-center"><h5 className="text-sm font-bold">Issue Items</h5><Button variant="outline" size="sm" onClick={addDirectItem}><Plus className="h-3 w-3 mr-1" />Add Row</Button></div>
                  {directIssueForm.items.map((it, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                       <Select value={it.item_id} onValueChange={(v) => {
                          const newItems = [...directIssueForm.items];
                          newItems[idx].item_id = v;
                          setDirectIssueForm({...directIssueForm, items: newItems});
                       }}>
                          <SelectTrigger className="flex-1 h-9"><SelectValue placeholder="Item" /></SelectTrigger>
                          <SelectContent>{items.map((i: any) => <SelectItem key={i.item_id} value={i.item_id}>{i.item_name} ({i.current_stock})</SelectItem>)}</SelectContent>
                       </Select>
                       <Input type="number" className="w-24 h-9" value={it.quantity} onChange={(e) => {
                          const newItems = [...directIssueForm.items];
                          newItems[idx].quantity = Number(e.target.value);
                          setDirectIssueForm({...directIssueForm, items: newItems});
                       }} />
                       <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => {
                          const newItems = directIssueForm.items.filter((_, i) => i !== idx);
                          setDirectIssueForm({...directIssueForm, items: newItems});
                       }}><XCircle className="h-4 w-4" /></Button>
                    </div>
                  ))}
               </div>
            </div>
            <DialogFooter>
               <Button variant="outline" onClick={() => setIsDirectIssueOpen(false)}>Cancel</Button>
               <Button variant="blue" onClick={handleDirectIssue}>Confirm & Post Issue</Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>

      {/* Return Modal */}
      <Dialog open={isReturnOpen} onOpenChange={setIsReturnOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><ArrowDownLeft className="h-5 w-5 text-blue-500" /> Process Stock Return</DialogTitle></DialogHeader>
          <div className="py-4 space-y-4">
             <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Returning from: {issueHistory.find(i => i.id === selectedIssueId)?.department}</p>
             <Table>
                <TableHeader><TableRow><TableHead className="text-[10px]">Item</TableHead><TableHead className="text-[10px]">Issued</TableHead><TableHead className="text-[10px]">Return Qty</TableHead></TableRow></TableHeader>
                <TableBody>
                   {issueHistory.find(i => i.id === selectedIssueId)?.items?.map((item: any) => (
                      <TableRow key={item.id}>
                         <TableCell className="text-xs font-medium">{item.item?.item_name}</TableCell>
                         <TableCell className="text-xs font-bold">{item.quantity}</TableCell>
                         <TableCell><Input type="number" className="w-20 h-8 text-xs"
                              max={item.quantity}
                              value={returnQtys[item.id] || 0}
                              onChange={(e) => setReturnQtys({...returnQtys, [item.id]: Number(e.target.value)})} /></TableCell>
                      </TableRow>
                   ))}
                </TableBody>
             </Table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReturnOpen(false)}>Cancel</Button>
            <Button variant="blue" onClick={confirmReturn}>Finalize Return</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
