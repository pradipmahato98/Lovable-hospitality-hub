import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileSpreadsheet,
  Download,
  Search,
  PieChart,
  BarChart3
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function FixedAssetsReportingService({ isReadOnly }: { isReadOnly?: boolean }) {
  const assets = [
    { id: 'ASST-0001', name: 'Hotel Main Building', cost: 2500000, currentVal: 1850000, category: 'Land & Buildings' },
    { id: 'ASST-0452', name: 'Industrial Dishwasher', cost: 12500, currentVal: 8400, category: 'Furniture & Fixtures' },
    { id: 'ASST-0782', name: 'MacBook Pro M3 - Front Desk', cost: 2500, currentVal: 1800, category: 'IT Equipment' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-display flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" /> Fixed Asset Register
          </h2>
          <p className="text-muted-foreground text-sm">Comprehensive listing and valuation of all non-current assets.</p>
        </div>
        <Button className="gap-2">
          <Download className="h-4 w-4" /> Export Register
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-primary/5 border-primary/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-muted-foreground">Total Asset Cost</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="text-2xl font-bold font-display">$2,845,000.00</div>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-muted-foreground">Accumulated Depreciation</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="text-2xl font-bold font-display text-destructive">-$984,800.00</div>
          </CardContent>
        </Card>
        <Card className="bg-success/5 border-success/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-muted-foreground">Net Book Value</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="text-2xl font-bold font-display text-success">$1,860,200.00</div>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search register by asset ID or name..." className="pl-9" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Asset Register Table</CardTitle>
          <CardDescription>Current valuation and categorization of registered assets</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Asset ID</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Original Cost</TableHead>
                <TableHead className="text-right">Net Book Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-mono text-xs font-bold text-primary">{a.id}</TableCell>
                  <TableCell className="text-sm font-medium">{a.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px]">{a.category}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">${a.cost.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono text-xs font-bold">${a.currentVal.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
