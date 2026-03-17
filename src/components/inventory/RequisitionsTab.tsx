import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, ClipboardList, Loader2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useInventoryRequisitions, useInventoryItems } from "@/hooks/useInventory";
import { supabase } from "@/integrations/supabase/client";

export function RequisitionsTab() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const { data: requisitions = [], isLoading, createRequisition, updateRequisitionStatus } = useInventoryRequisitions();
  const { data: items = [] } = useInventoryItems();

  const [form, setForm] = useState({
    department: "", required_date: "", priority: "normal", notes: "",
    items: [] as { item_id: string, quantity: number }[]
  });

  const addItemToReq = () => {
    setForm({ ...form, items: [...form.items, { item_id: "", quantity: 1 }] });
  };

  const updateItemInReq = (index: number, field: string, value: any) => {
    const newItems = [...form.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setForm({ ...form, items: newItems });
  };

  const handleCreate = async () => {
    try {
      if (form.items.length === 0) {
        toast.error("Please add at least one item");
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      await createRequisition.mutateAsync({
        ...form,
        requested_by: user?.id
      });
      toast.success("Requisition submitted for approval");
      setIsAddOpen(false);
      setForm({ department: "", required_date: "", priority: "normal", notes: "", items: [] });
    } catch { toast.error("Failed to submit requisition"); }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await updateRequisitionStatus.mutateAsync({ id, status });
      toast.success(`Requisition ${status}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Internal Requisitions</h3>
          <p className="text-sm text-muted-foreground">Departmental requests for stock fulfillment</p>
        </div>
        <Button variant="blue" className="gap-2" onClick={() => setIsAddOpen(true)}><Plus className="h-4 w-4" />New Request</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Req #</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Required Date</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right">Approval</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requisitions.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No requisitions found</TableCell></TableRow>
                ) : (
                  requisitions.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-mono font-bold text-primary">{req.requisition_number}</TableCell>
                      <TableCell>{req.department}</TableCell>
                      <TableCell>
                         <Badge variant="outline" className={
                           req.status === 'approved' ? "text-success border-success/20" :
                           req.status === 'rejected' ? "text-destructive border-destructive/20" : ""
                         }>{req.status.replace('_', ' ')}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">{req.required_date ? new Date(req.required_date).toLocaleDateString() : "-"}</TableCell>
                      <TableCell>{req.items?.length || 0} items</TableCell>
                      <TableCell className="text-right">
                        {req.status === 'pending' && (
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-success" onClick={() => handleStatusUpdate(req.id, 'approved')}><CheckCircle className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleStatusUpdate(req.id, 'rejected')}><XCircle className="h-4 w-4" /></Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Create Requisition</DialogTitle><DialogDescription>Submit a request for items from the main store</DialogDescription></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2"><Label>Department *</Label><Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></div>
            <div className="space-y-2"><Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Required Date</Label><Input type="date" value={form.required_date} onChange={(e) => setForm({ ...form, required_date: e.target.value })} /></div>
            <div className="space-y-2 col-span-2"><Label>Notes</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>

            <div className="col-span-2 space-y-4 pt-4 border-t">
              <div className="flex justify-between items-center"><Label className="text-base">Requested Items</Label><Button type="button" variant="outline" size="sm" onClick={addItemToReq}><Plus className="h-4 w-4 mr-2" />Add Item</Button></div>
              {form.items.map((item, idx) => (
                <div key={idx} className="flex gap-4 items-end">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Item</Label>
                    <Select value={item.item_id} onValueChange={(v) => updateItemInReq(idx, "item_id", v)}>
                      <SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger>
                      <SelectContent>{items.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="w-32 space-y-1">
                    <Label className="text-xs">Quantity</Label>
                    <Input type="number" value={item.quantity} onChange={(e) => updateItemInReq(idx, "quantity", Number(e.target.value))} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createRequisition.isPending} variant="blue">
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
