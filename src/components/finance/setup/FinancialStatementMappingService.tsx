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
  Map,
  LayoutTemplate,
  ArrowRightLeft,
  Settings,
  Save
} from "lucide-react";

export function FinancialStatementMappingService({ isReadOnly }: { isReadOnly?: boolean }) {
  const mappings = [
    { id: "M01", statement: "Balance Sheet", section: "Current Assets", accountRange: "1000 - 1500", weight: "100%" },
    { id: "M02", statement: "P&L", section: "Revenue", accountRange: "4000 - 4999", weight: "100%" },
    { id: "M03", statement: "P&L", section: "Cost of Sales", accountRange: "5000 - 5500", weight: "-100%" },
    { id: "M04", statement: "Cash Flow", section: "Operating Activities", accountRange: "Selected accounts", weight: "Variable" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-display flex items-center gap-2">
            <Map className="h-5 w-5 text-primary" /> Financial Statement Mapping
          </h2>
          <p className="text-muted-foreground text-sm">Map GL accounts to statement lines and define layout hierarchies.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" disabled={isReadOnly}>
            <LayoutTemplate className="h-4 w-4" /> Designer
          </Button>
          <Button size="sm" className="gap-2" disabled={isReadOnly}>
            <Save className="h-4 w-4" /> Save Mappings
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Settings className="h-4 w-4 text-primary" /> Mapping Logic
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 border rounded-lg flex items-center justify-between bg-secondary/10 text-xs">
              <span>Auto-map new accounts by segment</span>
              <Badge>Enabled</Badge>
            </div>
            <div className="p-3 border rounded-lg flex items-center justify-between bg-secondary/10 text-xs">
              <span>Validate mapping on every post</span>
              <Badge variant="outline">Manual</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
             <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4 text-primary" /> Quick Actions
             </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
             <Button variant="outline" className="text-xs h-16 flex-col gap-1" disabled={isReadOnly}>
                <span>Import Mapping</span>
                <span className="text-[10px] text-muted-foreground">CSV/JSON</span>
             </Button>
             <Button variant="outline" className="text-xs h-16 flex-col gap-1" disabled={isReadOnly}>
                <span>Sync IFRS</span>
                <span className="text-[10px] text-muted-foreground">Standard Templates</span>
             </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Account-to-Statement Mapping</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Statement</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Account Range</TableHead>
                <TableHead className="text-right">Weight</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mappings.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.statement}</TableCell>
                  <TableCell>{m.section}</TableCell>
                  <TableCell className="font-mono text-xs">{m.accountRange}</TableCell>
                  <TableCell className="text-right font-bold">{m.weight}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
