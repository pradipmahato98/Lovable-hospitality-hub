import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Truck,
  Search,
  Plus,
  Wallet,
  Tag,
  Clock,
  ExternalLink,
  ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";

interface VendorMasterServiceProps {
  isReadOnly?: boolean;
}

export function VendorMasterService({ isReadOnly }: VendorMasterServiceProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const vendors = [
    { id: '1', name: 'Fresh Foods Co', category: 'F&B', terms: 'Net 15', openInvoices: 4, totalBalance: 5400, rating: 'A' },
    { id: '2', name: 'CleanPro Services', category: 'Operations', terms: 'Net 30', openInvoices: 1, totalBalance: 1200, rating: 'A' },
    { id: '3', name: 'Global Energy', category: 'Utilities', terms: 'Due on Receipt', openInvoices: 1, totalBalance: 890, rating: 'B' },
    { id: '4', name: 'Linen World', category: 'Housekeeping', terms: 'Net 45', openInvoices: 0, totalBalance: 0, rating: 'A' },
    { id: '5', name: 'Tech Support Inc', category: 'IT/Admin', terms: 'Net 30', openInvoices: 2, totalBalance: 450, rating: 'C' },
  ];

  const filteredVendors = vendors.filter(v =>
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" /> Vendor Master
          </h2>
          <p className="text-muted-foreground text-sm">Register and govern vendor relationships, tax definitions, and payment terms.</p>
        </div>
        {!isReadOnly && (
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Add Vendor
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-primary/5 border-primary/10">
          <CardContent className="pt-4">
            <p className="text-[10px] uppercase font-bold text-muted-foreground">Active Vendors</p>
            <h3 className="text-xl font-bold">84</h3>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/10">
          <CardContent className="pt-4">
            <p className="text-[10px] uppercase font-bold text-muted-foreground">Total Payables</p>
            <h3 className="text-xl font-bold">$124,500.00</h3>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/10">
          <CardContent className="pt-4">
            <p className="text-[10px] uppercase font-bold text-muted-foreground">Pending Contracts</p>
            <h3 className="text-xl font-bold">3</h3>
          </CardContent>
        </Card>
        <Card className="bg-success/5 border-success/10">
          <CardContent className="pt-4">
            <p className="text-[10px] uppercase font-bold text-muted-foreground">Compliance Score</p>
            <h3 className="text-xl font-bold text-success">98%</h3>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by vendor name or category..."
          className="pl-9"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Vendor Directory</CardTitle>
          <CardDescription>Comprehensive registry of operational and administrative suppliers</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Payment Terms</TableHead>
                <TableHead className="text-right">Open Invoices</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="text-center">Rating</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVendors.map((vendor) => (
                <TableRow key={vendor.id} className="group">
                  <TableCell>
                    <div className="font-semibold text-sm">{vendor.name}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">ID: VND-{vendor.id}00{vendor.id}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px] font-normal">
                      <Tag className="h-2.5 w-2.5 mr-1" /> {vendor.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      {vendor.terms}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {vendor.openInvoices}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs font-bold">
                    ${vendor.totalBalance.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={cn(
                      "h-6 w-6 rounded-full p-0 flex items-center justify-center font-bold text-xs",
                      vendor.rating === 'A' ? "bg-success text-success-foreground" :
                      vendor.rating === 'B' ? "bg-primary text-primary-foreground" :
                      "bg-destructive text-destructive-foreground"
                    )}>
                      {vendor.rating}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
           <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                 <Wallet className="h-4 w-4 text-primary" /> Tax Compliance (WHT)
              </CardTitle>
           </CardHeader>
           <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">Standard Withholding Tax rules applied to vendor payments:</p>
              <div className="grid grid-cols-2 gap-2">
                 <div className="p-2 border rounded bg-secondary/10">
                    <p className="text-[10px] text-muted-foreground">Services</p>
                    <p className="text-sm font-bold">15.0%</p>
                 </div>
                 <div className="p-2 border rounded bg-secondary/10">
                    <p className="text-[10px] text-muted-foreground">Goods</p>
                    <p className="text-sm font-bold">1.5%</p>
                 </div>
              </div>
           </CardContent>
        </Card>

        <Card className="bg-success/5 border-success/10">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
               <ShieldCheck className="h-4 w-4 text-success" /> Supplier Governance
            </CardTitle>
          </CardHeader>
          <CardContent>
             <p className="text-xs text-muted-foreground leading-relaxed">
                All vendors must undergo a quarterly compliance audit. System will automatically suspend payments to vendors with expired trade licenses or invalid tax certificates.
             </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
