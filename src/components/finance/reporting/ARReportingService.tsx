import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Download, Clock, Search, Filter, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useInvoices } from "@/hooks/useFinanceExtended";
import { differenceInDays } from "date-fns";

export function ARReportingService({ isReadOnly }: { isReadOnly?: boolean }) {
  const { data: invoices, isLoading } = useInvoices();

  const { agingData, buckets } = useMemo(() => {
    const outstanding = (invoices || []).filter(
      (inv) => inv.status !== "paid" && inv.balance_due > 0
    );
    const today = new Date();

    // Group by guest/company
    const clientMap: Record<string, { client: string; current: number; d30: number; d60: number; d90: number; d90plus: number; total: number }> = {};

    outstanding.forEach((inv) => {
      const dueDate = inv.due_date ? new Date(inv.due_date) : new Date(inv.invoice_date);
      const daysOverdue = Math.max(0, differenceInDays(today, dueDate));
      const clientName = inv.guest
        ? `${inv.guest.first_name} ${inv.guest.last_name}`
        : `Invoice ${inv.invoice_number}`;

      if (!clientMap[clientName]) {
        clientMap[clientName] = { client: clientName, current: 0, d30: 0, d60: 0, d90: 0, d90plus: 0, total: 0 };
      }

      const entry = clientMap[clientName];
      const amount = inv.balance_due;

      if (daysOverdue <= 0) entry.current += amount;
      else if (daysOverdue <= 30) entry.d30 += amount;
      else if (daysOverdue <= 60) entry.d60 += amount;
      else if (daysOverdue <= 90) entry.d90 += amount;
      else entry.d90plus += amount;

      entry.total += amount;
    });

    const rows = Object.values(clientMap);
    const bk = {
      current: rows.reduce((s, r) => s + r.current, 0),
      d30: rows.reduce((s, r) => s + r.d30, 0),
      d60: rows.reduce((s, r) => s + r.d60, 0),
      d90: rows.reduce((s, r) => s + r.d90, 0),
      d90plus: rows.reduce((s, r) => s + r.d90plus, 0),
      total: rows.reduce((s, r) => s + r.total, 0),
    };

    return { agingData: rows, buckets: bk };
  }, [invoices]);

  const overdueCount = agingData.filter((r) => r.d60 > 0 || r.d90 > 0 || r.d90plus > 0).length;
  const fmt = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-display flex items-center gap-2">
            <History className="h-5 w-5 text-primary" /> AR Aging Report
          </h2>
          <p className="text-muted-foreground text-sm">Outstanding guest and corporate receivables by age bucket.</p>
        </div>
        <Button className="gap-2"><Download className="h-4 w-4" /> Export Report</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[
          { label: "Current", amount: buckets.current, color: "text-success" },
          { label: "1-30 Days", amount: buckets.d30, color: "text-primary" },
          { label: "31-60 Days", amount: buckets.d60, color: "text-amber-500" },
          { label: "61-90 Days", amount: buckets.d90, color: "text-destructive" },
          { label: "90+ Days", amount: buckets.d90plus, color: "text-destructive" },
        ].map((b) => (
          <Card key={b.label} className="bg-secondary/10">
            <CardContent className="pt-4 text-center">
              <p className="text-[10px] uppercase font-bold text-muted-foreground">{b.label}</p>
              <p className={`text-sm font-bold mt-1 ${b.color}`}>{fmt(b.amount)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Aging Analysis Table</CardTitle>
          <CardDescription>
            {isLoading ? "Loading..." : `${agingData.length} accounts with outstanding balances`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Customer / Client</TableHead>
                <TableHead className="text-right">Current</TableHead>
                <TableHead className="text-right">1-30 Days</TableHead>
                <TableHead className="text-right">31-60 Days</TableHead>
                <TableHead className="text-right">61-90 Days</TableHead>
                <TableHead className="text-right">90+</TableHead>
                <TableHead className="text-right font-bold">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agingData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No outstanding receivables
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {agingData.map((row) => (
                    <TableRow key={row.client}>
                      <TableCell className="font-medium text-sm">{row.client}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{fmt(row.current)}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{fmt(row.d30)}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{fmt(row.d60)}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{fmt(row.d90)}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{fmt(row.d90plus)}</TableCell>
                      <TableCell className="text-right font-mono text-xs font-bold text-primary">{fmt(row.total)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/30 font-bold border-t-2">
                    <TableCell>Totals</TableCell>
                    <TableCell className="text-right font-mono text-xs">{fmt(buckets.current)}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{fmt(buckets.d30)}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{fmt(buckets.d60)}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{fmt(buckets.d90)}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{fmt(buckets.d90plus)}</TableCell>
                    <TableCell className="text-right font-mono text-sm text-primary">{fmt(buckets.total)}</TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {overdueCount > 0 && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-4 flex items-start gap-3">
          <Clock className="h-5 w-5 text-amber-500 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-amber-500">Dunning Action Required</h4>
            <p className="text-xs text-muted-foreground">
              {overdueCount} account(s) have balances older than 60 days. Consider escalating collection efforts.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
