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
  Users,
  Search,
  Plus,
  CreditCard,
  Building2,
  Mail,
  Phone,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomerMasterServiceProps {
  isReadOnly?: boolean;
}

export function CustomerMasterService({ isReadOnly }: CustomerMasterServiceProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Mock data for customers/corporate clients
  const customers = [
    { id: '1', name: 'Global Tech Corp', type: 'Corporate', email: 'billing@globaltech.com', creditLimit: 50000, balance: 12500, status: 'Active' },
    { id: '2', name: 'James Wilson', type: 'Individual', email: 'james.w@email.com', creditLimit: 2000, balance: 450, status: 'Active' },
    { id: '3', name: 'Starlight Travel', type: 'Agency', email: 'ops@starlight.io', creditLimit: 15000, balance: 8900, status: 'Over Limit' },
    { id: '4', name: 'Sarah Parker', type: 'Individual', email: 'sarah.p@email.com', creditLimit: 1000, balance: 0, status: 'Active' },
    { id: '5', name: 'Innovate Solutions', type: 'Corporate', email: 'finance@innovate.com', creditLimit: 25000, balance: 22000, status: 'Review Required' },
  ];

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Customer & Corporate Master
          </h2>
          <p className="text-muted-foreground text-sm">Manage credit limits, billing templates, and client profiles.</p>
        </div>
        {!isReadOnly && (
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> New Customer
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-primary/5 border-primary/10">
          <CardContent className="pt-4">
            <p className="text-[10px] uppercase font-bold text-muted-foreground">Total Receivables</p>
            <h3 className="text-xl font-bold">$43,850.00</h3>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/10">
          <CardContent className="pt-4">
            <p className="text-[10px] uppercase font-bold text-muted-foreground">Active Credit Lines</p>
            <h3 className="text-xl font-bold">128</h3>
          </CardContent>
        </Card>
        <Card className="bg-amber-500/5 border-amber-500/10">
          <CardContent className="pt-4">
            <p className="text-[10px] uppercase font-bold text-muted-foreground">Over Limit Alerts</p>
            <h3 className="text-xl font-bold text-amber-500">12</h3>
          </CardContent>
        </Card>
        <Card className="bg-success/5 border-success/10">
          <CardContent className="pt-4">
            <p className="text-[10px] uppercase font-bold text-muted-foreground">Collection Rate</p>
            <h3 className="text-xl font-bold text-success">94.2%</h3>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search customers by name, email or company..."
          className="pl-9"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Master Directory</CardTitle>
          <CardDescription>Centralized repository of all billable entities</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer Entity</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Credit Limit</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id} className="group">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm">{customer.name}</span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Mail className="h-2.5 w-2.5" /> {customer.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] font-normal">
                      {customer.type === 'Corporate' ? <Building2 className="h-2.5 w-2.5 mr-1" /> : <Users className="h-2.5 w-2.5 mr-1" />}
                      {customer.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    ${customer.creditLimit.toLocaleString()}
                  </TableCell>
                  <TableCell className={cn(
                    "text-right font-mono text-xs font-bold",
                    customer.balance > customer.creditLimit * 0.9 ? "text-destructive" : ""
                  )}>
                    ${customer.balance.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn(
                      "text-[10px]",
                      customer.status === 'Active' ? "bg-success/10 text-success border-success/20" :
                      customer.status === 'Over Limit' ? "bg-destructive/10 text-destructive border-destructive/20" :
                      "bg-amber-500/10 text-amber-500 border-amber-500/20"
                    )}>
                      {customer.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">Manage</Button>
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
                <CreditCard className="h-4 w-4 text-primary" /> Global Billing Templates
             </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
             {['Standard Folio', 'Corporate Monthly', 'Agency Commissionable'].map(template => (
               <div key={template} className="flex items-center justify-between p-2 rounded border bg-secondary/20 text-xs">
                 <span>{template}</span>
                 <Badge variant="secondary">Active</Badge>
               </div>
             ))}
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/10">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
               <ShieldCheck className="h-4 w-4 text-primary" /> Credit Policy Enforcement
            </CardTitle>
          </CardHeader>
          <CardContent>
             <p className="text-xs text-muted-foreground leading-relaxed">
                System is currently enforcing a "Hard Stop" for entities exceeding 110% of their credit limit.
                New bookings and POS postings will be blocked until a partial settlement is recorded.
             </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
