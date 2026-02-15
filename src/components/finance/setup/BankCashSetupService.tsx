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
  Building2,
  Plus,
  Landmark,
  Wallet,
  ShieldCheck
} from "lucide-react";

export function BankCashSetupService({ isReadOnly }: { isReadOnly?: boolean }) {
  const accounts = [
    { id: "B01", name: "Main Operating Account", institution: "Chase Bank", type: "Checking", currency: "USD", status: "Active" },
    { id: "B02", name: "Payroll Account", institution: "Wells Fargo", type: "Checking", currency: "USD", status: "Active" },
    { id: "C01", name: "Front Desk Petty Cash", institution: "In-House", type: "Cash", currency: "USD", status: "Active" },
    { id: "C02", name: "Restaurant Petty Cash", institution: "In-House", type: "Cash", currency: "USD", status: "Active" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-display flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" /> Bank & Cash Setup
          </h2>
          <p className="text-muted-foreground text-sm">Manage bank accounts, cash registers, and signatory rules.</p>
        </div>
        <Button size="sm" className="gap-2" disabled={isReadOnly}>
          <Plus className="h-4 w-4" /> Add Account
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
             <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                <Landmark className="h-5 w-5" />
             </div>
             <div>
                <p className="text-xs text-muted-foreground uppercase">Bank Accounts</p>
                <p className="text-lg font-bold">2 Active</p>
             </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
             <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                <Wallet className="h-5 w-5" />
             </div>
             <div>
                <p className="text-xs text-muted-foreground uppercase">Cash Registers</p>
                <p className="text-lg font-bold">5 Registered</p>
             </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
             <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                <ShieldCheck className="h-5 w-5" />
             </div>
             <div>
                <p className="text-xs text-muted-foreground uppercase">Mandates</p>
                <p className="text-lg font-bold">8 Enforced</p>
             </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Account Registry</CardTitle>
          <CardDescription>Consolidated view of all financial holdings.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Account Name</TableHead>
                <TableHead>Institution</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((acc) => (
                <TableRow key={acc.id}>
                  <TableCell className="font-mono text-xs">{acc.id}</TableCell>
                  <TableCell className="font-medium">{acc.name}</TableCell>
                  <TableCell>{acc.institution}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px]">{acc.type}</Badge>
                  </TableCell>
                  <TableCell>{acc.currency}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className="text-success border-success/20">
                      {acc.status}
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
