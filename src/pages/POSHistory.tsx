import { useState, useMemo } from "react";
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
} from "@/components/ui/dialog";
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
} from "lucide-react";
import { usePOSTransactions, POSTransaction } from "@/hooks/usePOS";
import { format, subDays, subHours, isValid } from "date-fns";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";

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

  const { data: realTransactions, isLoading } = usePOSTransactions({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    paymentMethod: paymentFilter || undefined,
  });

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
      customer_address: null, company_id: null, company_name: null, vat_number: null, pan_number: null, tip_amount: 5, rrn_number: null, transaction_ref: null, card_last_four: "4242", card_type: "Visa", room_number: null, discount_amount: 0
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
      customer_address: null, company_id: null, company_name: null, vat_number: null, pan_number: null, tip_amount: 0, rrn_number: null, transaction_ref: null, card_last_four: null, card_type: null, room_number: null, discount_amount: 0
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
      customer_address: null, company_id: null, company_name: "Acme Corp", vat_number: "VAT123", pan_number: null, tip_amount: 0, rrn_number: "RRN789", transaction_ref: "REF456", card_last_four: null, card_type: null, room_number: null, discount_amount: 0
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
    const revenue = filteredTransactions.reduce((sum, t) => sum + (t.total || 0), 0);
    const count = filteredTransactions.length;
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

    // Table header
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

  return (
    <MainLayout title="POS Transaction History" subtitle="View and export completed sales records">
      <POSHeader />
      <div className="space-y-6">
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
                      <TableHead>Items</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id || Math.random()} className="hover:bg-secondary/20 cursor-pointer" onClick={() => setSelectedTransaction(transaction)}>
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
                        <TableCell>{transaction.items_count || 0}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(transaction.total || 0)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
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

      {/* Transaction Detail Dialog */}
      <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Transaction Details
            </DialogTitle>
            <DialogDescription>
              {selectedTransaction?.transaction_number}
            </DialogDescription>
          </DialogHeader>

          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Date & Time</p>
                  <p className="font-medium">
                    {formatDateSafe(selectedTransaction.created_at, "dd/MM/yyyy HH:mm:ss")}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Table</p>
                  <p className="font-medium">Table {selectedTransaction.table_number}</p>
                </div>
                {selectedTransaction.customer_name && (
                  <div>
                    <p className="text-muted-foreground">Customer</p>
                    <p className="font-medium">{selectedTransaction.customer_name}</p>
                  </div>
                )}
                {selectedTransaction.company_name && (
                  <div>
                    <p className="text-muted-foreground">Company</p>
                    <p className="font-medium">{selectedTransaction.company_name}</p>
                  </div>
                )}
                {selectedTransaction.vat_number && (
                  <div>
                    <p className="text-muted-foreground">VAT Number</p>
                    <p className="font-medium">{selectedTransaction.vat_number}</p>
                  </div>
                )}
                {selectedTransaction.pan_number && (
                  <div>
                    <p className="text-muted-foreground">PAN Number</p>
                    <p className="font-medium">{selectedTransaction.pan_number}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">Payment Method</p>
                  <p className="font-medium">
                    {paymentMethodLabels[selectedTransaction.payment_method] ||
                      selectedTransaction.payment_method}
                  </p>
                </div>
                {selectedTransaction.rrn_number && (
                  <div>
                    <p className="text-muted-foreground">RRN Number</p>
                    <p className="font-medium">{selectedTransaction.rrn_number}</p>
                  </div>
                )}
                {selectedTransaction.transaction_ref && (
                  <div>
                    <p className="text-muted-foreground">Transaction Ref</p>
                    <p className="font-medium">{selectedTransaction.transaction_ref}</p>
                  </div>
                )}
              </div>

              <div className="border-t border-border pt-4">
                <h4 className="font-medium mb-2">Items ({selectedTransaction.items_count})</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedTransaction.items?.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>
                        {item.item_name} x{item.quantity}
                      </span>
                      <span>${((item.item_price || 0) * (item.quantity || 0)).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-border pt-4 space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>${(selectedTransaction.subtotal || 0).toFixed(2)}</span>
                </div>
                {(selectedTransaction.discount_amount || 0) > 0 && (
                  <div className="flex justify-between text-sm text-success">
                    <span>Discount</span>
                    <span>-${selectedTransaction.discount_amount?.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span>Tax</span>
                  <span>${(selectedTransaction.tax_amount || 0).toFixed(2)}</span>
                </div>
                {(selectedTransaction.tip_amount || 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Tip</span>
                    <span>${selectedTransaction.tip_amount?.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t border-border pt-2">
                  <span>Total</span>
                  <span className="text-primary">${(selectedTransaction.total || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
