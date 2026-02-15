import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Plus, ShoppingBag, CheckCircle2 } from "lucide-react";
import { useExpenses } from "@/hooks/useFinanceExtended";

interface APTransactionServiceProps {
  isReadOnly?: boolean;
}

export function APTransactionService({ isReadOnly }: APTransactionServiceProps) {
  const { data: expenses, isLoading } = useExpenses();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-display">Accounts Payable</h2>
          <p className="text-muted-foreground text-sm">Manage vendor invoices, payments, and settlements.</p>
        </div>
        {!isReadOnly && (
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> New Expense
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Expense & Vendor Postings</CardTitle>
              <CardDescription>Recent vendor invoices and operational expenses</CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 gap-1">
                <ShoppingBag className="h-3 w-3" /> PO Matching
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading expenses...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Expense #</TableHead>
                  <TableHead>Vendor/Payee</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No expenses found</TableCell>
                  </TableRow>
                ) : (
                  expenses?.map((exp) => (
                    <TableRow key={exp.id}>
                      <TableCell className="font-mono">{exp.expense_number}</TableCell>
                      <TableCell>{exp.vendor || "Operational"}</TableCell>
                      <TableCell className="capitalize">{exp.category}</TableCell>
                      <TableCell>{exp.expense_date}</TableCell>
                      <TableCell className="text-right font-mono">${exp.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          exp.status === "paid" ? "bg-success/20 text-success" :
                          exp.status === "approved" ? "bg-blue-500/20 text-blue-400" : "bg-amber-500/20 text-amber-400"
                        }>
                          {exp.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-success/5 border-success/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" /> Automated Matching
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              98% of vendor invoices matched with PO/GRN automatically this period.
              No discrepancies detected requiring manual intervention.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
