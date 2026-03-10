import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DollarSign,
  CreditCard,
  History,
  Download,
  AlertCircle,
  Receipt,
  PiggyBank,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useInvoices, usePayments } from "@/hooks/useBillingData";
import { exportToExcel } from "@/lib/reportExport";

export function CashierReport() {
  const { data: invoices = [] } = useInvoices();
  const { data: payments = [] } = usePayments();
  const [actualCash, setActualCash] = useState<number>(0);

  // Cash Reconciliation: Expected Cash vs Actual Cash
  const expectedCash = useMemo(() => {
    return payments
      .filter((p) => p.payment_method === "cash" && p.status === "completed")
      .reduce((sum, p) => sum + (p.amount || 0), 0);
  }, [payments]);

  const cashShortage = actualCash - expectedCash;

  // Settlement Summary: Breakdown by payment type
  const settlementSummary = useMemo(() => {
    const summary: Record<string, number> = {
      cash: 0,
      card: 0,
      digital: 0,
      room: 0,
    };
    payments
      .filter((p) => p.status === "completed")
      .forEach((p) => {
        const method = p.payment_method?.toLowerCase() || "other";
        summary[method] = (summary[method] || 0) + (p.amount || 0);
      });
    return summary;
  }, [payments]);

  // Paid-Out / Petty Cash
  const paidOuts = useMemo(() => {
    // In this mockup, we'll assume a small subset of payments as paid outs
    return [
      { id: "1", reason: "Petty Cash: Lemons", amount: 15, date: "2024-03-20" },
      { id: "2", reason: "Emergency Supplies", amount: 45.5, date: "2024-03-20" },
    ];
  }, []);

  const handleExport = () => {
    const headers = ["Payment Method", "Amount"];
    const rows = Object.entries(settlementSummary).map(([method, amount]) => [method, amount]);
    exportToExcel({ title: "Cashier Settlement Report", headers, rows });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cash Reconciliation */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PiggyBank className="h-5 w-5" /> Cash Reconciliation
            </CardTitle>
            <CardDescription>Expected vs actual drawer count</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Expected Cash (System):</span>
              <span className="font-semibold">{formatCurrency(expectedCash)}</span>
            </div>
            <div className="space-y-2">
              <Label>Actual Cash in Drawer:</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={actualCash}
                  onChange={(e) => setActualCash(parseFloat(e.target.value) || 0)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className={`p-4 rounded-lg flex items-center justify-between ${cashShortage < 0 ? 'bg-destructive/10 border border-destructive/20' : 'bg-success/10 border border-success/20'}`}>
              <div className="flex items-center gap-2">
                <AlertCircle className={`h-4 w-4 ${cashShortage < 0 ? 'text-destructive' : 'text-success'}`} />
                <span className="font-semibold">{cashShortage < 0 ? 'Shortage' : 'Overage'}</span>
              </div>
              <span className={`text-xl font-bold ${cashShortage < 0 ? 'text-destructive' : 'text-success'}`}>
                {formatCurrency(Math.abs(cashShortage))}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Settlement Summary */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" /> Settlement Summary
              </CardTitle>
              <CardDescription>Breakdown by payment type</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" /> Export
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {Object.entries(settlementSummary).map(([method, amount]) => (
                <div key={method} className="p-3 bg-secondary/20 rounded-lg border">
                  <p className="text-xs text-muted-foreground uppercase">{method}</p>
                  <p className="text-lg font-bold">{formatCurrency(amount)}</p>
                </div>
              ))}
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment Type</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                  <TableHead className="text-right">Percentage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(settlementSummary).map(([method, amount]) => {
                  const total = Object.values(settlementSummary).reduce((s, v) => s + v, 0);
                  const percentage = total > 0 ? (amount / total) * 100 : 0;
                  return (
                    <TableRow key={method}>
                      <TableCell className="capitalize font-medium">{method}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(amount)}</TableCell>
                      <TableCell className="text-right">{percentage.toFixed(1)}%</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Paid-Outs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" /> Paid-Outs / Petty Cash
          </CardTitle>
          <CardDescription>Small amounts taken from till for expenses</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paidOuts.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.date}</TableCell>
                  <TableCell className="font-medium">{p.reason}</TableCell>
                  <TableCell className="text-right font-mono text-destructive">-{formatCurrency(p.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
