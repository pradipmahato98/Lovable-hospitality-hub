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
  Receipt,
  Plus,
  Globe,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";

export function TaxConfigurationService({ isReadOnly }: { isReadOnly?: boolean }) {
  const taxCodes = [
    { id: "T01", name: "Standard VAT", rate: "13%", type: "Sales", region: "National", status: "Active" },
    { id: "T02", name: "Tourism Levy", rate: "2%", type: "Sales", region: "National", status: "Active" },
    { id: "T03", name: "Service Charge", rate: "10%", type: "Internal", region: "National", status: "Active" },
    { id: "T04", name: "Exempt", rate: "0%", type: "Exempt", region: "International", status: "Active" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-display flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" /> Tax Configuration
          </h2>
          <p className="text-muted-foreground text-sm">Define tax slabs, regional rules, and electronic filing mappings.</p>
        </div>
        <Button size="sm" className="gap-2" disabled={isReadOnly}>
          <Plus className="h-4 w-4" /> Add Tax Code
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-success/5 border-success/20">
          <CardContent className="p-4 flex items-center gap-3">
             <CheckCircle2 className="h-8 w-8 text-success opacity-50" />
             <div>
                <p className="text-xs font-medium text-success uppercase tracking-wider">Compliance Status</p>
                <p className="text-xl font-bold">Compliant</p>
             </div>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex items-center gap-3">
             <Globe className="h-8 w-8 text-primary opacity-50" />
             <div>
                <p className="text-xs font-medium text-primary uppercase tracking-wider">Active Regions</p>
                <p className="text-xl font-bold">2 Regions</p>
             </div>
          </CardContent>
        </Card>
        <Card className="bg-warning/5 border-warning/20">
          <CardContent className="p-4 flex items-center gap-3">
             <AlertTriangle className="h-8 w-8 text-warning opacity-50" />
             <div>
                <p className="text-xs font-medium text-warning uppercase tracking-wider">Upcoming Updates</p>
                <p className="text-xl font-bold">None Pending</p>
             </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tax Master Registry</CardTitle>
          <CardDescription>Managed tax codes and rates for financial calculations.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Region</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {taxCodes.map((tax) => (
                <TableRow key={tax.id}>
                  <TableCell className="font-mono font-medium">{tax.id}</TableCell>
                  <TableCell>{tax.name}</TableCell>
                  <TableCell className="font-bold">{tax.rate}</TableCell>
                  <TableCell>{tax.type}</TableCell>
                  <TableCell>{tax.region}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                      {tax.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
