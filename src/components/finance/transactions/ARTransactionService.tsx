import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Download, FileText, CreditCard, Clock, BarChart3 } from "lucide-react";
import { useInvoices, usePayments } from "@/hooks/useFinanceExtended";
import { format, subDays, isBefore } from "date-fns";
import { exportToPDF, exportToExcel } from "@/lib/reportExport";

interface ARTransactionServiceProps {
  isReadOnly?: boolean;
}

export function ARTransactionService({ isReadOnly }: ARTransactionServiceProps) {
  const [activeTab, setActiveTab] = useState("invoices");
  const { data: invoices, isLoading: invLoading } = useInvoices();
  const { data: payments, isLoading: payLoading } = usePayments();

  const agingData = useMemo(() => {
    if (!invoices) return { current: 0, "30days": 0, "60days": 0, "90days": 0 };
    const now = new Date();
    const d30 = subDays(now, 30);
    const d60 = subDays(now, 60);
    const d90 = subDays(now, 90);

    return invoices.reduce((acc, inv) => {
      if (inv.status === "paid" || inv.balance_due <= 0) return acc;
      const invDate = new Date(inv.invoice_date);
      if (isBefore(invDate, d90)) acc["90days"] += inv.balance_due;
      else if (isBefore(invDate, d60)) acc["60days"] += inv.balance_due;
      else if (isBefore(invDate, d30)) acc["30days"] += inv.balance_due;
      else acc["current"] += inv.balance_due;
      return acc;
    }, { current: 0, "30days": 0, "60days": 0, "90days": 0 });
  }, [invoices]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-display">Accounts Receivable</h2>
          <p className="text-muted-foreground text-sm">Manage customer invoices, receipts, and deposits.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => {
            if (activeTab === "invoices") {
              exportToPDF({
                title: "Invoices Report",
                headers: ["Invoice #", "Guest", "Date", "Total", "Balance", "Status"],
                rows: invoices?.map(inv => [
                  inv.invoice_number,
                  inv.guest ? `${inv.guest.first_name} ${inv.guest.last_name}` : "Walk-in",
                  inv.invoice_date,
                  `$${inv.total.toFixed(2)}`,
                  `$${inv.balance_due.toFixed(2)}`,
                  inv.status
                ]) || []
              });
            } else if (activeTab === "aging") {
              exportToPDF({
                title: "AR Aging Report",
                headers: ["Bucket", "Balance"],
                rows: [
                  ["Current", `$${agingData.current.toFixed(2)}`],
                  ["30 Days", `$${agingData["30days"].toFixed(2)}`],
                  ["60 Days", `$${agingData["60days"].toFixed(2)}`],
                  ["90 Days", `$${agingData["90days"].toFixed(2)}`],
                ]
              });
            }
          }}>
            <Download className="h-4 w-4" /> Export
          </Button>
          {!isReadOnly && (
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> New Invoice
            </Button>
          )}
        </div>
      </div>

      {/* Aging Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Current", value: agingData.current, color: "text-success" },
          { label: "31-60 Days", value: agingData["30days"], color: "text-amber-500" },
          { label: "61-90 Days", value: agingData["60days"], color: "text-orange-500" },
          { label: "90+ Days", value: agingData["90days"], color: "text-destructive" },
        ].map((bucket) => (
          <Card key={bucket.label}>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">{bucket.label}</p>
              <p className={`text-2xl font-bold font-mono ${bucket.color}`}>${bucket.value.toFixed(2)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="invoices" className="gap-2">
            <FileText className="h-4 w-4" /> Invoices
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-2">
            <CreditCard className="h-4 w-4" /> Receipts & Payments
          </TabsTrigger>
          <TabsTrigger value="aging" className="gap-2">
            <Clock className="h-4 w-4" /> Aging Report
          </TabsTrigger>
        </TabsList>

        <TabsContent value="aging" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Accounts Receivable Aging
              </CardTitle>
              <CardDescription>Consolidated view of outstanding balances by age</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(agingData).map(([key, val]) => (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">{key === "current" ? "Current" : key.replace("days", " Days")}</span>
                      <span className="font-mono font-bold">${val.toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          key === "current" ? "bg-success" :
                          key === "30days" ? "bg-amber-500" :
                          key === "60days" ? "bg-orange-500" : "bg-destructive"
                        }`}
                        style={{ width: `${invoices && invoices.length > 0 ? (val / invoices.reduce((s,i)=>s+i.balance_due, 0)) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Register</CardTitle>
              <CardDescription>Track customer billing and outstanding balances</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {invLoading ? (
                <div className="p-8 text-center text-muted-foreground">Loading invoices...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Guest/Client</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No invoices found</TableCell>
                      </TableRow>
                    ) : (
                      invoices?.map((inv) => (
                        <TableRow key={inv.id}>
                          <TableCell className="font-mono">{inv.invoice_number}</TableCell>
                          <TableCell>{inv.guest ? `${inv.guest.first_name} ${inv.guest.last_name}` : "Walk-in"}</TableCell>
                          <TableCell>{inv.invoice_date}</TableCell>
                          <TableCell className="text-right font-mono">${inv.total.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-mono text-destructive">${inv.balance_due.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              inv.status === "paid" ? "bg-success/20 text-success" :
                              inv.status === "partial" ? "bg-amber-500/20 text-amber-400" : "bg-muted"
                            }>
                              {inv.status}
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
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>Record of all customer payments and settlements</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {payLoading ? (
                <div className="p-8 text-center text-muted-foreground">Loading payments...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payment #</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No payments found</TableCell>
                      </TableRow>
                    ) : (
                      payments?.map((pay) => (
                        <TableRow key={pay.id}>
                          <TableCell className="font-mono">{pay.payment_number}</TableCell>
                          <TableCell className="capitalize">{pay.payment_method}</TableCell>
                          <TableCell>{pay.payment_date}</TableCell>
                          <TableCell className="text-muted-foreground">{pay.reference_number || "-"}</TableCell>
                          <TableCell className="text-right font-mono text-success">${pay.amount.toFixed(2)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
