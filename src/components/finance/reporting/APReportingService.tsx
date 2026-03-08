import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Download, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useExpenses } from "@/hooks/useFinanceExtended";
import { differenceInDays } from "date-fns";

export function APReportingService({ isReadOnly }: { isReadOnly?: boolean }) {
  const { data: expenses, isLoading } = useExpenses();

  const { agingData, buckets } = useMemo(() => {
    const unpaid = (expenses || []).filter((e) => e.status !== "paid");
    const today = new Date();

    const vendorMap: Record<string, { vendor: string; current: number; d30: number; d60: number; d90: number; d90plus: number; total: number }> = {};

    unpaid.forEach((exp) => {
      const expDate = new Date(exp.expense_date);
      const daysOld = Math.max(0, differenceInDays(today, expDate));
      const vendorName = exp.vendor || exp.category || "Unspecified";

      if (!vendorMap[vendorName]) {
        vendorMap[vendorName] = { vendor: vendorName, current: 0, d30: 0, d60: 0, d90: 0, d90plus: 0, total: 0 };
      }

      const entry = vendorMap[vendorName];
      const amount = exp.amount;

      if (daysOld <= 0) entry.current += amount;
      else if (daysOld <= 30) entry.d30 += amount;
      else if (daysOld <= 60) entry.d60 += amount;
      else if (daysOld <= 90) entry.d90 += amount;
      else entry.d90plus += amount;

      entry.total += amount;
    });

    const rows = Object.values(vendorMap);
    const bk = {
      current: rows.reduce((s, r) => s + r.current, 0),
      d30: rows.reduce((s, r) => s + r.d30, 0),
      d60: rows.reduce((s, r) => s + r.d60, 0),
      d90: rows.reduce((s, r) => s + r.d90, 0),
      d90plus: rows.reduce((s, r) => s + r.d90plus, 0),
      total: rows.reduce((s, r) => s + r.total, 0),
    };
    return { agingData: rows, buckets: bk };
  }, [expenses]);

  const fmt = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  const dueSoon = agingData.filter((r) => r.current > 0).reduce((s, r) => s + r.current, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-display flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" /> AP Aging Report
          </h2>
          <p className="text-muted-foreground text-sm">Vendor payables and outstanding obligations by age.</p>
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
          <CardTitle>Payables Aging Analysis</CardTitle>
          <CardDescription>
            {isLoading ? "Loading..." : `${agingData.length} vendors with outstanding payables`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Vendor / Payee</TableHead>
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
                    No outstanding payables
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {agingData.map((row) => (
                    <TableRow key={row.vendor}>
                      <TableCell className="font-medium text-sm">{row.vendor}</TableCell>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-primary/5 border-primary/10">
          <CardHeader><CardTitle className="text-xs uppercase font-bold text-muted-foreground">Cash Flow Impact</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm">Total payables due in the next 15 days: <span className="font-bold font-display">{fmt(dueSoon)}</span></p>
          </CardContent>
        </Card>
        <Card className="bg-success/5 border-success/10">
          <CardHeader><CardTitle className="text-xs uppercase font-bold text-muted-foreground">Total Outstanding</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm">All unpaid vendor obligations: <span className="font-bold font-display text-primary">{fmt(buckets.total)}</span></p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
