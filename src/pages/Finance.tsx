import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Scale,
  TrendingUp,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  CreditCard,
  CircleDollarSign,
  CalendarDays,
  Send,
} from "lucide-react";

import { ChartOfAccountsService } from "@/components/finance/setup/ChartOfAccountsService";
import { JournalManagementService } from "@/components/finance/transactions/JournalManagementService";
import { LedgerInquiryService } from "@/components/finance/reporting/LedgerInquiryService";
import { FinancialStatements } from "@/components/finance/FinancialStatements";
import { FinanceInvoicesTab } from "@/components/finance/tabs/InvoicesTab";
import { FinanceExpensesTab } from "@/components/finance/tabs/ExpensesTab";
import { FinanceTrialBalanceTab } from "@/components/finance/tabs/TrialBalanceTab";

import { useAccounts, useJournalEntries, useTrialBalance } from "@/hooks/useFinance";
import { useFinancialStats } from "@/hooks/useFinanceExtended";
import { useBusinessDate } from "@/hooks/useSettings";
import { MetricCard } from "@/components/dashboard/MetricCard";

export default function Finance() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const { data: accounts } = useAccounts();
  const { data: journalEntries } = useJournalEntries();
  const { data: trialBalance } = useTrialBalance();
  const { data: businessDate } = useBusinessDate();
  const stats = useFinancialStats();

  const { totalDebits, totalCredits, isBalanced, totalAssets, totalLiabilities, netIncome } = useMemo(() => {
    const debits = trialBalance.reduce((sum, t) => sum + t.totalDebit, 0);
    const credits = trialBalance.reduce((sum, t) => sum + t.totalCredit, 0);

    let assets = 0, liabilities = 0, revenue = 0, expenses = 0;
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
      netIncome: Math.abs(revenue) - expenses,
    };
  }, [trialBalance]);

  const tabTriggerClass = "gap-2 h-11 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 transition-all text-xs sm:text-sm";

  return (
    <MainLayout
      title="Finance & Accounting"
      subtitle={`Business Date: ${businessDate || "Loading..."}`}
      actions={
        <Badge variant="outline" className="gap-1.5 bg-primary/10 text-primary border-primary/20">
          <CalendarDays className="h-3 w-3" />
          {businessDate || "Today"}
        </Badge>
      }
    >
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="border-b overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="justify-start h-12 bg-transparent p-0 flex-nowrap min-w-max gap-1">
              <TabsTrigger value="dashboard" className={tabTriggerClass}>
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </TabsTrigger>
              <TabsTrigger value="accounts" className={tabTriggerClass}>
                <BookOpen className="h-4 w-4" /> Chart of Accounts
              </TabsTrigger>
              <TabsTrigger value="journals" className={tabTriggerClass}>
                <FileText className="h-4 w-4" /> Journal Entries
              </TabsTrigger>
              <TabsTrigger value="ledger" className={tabTriggerClass}>
                <Receipt className="h-4 w-4" /> General Ledger
              </TabsTrigger>
              <TabsTrigger value="trial-balance" className={tabTriggerClass}>
                <Scale className="h-4 w-4" /> Trial Balance
              </TabsTrigger>
              <TabsTrigger value="statements" className={tabTriggerClass}>
                <TrendingUp className="h-4 w-4" /> Financial Statements
              </TabsTrigger>
              <TabsTrigger value="invoices" className={tabTriggerClass}>
                <CreditCard className="h-4 w-4" /> Invoices & Payments
              </TabsTrigger>
              <TabsTrigger value="expenses" className={tabTriggerClass}>
                <CircleDollarSign className="h-4 w-4" /> Expenses
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Dashboard */}
          <TabsContent value="dashboard" className="space-y-6 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard title="Total Assets" value={`$${totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} change="Current period" changeType="neutral" icon={Wallet} delay={0} />
              <MetricCard title="Net Income" value={`$${netIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} change={netIncome >= 0 ? "Profit" : "Loss"} changeType={netIncome >= 0 ? "positive" : "negative"} icon={netIncome >= 0 ? ArrowUpRight : ArrowDownRight} delay={50} />
              <MetricCard title="Outstanding Receivables" value={`$${stats.outstandingReceivables.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} change={`${stats.invoiceCount} invoices`} changeType="neutral" icon={CreditCard} delay={100} />
              <MetricCard title="Trial Balance" value={isBalanced ? "Balanced" : "Unbalanced"} change={isBalanced ? "All entries balanced" : `Diff: $${Math.abs(totalDebits - totalCredits).toFixed(2)}`} changeType={isBalanced ? "positive" : "negative"} icon={Scale} delay={150} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard title="Total Accounts" value={accounts.length.toString()} change={`${accounts.filter(a => a.is_active).length} active`} changeType="neutral" icon={BookOpen} delay={200} />
              <MetricCard title="Journal Entries" value={journalEntries.length.toString()} change={`${journalEntries.filter(e => e.is_posted).length} posted`} changeType="neutral" icon={FileText} delay={250} />
              <MetricCard title="Total Revenue" value={`$${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} change="This period" changeType="positive" icon={TrendingUp} delay={300} />
              <MetricCard title="Total Expenses" value={`$${stats.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} change={`${stats.expenseCount} records`} changeType="neutral" icon={CircleDollarSign} delay={350} />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => setActiveTab("journals")}>
                <Send className="h-5 w-5 text-primary" />
                <span className="text-xs">New Journal Entry</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => setActiveTab("invoices")}>
                <CreditCard className="h-5 w-5 text-primary" />
                <span className="text-xs">Create Invoice</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => setActiveTab("expenses")}>
                <CircleDollarSign className="h-5 w-5 text-primary" />
                <span className="text-xs">Record Expense</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => setActiveTab("statements")}>
                <TrendingUp className="h-5 w-5 text-primary" />
                <span className="text-xs">View Reports</span>
              </Button>
            </div>
          </TabsContent>

          {/* Chart of Accounts */}
          <TabsContent value="accounts" className="mt-4">
            <ChartOfAccountsService />
          </TabsContent>

          {/* Journal Entries */}
          <TabsContent value="journals" className="mt-4">
            <JournalManagementService />
          </TabsContent>

          {/* General Ledger */}
          <TabsContent value="ledger" className="mt-4">
            <LedgerInquiryService />
          </TabsContent>

          {/* Trial Balance */}
          <TabsContent value="trial-balance" className="mt-4">
            <FinanceTrialBalanceTab />
          </TabsContent>

          {/* Financial Statements */}
          <TabsContent value="statements" className="mt-4">
            <FinancialStatements />
          </TabsContent>

          {/* Invoices & Payments */}
          <TabsContent value="invoices" className="mt-4">
            <FinanceInvoicesTab />
          </TabsContent>

          {/* Expenses */}
          <TabsContent value="expenses" className="mt-4">
            <FinanceExpensesTab />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
