import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { 
  Search, 
  Filter, 
  Download, 
  CreditCard, 
  Receipt, 
  DollarSign, 
  TrendingUp,
  CalendarPlus,
  Users,
  FileText,
  ShoppingCart
} from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ModuleQuickActions, QuickAction } from "@/components/shared";
import { useInvoices, useFinancialStats } from "@/hooks/useFinanceExtended";
import { InvoiceTable } from "@/components/billing/InvoiceTable";
import { generateInvoicePdf } from "@/lib/invoicePdf";

const Billing = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: invoices = [], isLoading } = useInvoices();
  const stats = useFinancialStats();

  const filteredInvoices = invoices.filter(inv =>
    inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (inv.guest && `${inv.guest.first_name} ${inv.guest.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  const quickActions: QuickAction[] = [
    { icon: CalendarPlus, label: "New Booking", to: "/reservations", color: "text-primary" },
    { icon: ShoppingCart, label: "POS Sale", to: "/pos", color: "text-amber-400" },
    { icon: Users, label: "Guest Accounts", to: "/guests", color: "text-purple-400" },
    { icon: FileText, label: "Financial Reports", to: "/reports", color: "text-blue-400" },
  ];

  return (
    <MainLayout title="Billing" subtitle="Manage invoices, payments and financial reports">
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="xl:col-span-3 space-y-6">
          {/* Billing Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <MetricCard
          title="Total Revenue (MTD)"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          change="+12.5% vs last month"
          changeType="positive"
          icon={DollarSign}
          delay={0}
        />
        <MetricCard
          title="Pending Payments"
          value={`$${stats.outstandingReceivables.toLocaleString()}`}
          change={`${stats.invoiceCount} invoices`}
          changeType="neutral"
          icon={Receipt}
          delay={50}
        />
        <MetricCard
          title="Net Income"
          value={`$${stats.netIncome.toLocaleString()}`}
          change="+8.2% vs avg"
          changeType="positive"
          icon={TrendingUp}
          delay={100}
        />
        <MetricCard
          title="Total Collected"
          value={`$${stats.totalCollected.toLocaleString()}`}
          change="+2.1% this week"
          changeType="positive"
          icon={CreditCard}
          delay={150}
        />
          </div>

          {/* Invoices Table */}
          <Card variant="elevated" className="animate-fade-in overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle>Recent Invoices</CardTitle>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search invoices..."
                className="w-full sm:w-48 lg:w-64 pl-9 bg-secondary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filter</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <InvoiceTable
            invoices={filteredInvoices}
            isLoading={isLoading}
            onExport={generateInvoicePdf}
          />
        </CardContent>
      </Card>
        </div>

        {/* Quick Actions Sidebar */}
        <div className="space-y-6">
          <ModuleQuickActions actions={quickActions} variant="list" />
        </div>
      </div>
    </MainLayout>
  );
};

export default Billing;
