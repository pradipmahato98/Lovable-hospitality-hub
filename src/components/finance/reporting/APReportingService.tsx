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
  Calendar,
  Search,
  Filter,
  History
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function APReportingService({ isReadOnly }: { isReadOnly?: boolean }) {
  const agingData = [
    { vendor: 'Fresh Foods Co', current: 5400, 30: 0, 60: 0, 90: 0, total: 5400 },
    { vendor: 'CleanPro Services', current: 1200, 30: 0, 60: 0, 90: 0, total: 1200 },
    { vendor: 'Global Energy', current: 0, 30: 890, 60: 0, 90: 0, total: 890 },
    { vendor: 'Tech Support Inc', current: 0, 30: 0, 60: 450, 90: 0, total: 450 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-display flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" /> AP Aging Report
          </h2>
          <p className="text-muted-foreground text-sm">Detailed analysis of vendor payables and outstanding obligations by age.</p>
        </div>
        <Button className="gap-2">
          <Download className="h-4 w-4" /> Export Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
         {[
           { label: 'Current', amount: 6600, color: 'text-success' },
           { label: '1-30 Days', amount: 890, color: 'text-primary' },
           { label: '31-60 Days', amount: 450, color: 'text-amber-500' },
           { label: '61-90 Days', amount: 0, color: 'text-destructive' },
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
          <Input placeholder="Search by vendor name..." className="pl-9" />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Payables Aging Analysis</CardTitle>
          <CardDescription>Breakdown of vendor liability across chronological buckets</CardDescription>
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
                <TableHead className="text-right font-bold">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agingData.map((row) => (
                <TableRow key={row.vendor}>
                  <TableCell className="font-medium text-sm">{row.vendor}</TableCell>
                  <TableCell className="text-right font-mono text-xs">${row.current.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono text-xs">${row[30].toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono text-xs">${row[60].toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono text-xs">${row[90].toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono text-xs font-bold text-primary">${row.total.toLocaleString()}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/30 font-bold border-t-2">
                <TableCell>Totals</TableCell>
                <TableCell className="text-right font-mono text-xs">$6,600.00</TableCell>
                <TableCell className="text-right font-mono text-xs">$890.00</TableCell>
                <TableCell className="text-right font-mono text-xs">$450.00</TableCell>
                <TableCell className="text-right font-mono text-xs">$0.00</TableCell>
                <TableCell className="text-right font-mono text-sm text-primary">$7,940.00</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-primary/5 border-primary/10">
           <CardHeader>
              <CardTitle className="text-xs uppercase font-bold text-muted-foreground">Cash Flow Impact</CardTitle>
           </CardHeader>
           <CardContent>
              <p className="text-sm">Total payables due in the next 15 days: <span className="font-bold font-display">$6,600.00</span></p>
           </CardContent>
        </Card>
        <Card className="bg-success/5 border-success/10">
           <CardHeader>
              <CardTitle className="text-xs uppercase font-bold text-muted-foreground">Early Payment Discounts</CardTitle>
           </CardHeader>
           <CardContent>
              <p className="text-sm">Potential savings if paid by Friday: <span className="font-bold font-display text-success">$132.00</span></p>
           </CardContent>
        </Card>
      </div>
    </div>
  );
}
