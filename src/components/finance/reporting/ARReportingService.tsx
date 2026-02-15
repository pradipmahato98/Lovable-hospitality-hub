import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  FileText,
  Download,
  Clock,
  Search,
  Filter,
  History
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ARReportingService({ isReadOnly }: { isReadOnly?: boolean }) {
  const agingData = [
    { client: 'Global Tech Corp', current: 12500, 30: 0, 60: 0, 90: 0, total: 12500 },
    { client: 'Starlight Travel', current: 4500, 30: 2400, 60: 2000, 90: 0, total: 8900 },
    { client: 'James Wilson', current: 450, 30: 0, 60: 0, 90: 0, total: 450 },
    { client: 'Innovate Solutions', current: 0, 30: 12000, 60: 8000, 90: 2000, total: 22000 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-display flex items-center gap-2">
            <History className="h-5 w-5 text-primary" /> AR Aging Report
          </h2>
          <p className="text-muted-foreground text-sm">Detailed analysis of outstanding guest and corporate receivables by age.</p>
        </div>
        <Button className="gap-2">
          <Download className="h-4 w-4" /> Export Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
         {[
           { label: 'Current', amount: 17450, color: 'text-success' },
           { label: '1-30 Days', amount: 14400, color: 'text-primary' },
           { label: '31-60 Days', amount: 10000, color: 'text-amber-500' },
           { label: '61-90 Days', amount: 2000, color: 'text-destructive' },
           { label: '90+ Days', amount: 0, color: 'text-destructive' },
         ].map((bucket) => (
           <Card key={bucket.label} className="bg-secondary/10">
              <CardContent className="pt-4 text-center">
                 <p className="text-[10px] uppercase font-bold text-muted-foreground">{bucket.label}</p>
                 <p className={`text-sm font-bold mt-1 ${bucket.color}`}>${bucket.amount.toLocaleString()}</p>
              </CardContent>
           </Card>
         ))}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by client name..." className="pl-9" />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Aging Analysis Table</CardTitle>
          <CardDescription>Breakdown of outstanding balances across chronological buckets</CardDescription>
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
                <TableHead className="text-right font-bold">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agingData.map((row) => (
                <TableRow key={row.client}>
                  <TableCell className="font-medium text-sm">{row.client}</TableCell>
                  <TableCell className="text-right font-mono text-xs">${row.current.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono text-xs">${row[30].toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono text-xs">${row[60].toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono text-xs">${row[90].toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono text-xs font-bold text-primary">${row.total.toLocaleString()}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/30 font-bold border-t-2">
                <TableCell>Totals</TableCell>
                <TableCell className="text-right font-mono text-xs">$17,450.00</TableCell>
                <TableCell className="text-right font-mono text-xs">$14,400.00</TableCell>
                <TableCell className="text-right font-mono text-xs">$10,000.00</TableCell>
                <TableCell className="text-right font-mono text-xs">$2,000.00</TableCell>
                <TableCell className="text-right font-mono text-sm text-primary">$43,850.00</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-4 flex items-start gap-3">
         <Clock className="h-5 w-5 text-amber-500 mt-0.5" />
         <div>
            <h4 className="text-sm font-semibold text-amber-500">Dunning Action Required</h4>
            <p className="text-xs text-muted-foreground">
              3 accounts have balances older than 60 days. It is recommended to trigger the second-level dunning workflow for "Innovate Solutions" and "Starlight Travel".
            </p>
         </div>
      </div>
    </div>
  );
}
