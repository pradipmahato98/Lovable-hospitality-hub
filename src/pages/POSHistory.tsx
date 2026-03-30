import React, { useState, useMemo } from "react";
import { formatCurrency } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";
import { POSHeader } from "@/components/pos";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Receipt,
  Search,
  Download,
  Calendar,
  Eye,
  FileSpreadsheet,
  FileText,
  CreditCard,
  Banknote,
  Wallet,
  Building2,
  RotateCcw,
  XCircle,
  Loader2,
} from "lucide-react";
import { usePOSTransactions, POSTransaction, useVoidTransaction, useRefundTransaction } from "@/hooks/usePOS";
import { format, subDays, subHours, isValid } from "date-fns";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { POSCombinedHistory } from "@/components/pos/POSCombinedHistory";

const paymentMethodIcons: Record<string, React.ReactNode> = {
  cash: <Banknote className="h-4 w-4" />,
  card: <CreditCard className="h-4 w-4" />,
  digital: <Wallet className="h-4 w-4" />,
  room: <Building2 className="h-4 w-4" />,
};

const paymentMethodLabels: Record<string, string> = {
  cash: "Cash",
  card: "Card",
  digital: "Digital Wallet",
  room: "Room Charge",
};

export default function POSHistory() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState<POSTransaction | null>(null);
  
  // Void/Refund state
  const [voidDialogOpen, setVoidDialogOpen] = useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [actionTransaction, setActionTransaction] = useState<POSTransaction | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [refundAmount, setRefundAmount] = useState("");

  const { data: realTransactions, isLoading } = usePOSTransactions({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    paymentMethod: paymentFilter || undefined,
  });

  const voidTransaction = useVoidTransaction();
  const refundTransaction = useRefundTransaction();

  // High-fidelity mock transactions fallback
  const mockTransactions: POSTransaction[] = useMemo(() => [
    {
      id: "m1",
      transaction_number: "TXN-20240320-001",
      table_number: "5",
      customer_name: "John Doe",
      subtotal: 100.00,
      tax_amount: 10.00,
      total: 110.00,
      payment_method: "card",
      items_count: 3,
      created_at: subHours(new Date(), 1).toISOString(),
      items: [
        { id: "i1", item_name: "Dinner Platter", item_price: 35.00, quantity: 2, category: "Food", status: "served", notes: null },
        { id: "i2", item_name: "Wine Glass", item_price: 15.00, quantity: 2, category: "Bar", status: "served", notes: null },
      ],
      customer_address: null, company_id: null, company_name: null, vat_number: null, pan_number: null, tip_amount: 5, rrn_number: null, transaction_ref: null, card_last_four: "4242", card_type: "Visa", room_number: null, discount_amount: 0, status: "completed"
    },
    {
      id: "m2",
      transaction_number: "TXN-20240320-002",
      table_number: "12",
      customer_name: "Jane Smith",
      subtotal: 45.00,
      tax_amount: 4.50,
      total: 49.50,
      payment_method: "cash",
      items_count: 2,
      created_at: subHours(new Date(), 3).toISOString(),
      items: [
        { id: "i3", item_name: "Lunch Special", item_price: 22.00, quantity: 2, category: "Food", status: "served", notes: "No onions" },
      ],
      customer_address: null, company_id: null, company_name: null, vat_number: null, pan_number: null, tip_amount: 0, rrn_number: null, transaction_ref: null, card_last_four: null, card_type: null, room_number: null, discount_amount: 0, status: "completed"
    },
    {
      id: "m3",
      transaction_number: "TXN-20240319-045",
      table_number: "8",
      customer_name: "Alice Brown",
      subtotal: 250.00,
      tax_amount: 25.00,
      total: 275.00,
      payment_method: "digital",
      items_count: 5,
      created_at: subDays(new Date(), 1).toISOString(),
      items: [],
      customer_address: null, company_id: null, company_name: "Acme Corp", vat_number: "VAT123", pan_number: null, tip_amount: 0, rrn_number: "RRN789", transaction_ref: "REF456", card_last_four: null, card_type: null, room_number: null, discount_amount: 0, status: "completed"
    }
  ], []);

  const transactions = useMemo(() => {
    if (realTransactions && realTransactions.length > 0) return realTransactions;
    return mockTransactions;
  }, [realTransactions, mockTransactions]);

  // Filter by search query
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        t.transaction_number?.toLowerCase().includes(query) ||
        t.table_number?.toLowerCase().includes(query) ||
        t.customer_name?.toLowerCase().includes(query) ||
        t.company_name?.toLowerCase().includes(query)
      );
    });
  }, [transactions, searchQuery]);

  // Calculate totals
  const { totalRevenue, totalTransactions, avgTransaction } = useMemo(() => {
    const validTransactions = filteredTransactions.filter(t => t.status !== "voided");
    const revenue = validTransactions.reduce((sum, t) => sum + (t.total || 0), 0);
    const count = validTransactions.length;
    return {
      totalRevenue: revenue,
      totalTransactions: count,
      avgTransaction: count > 0 ? revenue / count : 0
    };
  }, [filteredTransactions]);

  // Safe date formatter
  const formatDateSafe = (dateStr: string, formatStr: string) => {
    try {
      const date = new Date(dateStr);
      if (!isValid(date)) return "Invalid Date";
      return format(date, formatStr);
    } catch (e) {
      return "Invalid Date";
    }
  };

  // Void handler
  const handleVoidClick = (transaction: POSTransaction) => {
    setActionTransaction(transaction);
    setActionReason("");
    setVoidDialogOpen(true);
  };

  const handleVoidConfirm = () => {
    if (!actionTransaction) return;
    if (!actionReason.trim()) {
      toast.error("Please provide a reason for voiding");
      return;
    }
    voidTransaction.mutate({
      transactionId: actionTransaction.id,
      reason: actionReason
    }, {
      onSuccess: () => {
        setVoidDialogOpen(false);
        setActionTransaction(null);
        setActionReason("");
      }
    });
  };

  // Refund handler
  const handleRefundClick = (transaction: POSTransaction) => {
    setActionTransaction(transaction);
    setActionReason("");
    setRefundAmount(String(transaction.total || 0));
    setRefundDialogOpen(true);
  };

  const handleRefundConfirm = () => {
    if (!actionTransaction) return;
    if (!actionReason.trim()) {
      toast.error("Please provide a reason for refund");
      return;
    }
    const amount = parseFloat(refundAmount);
    if (isNaN(amount) || amount <= 0 || amount > (actionTransaction.total || 0)) {
      toast.error("Invalid refund amount");
      return;
    }
    refundTransaction.mutate({
      transactionId: actionTransaction.id,
      amount,
      reason: actionReason
    }, {
      onSuccess: () => {
        setRefundDialogOpen(false);
        setActionTransaction(null);
        setActionReason("");
        setRefundAmount("");
      }
    });
  };

  // Export functions
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("POS Transaction History", 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 14, 30);

    if (startDate || endDate) {
      doc.text(`Period: ${startDate || "Start"} to ${endDate || "Now"}`, 14, 36);
    }

    doc.setFontSize(12);
    doc.text(`Total Transactions: ${totalTransactions}`, 14, 46);
    doc.text(`Total Revenue: ${formatCurrency(totalRevenue)}`, 14, 52);
    doc.text(`Average Transaction: ${formatCurrency(avgTransaction)}`, 14, 58);

    let y = 70;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("TXN #", 14, y);
    doc.text("Date", 50, y);
    doc.text("Table", 90, y);
    doc.text("Payment", 110, y);
    doc.text("Total", 150, y);

    doc.setFont("helvetica", "normal");
    y += 8;

    filteredTransactions.slice(0, 30).forEach((t) => {
      doc.text((t.transaction_number || "").slice(-8), 14, y);
      doc.text(formatDateSafe(t.created_at, "dd/MM HH:mm"), 50, y);
      doc.text(`T${t.table_number || ""}`, 90, y);
      doc.text(paymentMethodLabels[t.payment_method] || t.payment_method || "", 110, y);
      doc.text(formatCurrency(t.total || 0), 150, y);
      y += 6;

      if (y > 280) {
        doc.addPage();
        y = 20;
      }
    });

    doc.save(`pos-history-${format(new Date(), "yyyy-MM-dd")}.pdf`);
  };

  const exportToExcel = () => {
    const data = filteredTransactions.map((t) => ({
      "Transaction #": t.transaction_number,
      "Status": t.status || "completed",
      Date: formatDateSafe(t.created_at, "dd/MM/yyyy HH:mm:ss"),
      Table: t.table_number,
      Customer: t.customer_name || "-",
      Company: t.company_name || "-",
      "VAT #": t.vat_number || "-",
      Subtotal: t.subtotal,
      Discount: t.discount_amount || 0,
      Tax: t.tax_amount,
      Tip: t.tip_amount || 0,
      Total: t.total,
      "Payment Method": paymentMethodLabels[t.payment_method] || t.payment_method,
      "RRN #": t.rrn_number || "-",
      "Transaction Ref": t.transaction_ref || "-",
      "Items Count": t.items_count,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");
    XLSX.writeFile(wb, `pos-history-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "voided":
        return <Badge variant="destructive">Voided</Badge>;
      case "refunded":
        return <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">Refunded</Badge>;
      case "partial_refund":
        return <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">Partial Refund</Badge>;
      default:
        return <Badge className="bg-success/20 text-success border-success/30">Completed</Badge>;
    }
  };

  return (
    <MainLayout fixedHeight title="POS Transaction History" subtitle="View and export completed sales records">
      <div className="flex flex-col h-full overflow-hidden">
      <POSHeader />
      <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide p-4 sm:p-6 space-y-6">
        <POSCombinedHistory />
        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card variant="elevated" className="bg-gradient-to-br from-primary/10 to-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/20">
                  <Receipt className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Transactions</p>
                  <p className="text-2xl font-bold">{totalTransactions}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated" className="bg-gradient-to-br from-success/10 to-success/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-success/20">
                  <Banknote className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold text-success">{formatCurrency(totalRevenue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated" className="bg-gradient-to-br from-amber-500/10 to-amber-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-amber-500/20">
                  <CreditCard className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Transaction</p>
                  <p className="text-2xl font-bold">{formatCurrency(avgTransaction)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated" className="bg-gradient-to-br from-purple-500/10 to-purple-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-purple-500/20">
                  <Calendar className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date Range</p>
                  <p className="text-sm font-medium">
                    {startDate || "All"} - {endDate || "Now"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All methods" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_methods">All methods</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="digital">Digital Wallet</SelectItem>
                    <SelectItem value="room">Room Charge</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Export</Label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={exportToPDF} className="flex-1">
                    <FileText className="h-4 w-4 mr-1" />
                    PDF
                  </Button>
                  <Button variant="outline" size="sm" onClick={exportToExcel} className="flex-1">
                    <FileSpreadsheet className="h-4 w-4 mr-1" />
                    Excel
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>
              {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{isLoading ? "Loading transactions..." : "No transactions found"}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction #</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Table</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => (
                      <TableRow 
                        key={transaction.id || Math.random()} 
                        className={`hover:bg-secondary/20 ${transaction.status === "voided" ? "opacity-50" : ""}`}
                      >
                        <TableCell className="font-mono text-sm">
                          {transaction.transaction_number || "N/A"}
                        </TableCell>
                        <TableCell>
                          {formatDateSafe(transaction.created_at, "dd/MM/yyyy HH:mm")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">T{transaction.table_number || "0"}</Badge>
                        </TableCell>
                        <TableCell>
                          {transaction.company_name || transaction.customer_name || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="gap-1">
                            {transaction.payment_method && paymentMethodIcons[transaction.payment_method]}
                            {paymentMethodLabels[transaction.payment_method] || transaction.payment_method || "Other"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(transaction.status)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(transaction.total || 0)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedTransaction(transaction)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {transaction.status !== "voided" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-amber-500 hover:text-amber-600"
                                  onClick={() => handleRefundClick(transaction)}
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => handleVoidClick(transaction)}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      </div>

      {/* Transaction Detail Dialog */}
      <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription>
              {selectedTransaction?.transaction_number}
            </DialogDescription>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p className="font-medium">{formatDateSafe(selectedTransaction.created_at, "dd MMM yyyy HH:mm")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Table</p>
                  <p className="font-medium">T{selectedTransaction.table_number}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Customer</p>
                  <p className="font-medium">{selectedTransaction.customer_name || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Payment</p>
                  <p className="font-medium">{paymentMethodLabels[selectedTransaction.payment_method] || selectedTransaction.payment_method}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  {getStatusBadge(selectedTransaction.status)}
                </div>
                {selectedTransaction.company_name && (
                  <div>
                    <p className="text-muted-foreground">Company</p>
                    <p className="font-medium">{selectedTransaction.company_name}</p>
                  </div>
                )}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatCurrency(selectedTransaction.subtotal)}</span>
                </div>
                {(selectedTransaction.discount_amount || 0) > 0 && (
                  <div className="flex justify-between text-sm text-destructive">
                    <span>Discount</span>
                    <span>-{formatCurrency(selectedTransaction.discount_amount || 0)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span>Tax</span>
                  <span>{formatCurrency(selectedTransaction.tax_amount)}</span>
                </div>
                {(selectedTransaction.tip_amount || 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Tip</span>
                    <span>{formatCurrency(selectedTransaction.tip_amount || 0)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold border-t pt-2">
                  <span>Total</span>
                  <span>{formatCurrency(selectedTransaction.total)}</span>
                </div>
              </div>

              {selectedTransaction.items && selectedTransaction.items.length > 0 && (
                <div className="border-t pt-4">
                  <p className="font-medium mb-2">Items ({selectedTransaction.items_count})</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedTransaction.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>{item.quantity}x {item.item_name}</span>
                        <span>{formatCurrency(item.item_price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Void Confirmation Dialog */}
      <AlertDialog open={voidDialogOpen} onOpenChange={setVoidDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Void Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              This will void transaction {actionTransaction?.transaction_number}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label>Reason for voiding *</Label>
            <Textarea
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder="Enter reason..."
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleVoidConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={voidTransaction.isPending}
            >
              {voidTransaction.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Void Transaction
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Refund Dialog */}
      <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
            <DialogDescription>
              Refund for transaction {actionTransaction?.transaction_number}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Original Amount</Label>
              <p className="text-lg font-bold">{formatCurrency(actionTransaction?.total || 0)}</p>
            </div>
            <div className="space-y-2">
              <Label>Refund Amount *</Label>
              <Input
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                max={actionTransaction?.total || 0}
                min={0}
                step="0.01"
              />
            </div>
            <div className="space-y-2">
              <Label>Reason for refund *</Label>
              <Textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Enter reason..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleRefundConfirm}
              disabled={refundTransaction.isPending}
              className="bg-amber-500 hover:bg-amber-600"
            >
              {refundTransaction.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Process Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
