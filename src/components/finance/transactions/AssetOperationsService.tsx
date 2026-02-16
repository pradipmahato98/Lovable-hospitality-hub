import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  History,
  ArrowRightLeft,
  Trash2,
  RefreshCw,
  Plus,
  Play
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function AssetOperationsService({ isReadOnly }: { isReadOnly?: boolean }) {
  const recentOps = [
    { id: '1', date: '2026-02-14', op: 'Capitalization', asset: 'ASST-0452', details: 'Industrial Dishwasher' },
    { id: '2', date: '2026-02-12', op: 'Transfer', asset: 'ASST-0128', details: 'Moving lobby furniture to storage' },
    { id: '3', date: '2026-02-10', op: 'Depreciation Run', asset: 'Global', details: 'January 2026 monthly run' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" /> Asset Operations
          </h2>
          <p className="text-muted-foreground text-sm">Execute lifecycle actions including capitalization, transfers, and monthly depreciation.</p>
        </div>
        {!isReadOnly && (
          <div className="flex gap-2">
             <Button variant="outline" className="gap-2">
                <Play className="h-4 w-4" /> Run Depreciation
             </Button>
             <Button className="gap-2">
                <Plus className="h-4 w-4" /> Capitalize Asset
             </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <Button variant="outline" className="h-auto flex-col gap-2 p-4">
            <Plus className="h-5 w-5 text-success" />
            <span className="text-xs font-bold">New Addition</span>
         </Button>
         <Button variant="outline" className="h-auto flex-col gap-2 p-4">
            <ArrowRightLeft className="h-5 w-5 text-primary" />
            <span className="text-xs font-bold">Transfer / Move</span>
         </Button>
         <Button variant="outline" className="h-auto flex-col gap-2 p-4">
            <RefreshCw className="h-5 w-5 text-blue-500" />
            <span className="text-xs font-bold">Revaluation</span>
         </Button>
         <Button variant="outline" className="h-auto flex-col gap-2 p-4">
            <Trash2 className="h-5 w-5 text-destructive" />
            <span className="text-xs font-bold">Disposal</span>
         </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Operation History</CardTitle>
          <CardDescription>Recently executed asset management actions</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Operation</TableHead>
                <TableHead>Asset ID</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOps.map((op) => (
                <TableRow key={op.id}>
                  <TableCell className="text-xs">{op.date}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px] uppercase">{op.op}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-primary">{op.asset}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{op.details}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
