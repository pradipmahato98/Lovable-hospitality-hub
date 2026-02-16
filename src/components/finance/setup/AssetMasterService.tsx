import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  HardDrive,
  Plus,
  Settings2,
  Boxes,
  FileSpreadsheet
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function AssetMasterService({ isReadOnly }: { isReadOnly?: boolean }) {
  const categories = [
    { id: '1', name: 'Land & Buildings', method: 'Straight Line', life: '50 Years', count: 2 },
    { id: '2', name: 'Furniture & Fixtures', method: 'Reducing Balance', life: '10 Years', count: 450 },
    { id: '3', name: 'IT Equipment', method: 'Straight Line', life: '3 Years', count: 120 },
    { id: '4', name: 'Vehicles', method: 'Straight Line', life: '5 Years', count: 5 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display flex items-center gap-2">
            <Boxes className="h-5 w-5 text-primary" /> Fixed Asset Master
          </h2>
          <p className="text-muted-foreground text-sm">Define asset categories, depreciation methods, and numbering rules.</p>
        </div>
        {!isReadOnly && (
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> New Category
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Asset Categories</CardTitle>
            <CardDescription>Logical grouping for depreciation and reporting</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category Name</TableHead>
                  <TableHead>Depr. Method</TableHead>
                  <TableHead>Useful Life</TableHead>
                  <TableHead className="text-center">Asset Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium text-sm">{c.name}</TableCell>
                    <TableCell className="text-xs">{c.method}</TableCell>
                    <TableCell className="text-xs">{c.life}</TableCell>
                    <TableCell className="text-center text-xs">{c.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-primary" /> Asset Numbering
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="p-3 border rounded-lg bg-secondary/20">
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Current Prefix</p>
                <p className="text-lg font-mono font-bold">ASST-</p>
             </div>
             <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Auto-increment starting from:</p>
                <p className="text-sm font-semibold">0001</p>
             </div>
             <Button variant="outline" size="sm" className="w-full text-xs" disabled={isReadOnly}>
               Modify Numbering Schema
             </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
