import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Settings2,
  RefreshCw,
  FileText,
  UserCircle,
  Server,
  TrendingUp,
  Scale,
  BookOpen,
  Wallet,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";

// Primary Services for simplified layout
import { ChartOfAccountsService } from "@/components/finance/setup/ChartOfAccountsService";
import { JournalManagementService } from "@/components/finance/transactions/JournalManagementService";
import { FinancialReportingService } from "@/components/finance/reporting/FinancialReportingService";
import { EventBusService } from "@/components/finance/infrastructure/EventBusService";

import { useAccounts, useJournalEntries, useTrialBalance } from "@/hooks/useFinance";
import { useBusinessDate } from "@/hooks/useSettings";
import { useFinancePermissions } from "@/hooks/useFinancePermissions";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { useMemo } from "react";

export default function Finance() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isJournalEditorOpen, setIsJournalEditorOpen] = useState(false);

  const {
    activeRole,
    checkPermission,
    roleLabel
  } = useFinancePermissions('FA');

  const { data: accounts } = useAccounts();
  const { data: journalEntries } = useJournalEntries();
  const { data: trialBalance } = useTrialBalance();
  const { data: businessDate } = useBusinessDate();

  // Calculate totals and financial metrics for dashboard
  const { totalDebits, totalCredits, isBalanced, totalAssets, totalLiabilities, netIncome } = useMemo(() => {
    const debits = trialBalance.reduce((sum, t) => sum + t.totalDebit, 0);
    const credits = trialBalance.reduce((sum, t) => sum + t.totalCredit, 0);

    let assets = 0;
    let liabilities = 0;
    let revenue = 0;
    let expenses = 0;

    trialBalance.forEach(item => {
      const balance = item.totalDebit - item.totalCredit;
      const type = item.account.type;

      if (type === 'asset') assets += balance;
      else if (type === 'liability') liabilities -= balance;
      else if (type === 'revenue') revenue -= balance;
      else if (type === 'expense') expenses += balance;
    });

    return {
      totalDebits: debits,
      totalCredits: credits,
      isBalanced: Math.abs(debits - credits) < 0.01,
      totalAssets: assets,
      totalLiabilities: Math.abs(liabilities),
      netIncome: Math.abs(revenue) - expenses
    };
  }, [trialBalance]);

  const coaPermission = checkPermission("1.1 Chart of Accounts Service");
  const journalPermission = checkPermission("2.1 Journal Management Service");
  const reportingPermission = checkPermission("3.1 Financial Reporting Service");
  const infrastructurePermission = checkPermission("4.1 Event Bus");

  return (
    <MainLayout
      title="Finance & Accounting"
      subtitle={`Business Date: ${businessDate || "Loading..."}`}
      actions={
        <div className="flex items-center gap-3 bg-muted/50 px-3 py-1.5 rounded-full border border-border/50">
          <UserCircle className="h-4 w-4 text-primary" />
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-muted-foreground leading-none">Access Level</span>
            <span className="text-xs font-semibold">{roleLabel} ({activeRole})</span>
          </div>
          <Badge variant="outline" className="ml-2 bg-primary/10 text-primary border-primary/20 text-[10px] px-1.5 h-4">
            LIVE
          </Badge>
        </div>
      }
    >
      <div className="space-y-6">
        {!isJournalEditorOpen && (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v)}>
          <div className="border-b overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="justify-start h-12 bg-transparent p-0 flex-nowrap min-w-max gap-6">
              <TabsTrigger
                value="dashboard"
                className="gap-2 h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 transition-all"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger
                value="setup"
                className="gap-2 h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 transition-all"
              >
                <Settings2 className="h-4 w-4" />
                Setup
              </TabsTrigger>
              <TabsTrigger
                value="journal-entries"
                className="gap-2 h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 transition-all"
              >
                <RefreshCw className="h-4 w-4" />
                Journal Entries
              </TabsTrigger>
              <TabsTrigger
                value="reports"
                className="gap-2 h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 transition-all"
              >
                <FileText className="h-4 w-4" />
                Reporting
              </TabsTrigger>
              <TabsTrigger
                value="infrastructure"
                className="gap-2 h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 transition-all"
              >
                <Server className="h-4 w-4" />
                Infrastructure
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="dashboard" className="space-y-6 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Total Assets"
                value={`$${totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                change="Current period balance"
                changeType="neutral"
                icon={Wallet}
                delay={0}
              />
              <MetricCard
                title="Net Income"
                value={`$${netIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                change={netIncome >= 0 ? "Profit" : "Loss"}
                changeType={netIncome >= 0 ? "positive" : "negative"}
                icon={netIncome >= 0 ? ArrowUpRight : ArrowDownRight}
                delay={50}
              />
              <MetricCard
                title="Total Debits"
                value={`$${totalDebits.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                change="Posted entries"
                changeType="neutral"
                icon={TrendingUp}
                delay={100}
              />
              <MetricCard
                title="Trial Balance"
                value={isBalanced ? "Balanced" : "Unbalanced"}
                change={
                  isBalanced
                    ? "All entries balanced"
                    : `Diff: $${Math.abs(totalDebits - totalCredits).toFixed(2)}`
                }
                changeType={isBalanced ? "positive" : "negative"}
                icon={Scale}
                delay={150}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Total Accounts"
                value={accounts.length.toString()}
                change={`${accounts.filter((a) => a.is_active).length} active`}
                changeType="neutral"
                icon={BookOpen}
                delay={200}
              />
              <MetricCard
                title="Journal Entries"
                value={journalEntries.length.toString()}
                change={`${journalEntries.filter((e) => e.is_posted).length} posted`}
                changeType="neutral"
                icon={FileText}
                delay={250}
              />
              <MetricCard
                title="Total Liabilities"
                value={`$${totalLiabilities.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                change="Outstanding obligations"
                changeType="neutral"
                icon={Scale}
                delay={300}
              />
              <MetricCard
                title="Operational Status"
                value="Active"
                change="All modules functional"
                changeType="positive"
                icon={RefreshCw}
                delay={350}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => setActiveTab("setup")}>
                    <Settings2 className="h-5 w-5" />
                    Setup
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => setActiveTab("journal-entries")}>
                    <RefreshCw className="h-5 w-5" />
                    Journal Entries
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => setActiveTab("reports")}>
                    <FileText className="h-5 w-5" />
                    Reporting
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => setActiveTab("infrastructure")}>
                    <Server className="h-5 w-5" />
                    Infrastructure
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="setup" className="mt-4">
            <ChartOfAccountsService isReadOnly={coaPermission === 'view'} />
          </TabsContent>

          <TabsContent value="journal-entries" className="mt-4">
            <JournalManagementService
              isReadOnly={journalPermission === 'view'}
              onEditorToggle={setIsJournalEditorOpen}
            />
          </TabsContent>

          <TabsContent value="reports" className="mt-4">
            <FinancialReportingService isReadOnly={reportingPermission === 'view'} />
          </TabsContent>

          <TabsContent value="infrastructure" className="mt-4">
            <EventBusService isReadOnly={infrastructurePermission === 'view'} />
          </TabsContent>
        </Tabs>
        )}
        {isJournalEditorOpen && (
          <JournalManagementService
            isReadOnly={journalPermission === 'view'}
            onEditorToggle={setIsJournalEditorOpen}
          />
        )}
      </div>
    </MainLayout>
  );
}
