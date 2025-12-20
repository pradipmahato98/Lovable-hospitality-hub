import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Filter, Download, CreditCard, Receipt, DollarSign, TrendingUp } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MetricCard } from "@/components/dashboard/MetricCard";

const invoices = [
  {
    id: "INV-001",
    guest: "Sarah Johnson",
    reservation: "RES-001",
    date: "2024-12-20",
    amount: "$1,560",
    status: "paid",
    method: "Credit Card",
  },
  {
    id: "INV-002",
    guest: "Michael Chen",
    reservation: "RES-002",
    date: "2024-12-19",
    amount: "$480",
    status: "pending",
    method: "-",
  },
  {
    id: "INV-003",
    guest: "Emma Wilson",
    reservation: "RES-003",
    date: "2024-12-18",
    amount: "$360",
    status: "paid",
    method: "Cash",
  },
  {
    id: "INV-004",
    guest: "James Brown",
    reservation: "RES-004",
    date: "2024-12-17",
    amount: "$2,400",
    status: "partial",
    method: "Credit Card",
  },
  {
    id: "INV-005",
    guest: "Lisa Anderson",
    reservation: "RES-005",
    date: "2024-12-16",
    amount: "$520",
    status: "paid",
    method: "Bank Transfer",
  },
];

const statusColors = {
  paid: "bg-success/20 text-success border-success/30",
  pending: "bg-warning/20 text-warning border-warning/30",
  partial: "bg-primary/20 text-primary border-primary/30",
  overdue: "bg-destructive/20 text-destructive border-destructive/30",
};

const Billing = () => {
  return (
    <MainLayout title="Billing" subtitle="Manage invoices, payments and financial reports">
      {/* Billing Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Revenue (MTD)"
          value="$124,580"
          change="+12.5% vs last month"
          changeType="positive"
          icon={DollarSign}
          delay={0}
        />
        <MetricCard
          title="Pending Payments"
          value="$8,240"
          change="12 invoices"
          changeType="neutral"
          icon={Receipt}
          delay={50}
        />
        <MetricCard
          title="Avg. Daily Revenue"
          value="$6,229"
          change="+8.2% vs avg"
          changeType="positive"
          icon={TrendingUp}
          delay={100}
        />
        <MetricCard
          title="Payment Success Rate"
          value="94.5%"
          change="+2.1% this week"
          changeType="positive"
          icon={CreditCard}
          delay={150}
        />
      </div>

      {/* Invoices Table */}
      <Card variant="elevated" className="animate-fade-in">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Invoices</CardTitle>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search invoices..." className="w-64 pl-9 bg-secondary" />
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Invoice ID</TableHead>
                <TableHead>Guest</TableHead>
                <TableHead>Reservation</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment Method</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id} className="border-border hover:bg-secondary/50">
                  <TableCell className="font-mono text-sm text-primary">
                    {invoice.id}
                  </TableCell>
                  <TableCell className="font-medium">{invoice.guest}</TableCell>
                  <TableCell className="text-muted-foreground">{invoice.reservation}</TableCell>
                  <TableCell>{invoice.date}</TableCell>
                  <TableCell className="font-semibold">{invoice.amount}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={statusColors[invoice.status as keyof typeof statusColors]}
                    >
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{invoice.method}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </MainLayout>
  );
};

export default Billing;
