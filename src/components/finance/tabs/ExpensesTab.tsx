import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Check, DollarSign } from "lucide-react";
import { useExpenses } from "@/hooks/useFinanceExtended";
import { useAccounts } from "@/hooks/useFinance";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  approved: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  paid: "bg-success/20 text-success border-success/30",
  rejected: "bg-destructive/20 text-destructive border-destructive/30",
};

const categories = ["Operations", "Maintenance", "F&B", "Housekeeping", "Marketing", "Utilities", "Salaries", "Other"];

export function FinanceExpensesTab() {
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const { data: expenses, isLoading, createExpense, approveExpense, markExpensePaid } = useExpenses();
  const { data: accounts } = useAccounts();

  const [newExpense, setNewExpense] = useState({
    category: "Operations",
    description: "",
    amount: 0,
    expense_date: new Date().toISOString().split("T")[0],
    vendor: null as string | null,
    account_id: null as string | null,
    status: "pending",
    receipt_url: null as string | null,
    notes: null as string | null,
  });

  const handleCreateExpense = async () => {
    if (!newExpense.description || !newExpense.amount) {
      toast.error("Description and amount are required"); return;
    }
    try {
      await createExpense.mutateAsync(newExpense);
      toast.success("Expense recorded");
      setExpenseDialogOpen(false);
      setNewExpense({ category: "Operations", description: "", amount: 0, expense_date: new Date().toISOString().split("T")[0], vendor: null, account_id: null, status: "pending", receipt_url: null, notes: null });
    } catch { toast.error("Failed to create expense"); }
  };

  const totalPending = expenses?.filter(e => e.status === "pending").reduce((s, e) => s + e.amount, 0) || 0;
  const totalPaid = expenses?.filter(e => e.status === "paid").reduce((s, e) => s + e.amount, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Pending: <span className="font-semibold text-amber-400">${totalPending.toFixed(2)}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Paid: <span className="font-semibold text-success">${totalPaid.toFixed(2)}</span>
          </div>
        </div>
        <Button onClick={() => setExpenseDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Record Expense
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" /> Expense Register
          </CardTitle>
          <CardDescription>Track and manage all operational expenses</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading expenses...</div>
          ) : !expenses?.length ? (
            <div className="p-8 text-center text-muted-foreground">No expenses recorded yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Expense #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((exp) => (
                  <TableRow key={exp.id}>
                    <TableCell className="font-mono text-primary">{exp.expense_number}</TableCell>
                    <TableCell>{exp.expense_date}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{exp.category}</Badge></TableCell>
                    <TableCell>{exp.description}</TableCell>
                    <TableCell className="text-muted-foreground">{exp.vendor || "-"}</TableCell>
                    <TableCell className="text-right font-mono font-semibold">${exp.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[exp.status] || ""}>{exp.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {exp.status === "pending" && (
                          <Button variant="ghost" size="sm" onClick={() => approveExpense.mutate({ id: exp.id, approvedBy: "system" })}>
                            <Check className="h-3 w-3 mr-1" /> Approve
                          </Button>
                        )}
                        {exp.status === "approved" && (
                          <Button variant="ghost" size="sm" onClick={() => markExpensePaid.mutate(exp.id)}>
                            <DollarSign className="h-3 w-3 mr-1" /> Pay
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* New Expense Dialog */}
      <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Expense</DialogTitle>
            <DialogDescription>Add a new expense for tracking and approval</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={newExpense.category} onValueChange={v => setNewExpense(p => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={newExpense.expense_date} onChange={e => setNewExpense(p => ({ ...p, expense_date: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input placeholder="What was this expense for?" value={newExpense.description} onChange={e => setNewExpense(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input type="number" placeholder="0.00" value={newExpense.amount || ""} onChange={e => setNewExpense(p => ({ ...p, amount: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div className="space-y-2">
                <Label>Vendor</Label>
                <Input placeholder="Vendor name" value={newExpense.vendor || ""} onChange={e => setNewExpense(p => ({ ...p, vendor: e.target.value || null }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Account (Optional)</Label>
              <Select value={newExpense.account_id || "none"} onValueChange={v => setNewExpense(p => ({ ...p, account_id: v === "none" ? null : v }))}>
                <SelectTrigger><SelectValue placeholder="Link to account" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {accounts.filter(a => a.type === "expense").map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.code} - {a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExpenseDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateExpense} disabled={createExpense.isPending}>
              {createExpense.isPending ? "Recording..." : "Record Expense"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
