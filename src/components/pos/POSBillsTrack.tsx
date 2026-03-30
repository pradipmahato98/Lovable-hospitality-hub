import React, { useState, useMemo } from "react";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Eye,
  Printer,
  XCircle,
  GitMerge,
  Clock,
  User,
} from "lucide-react";
import { usePOSTransactions, POSTransaction, useVoidTransaction } from "@/hooks/usePOS";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

export function POSBillsTrack() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBills, setSelectedBills] = useState<string[]>([]);
  const [selectedBill, setSelectedBill] = useState<POSTransaction | null>(null);

  const { data: transactions = [] } = usePOSTransactions();
  const voidTransaction = useVoidTransaction();

  const filteredBills = useMemo(() => {
    return transactions.filter((t) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        t.transaction_number?.toLowerCase().includes(query) ||
        t.table_number?.toLowerCase().includes(query)
      );
    });
  }, [transactions, searchQuery]);

  const toggleBillSelection = (id: string) => {
    setSelectedBills((prev) =>
      prev.includes(id) ? prev.filter((bid) => bid !== id) : [...prev, id]
    );
  };

  const handleReprint = (bill: POSTransaction) => {
    toast.info(`Reprinting bill ${bill.transaction_number}...`);
    // Print logic here
  };

  const handleVoid = (bill: POSTransaction) => {
    if (confirm("Are you sure you want to void this bill?")) {
      voidTransaction.mutate({ transactionId: bill.id, reason: "Manual void from track" });
    }
  };

  const handleMerge = () => {
    if (selectedBills.length < 2) {
      toast.error("Please select at least two bills to merge");
      return;
    }
    toast.success(`Merging ${selectedBills.length} bills...`);
    // Merge logic here
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search bills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {selectedBills.length > 1 && (
            <Button variant="blue" className="gap-2" onClick={handleMerge}>
              <GitMerge className="h-4 w-4" />
              Merge Selected ({selectedBills.length})
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Bill #</TableHead>
                <TableHead>Table</TableHead>
                <TableHead>Staff/Time</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBills.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No bills found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredBills.map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedBills.includes(bill.id)}
                        onCheckedChange={() => toggleBillSelection(bill.id)}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-sm">{bill.transaction_number}</TableCell>
                    <TableCell><Badge variant="outline">T{bill.table_number}</Badge></TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1 text-xs font-medium">
                          <User className="h-3 w-3" />
                          {bill.customer_name || "Staff Admin"}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {format(parseISO(bill.created_at), "HH:mm, dd MMM")}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(bill.total)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedBill(bill)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleReprint(bill)}>
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleVoid(bill)}>
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Bill View Dialog */}
      <Dialog open={!!selectedBill} onOpenChange={() => setSelectedBill(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bill Review</DialogTitle>
          </DialogHeader>
          {selectedBill && (
            <div className="space-y-4 font-mono text-sm bg-secondary/20 p-4 rounded-lg">
               <div className="text-center border-b pb-2 space-y-1">
                  <h3 className="font-bold text-lg">RESTAURANT RECEIPT</h3>
                  <p>Table {selectedBill.table_number}</p>
                  <p>{selectedBill.transaction_number}</p>
                  <p>{format(parseISO(selectedBill.created_at), "PPP p")}</p>
               </div>
               <div className="space-y-1 py-2 border-b">
                  {selectedBill.items.map((item, i) => (
                    <div key={i} className="flex justify-between">
                       <span>{item.quantity}x {item.item_name}</span>
                       <span>{formatCurrency(item.item_price * item.quantity)}</span>
                    </div>
                  ))}
               </div>
               <div className="space-y-1 pt-2">
                  <div className="flex justify-between">
                     <span>Subtotal</span>
                     <span>{formatCurrency(selectedBill.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                     <span>Tax (10%)</span>
                     <span>{formatCurrency(selectedBill.tax_amount)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base mt-2 pt-2 border-t border-dashed">
                     <span>TOTAL</span>
                     <span>{formatCurrency(selectedBill.total)}</span>
                  </div>
               </div>
               <div className="text-center pt-4 text-xs">
                  <p>Processed by {selectedBill.customer_name || "Admin"}</p>
                  <p className="mt-2 font-bold italic">Thank you for your visit!</p>
               </div>
               <div className="flex gap-2 pt-4 border-t">
                  <Button variant="outline" className="flex-1" onClick={() => handleReprint(selectedBill)}>
                    <Printer className="h-4 w-4 mr-2" />
                    Reprint
                  </Button>
                  <Button variant="destructive" className="flex-1" onClick={() => handleVoid(selectedBill)}>
                    <XCircle className="h-4 w-4 mr-2" />
                    Void
                  </Button>
               </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
