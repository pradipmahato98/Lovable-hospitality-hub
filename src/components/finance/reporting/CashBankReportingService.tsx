import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  BarChart3,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Calendar
} from "lucide-react";

export function CashBankReportingService({ isReadOnly }: { isReadOnly?: boolean }) {
  const bankMovements = [
    { date: "2023-11-06", desc: "Guest Receipt - R-502", in: "$1,250.00", out: "-", balance: "$45,200.00" },
    { date: "2023-11-06", desc: "Vendor Pmt - Sysco", in: "-", out: "$3,400.00", balance: "$41,800.00" },
    { date: "2023-11-05", desc: "Cash Collection Post", in: "$5,100.00", out: "-", balance: "$45,200.00" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-display flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" /> Cash & Bank Reporting
          </h2>
          <p className="text-muted-foreground text-sm">Monitor liquidity, bank movement, and reconciliation performance.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" size="sm" className="gap-2">
              <Calendar className="h-4 w-4" /> This Month
           </Button>
           <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" /> Export CSV
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
             <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-success" /> Liquidity Snapshot
             </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
             <div className="flex justify-between items-end">
                <div>
                   <p className="text-3xl font-bold">$124,500.22</p>
                   <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Cash on Hand</p>
                </div>
                <div className="flex items-center gap-1 text-success font-bold text-sm">
                   <ArrowUpRight className="h-4 w-4" /> 12%
                </div>
             </div>
             <div className="grid grid-cols-2 gap-2">
                <div className="p-2 border rounded bg-secondary/10">
                   <p className="text-[10px] text-muted-foreground uppercase">Bank Balance</p>
                   <p className="text-sm font-bold">$118,200.00</p>
                </div>
                <div className="p-2 border rounded bg-secondary/10">
                   <p className="text-[10px] text-muted-foreground uppercase">Petty Cash</p>
                   <p className="text-sm font-bold">$6,300.22</p>
                </div>
             </div>
          </CardContent>
        </Card>

        <Card>
           <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Reconciliation Status</CardTitle>
           </CardHeader>
           <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                 <span>Chase Operating</span>
                 <Badge variant="outline" className="text-success border-success/20">Reconciled</Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                 <span>Wells Fargo Payroll</span>
                 <Badge variant="outline" className="text-warning border-warning/20">Pending (3 items)</Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                 <span>Main Safe</span>
                 <Badge variant="outline" className="text-success border-success/20">Reconciled</Badge>
              </div>
              <Button variant="ghost" size="sm" className="w-full text-xs" disabled={isReadOnly}>
                 Run Reconciliation Tool
              </Button>
           </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Bank Movements</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Inflow</TableHead>
                <TableHead>Outflow</TableHead>
                <TableHead className="text-right">Running Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bankMovements.map((m, i) => (
                <TableRow key={i}>
                  <TableCell className="text-xs">{m.date}</TableCell>
                  <TableCell className="font-medium">{m.desc}</TableCell>
                  <TableCell className="text-success">{m.in}</TableCell>
                  <TableCell className="text-destructive">{m.out}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{m.balance}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
