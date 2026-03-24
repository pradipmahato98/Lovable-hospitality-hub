import { useState, useMemo, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";
import { useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatISOasBS } from "@/lib/nepaliDate";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Settings2,
  RefreshCw,
  FileText,
  BookOpen,
  Scale,
  TrendingUp,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  CircleDollarSign,
  CalendarDays,
  Send,
} from "lucide-react";

// Setup components
import { ChartOfAccountsService } from "@/components/finance/setup/ChartOfAccountsService";
import { FinancialConfigurationService } from "@/components/finance/setup/FinancialConfigurationService";
import { CustomerMasterService } from "@/components/finance/setup/CustomerMasterService";
import { VendorMasterService } from "@/components/finance/setup/VendorMasterService";
import { BankCashSetupService } from "@/components/finance/setup/BankCashSetupService";
import { AssetMasterService } from "@/components/finance/setup/AssetMasterService";
import { TaxConfigurationService } from "@/components/finance/setup/TaxConfigurationService";
import { BudgetSetupService } from "@/components/finance/setup/BudgetSetupService";
import { AccessControlService } from "@/components/finance/setup/AccessControlService";
import { FinancialStatementMappingService } from "@/components/finance/setup/FinancialStatementMappingService";

// Transaction components
import { JournalManagementService } from "@/components/finance/transactions/JournalManagementService";
import { ARTransactionService } from "@/components/finance/transactions/ARTransactionService";
import { APTransactionService } from "@/components/finance/transactions/APTransactionService";
import { BankCashTransactionService } from "@/components/finance/transactions/BankCashTransactionService";
import { AssetOperationsService } from "@/components/finance/transactions/AssetOperationsService";
import { TaxCalculationService } from "@/components/finance/transactions/TaxCalculationService";
import { BudgetExecutionService } from "@/components/finance/transactions/BudgetExecutionService";
import { FinancialPeriodCloseService } from "@/components/finance/transactions/FinancialPeriodCloseService";
import { ApprovalWorkflowService } from "@/components/finance/transactions/ApprovalWorkflowService";
import { IntegrationOrchestratorService } from "@/components/finance/transactions/IntegrationOrchestratorService";
import { LedgerTransactionService } from "@/components/finance/transactions/LedgerTransactionService";
import { DayBookService } from "@/components/finance/transactions/DayBookService";
import { CashBankReconcileService } from "@/components/finance/transactions/CashBankReconcileService";
import { FinanceInvoicesTab } from "@/components/finance/tabs/InvoicesTab";
import { FinanceExpensesTab } from "@/components/finance/tabs/ExpensesTab";

// Report components
import { FinancialReportingService } from "@/components/finance/reporting/FinancialReportingService";
import { LedgerInquiryService } from "@/components/finance/reporting/LedgerInquiryService";
import { ARReportingService } from "@/components/finance/reporting/ARReportingService";
import { APReportingService } from "@/components/finance/reporting/APReportingService";
import { CashBankReportingService } from "@/components/finance/reporting/CashBankReportingService";
import { FixedAssetsReportingService } from "@/components/finance/reporting/FixedAssetsReportingService";
import { TaxReportingService } from "@/components/finance/reporting/TaxReportingService";
import { BudgetForecastReportingService } from "@/components/finance/reporting/BudgetForecastReportingService";
import { AuditReportingService } from "@/components/finance/reporting/AuditReportingService";
import { ConsolidationBIService } from "@/components/finance/reporting/ConsolidationBIService";
import { FinanceTrialBalanceTab } from "@/components/finance/tabs/TrialBalanceTab";


import { useAccounts, useJournalEntries, useTrialBalance } from "@/hooks/useFinance";
import { useFinancialStats } from "@/hooks/useFinanceExtended";
import { useBusinessDate } from "@/hooks/useSettings";
import { MetricCard } from "@/components/dashboard/MetricCard";

// Sub-tab definition type
interface SubTabDef {
  id: string;
  label: string;
  component: React.ComponentType<{ isReadOnly?: boolean }>;
}

const setupSubTabs: SubTabDef[] = [
  { id: "coa", label: "Chart of Accounts", component: ChartOfAccountsService },
  { id: "fin-config", label: "Financial Config", component: FinancialConfigurationService },
  { id: "customer", label: "Customer Master", component: CustomerMasterService },
  { id: "vendor", label: "Vendor Master", component: VendorMasterService },
  { id: "bank-cash", label: "Bank & Cash", component: BankCashSetupService },
  { id: "assets", label: "Asset Master", component: AssetMasterService },
  { id: "tax", label: "Tax Config", component: TaxConfigurationService },
  { id: "budget", label: "Budget Setup", component: BudgetSetupService },
  { id: "access", label: "Access Control", component: AccessControlService },
  { id: "mapping", label: "Statement Mapping", component: FinancialStatementMappingService },
];

const transactionSubTabs: SubTabDef[] = [
  { id: "journals", label: "Journal Entries", component: JournalManagementService },
  { id: "ledger-tx", label: "Ledger", component: LedgerTransactionService },
  { id: "day-book", label: "Day Book", component: DayBookService },
  { id: "cash-bank-reconcile", label: "Cash & Bank Reconcile", component: CashBankReconcileService },
  { id: "invoices", label: "Invoices & Payments", component: FinanceInvoicesTab as any },
  { id: "expenses", label: "Expenses", component: FinanceExpensesTab as any },
  { id: "ar", label: "Accounts Receivable", component: ARTransactionService },
  { id: "ap", label: "Accounts Payable", component: APTransactionService },
  { id: "bank-cash-tx", label: "Bank & Cash", component: BankCashTransactionService },
  { id: "asset-ops", label: "Asset Operations", component: AssetOperationsService },
  { id: "tax-calc", label: "Tax Calculation", component: TaxCalculationService },
  { id: "budget-exec", label: "Budget Execution", component: BudgetExecutionService },
  { id: "period-close", label: "Period Close", component: FinancialPeriodCloseService },
  { id: "approvals", label: "Approvals", component: ApprovalWorkflowService },
  { id: "integration", label: "Integrations", component: IntegrationOrchestratorService },
];

const reportSubTabs: SubTabDef[] = [
  { id: "trial-balance", label: "Trial Balance", component: FinanceTrialBalanceTab as any },
  { id: "ledger", label: "General Ledger", component: LedgerInquiryService },
  { id: "statements", label: "Financial Statements", component: FinancialReportingService },
  { id: "ar-report", label: "AR Reports", component: ARReportingService },
  { id: "ap-report", label: "AP Reports", component: APReportingService },
  { id: "cash-bank", label: "Cash & Bank", component: CashBankReportingService },
  { id: "fixed-assets", label: "Fixed Assets", component: FixedAssetsReportingService },
  { id: "tax-report", label: "Tax Reports", component: TaxReportingService },
  { id: "budget-forecast", label: "Budget & Forecast", component: BudgetForecastReportingService },
  { id: "audit", label: "Audit Reports", component: AuditReportingService },
  { id: "consolidation", label: "Consolidation & BI", component: ConsolidationBIService },
];


function SubTabPanel({ tabs, defaultTab }: { tabs: SubTabDef[]; defaultTab?: string }) {
  const [activeSubTab, setActiveSubTab] = useState(defaultTab || tabs[0]?.id || "");
  const ActiveComponent = tabs.find((t) => t.id === activeSubTab)?.component;

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full overflow-hidden">
      {/* Mobile: horizontal scroll tabs */}
      <div className="lg:hidden overflow-x-auto scrollbar-hide -mx-4 px-4 flex-shrink-0">
        <div className="flex gap-1.5 min-w-max pb-2">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeSubTab === tab.id ? "default" : "outline"}
              size="sm"
              className="text-xs h-8 whitespace-nowrap"
              onClick={() => setActiveSubTab(tab.id)}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>
      {/* Desktop: vertical scrollable sidebar tabs */}
      <div className="hidden lg:block w-48 xl:w-56 shrink-0 h-full overflow-y-auto scrollbar-hide border-r border-border/60 pr-2">
        <div className="space-y-0.5">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeSubTab === tab.id ? "default" : "ghost"}
              size="sm"
              className={cn(
                "w-full justify-start text-xs h-9 transition-colors",
                activeSubTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
              onClick={() => setActiveSubTab(tab.id)}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>
      {/* Content area */}
      <div className="flex-1 min-w-0 overflow-y-auto pr-2 scrollbar-hide">
        {ActiveComponent && <ActiveComponent />}
      </div>
    </div>
  );
}

export default function Finance() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "dashboard";

  const handleTabChange = (value: string) => {
    setSearchParams(prev => {
      prev.set("tab", value);
      return prev;
    });
  };

  const { data: accounts } = useAccounts();
  const { data: journalEntries } = useJournalEntries();
  const { data: trialBalance } = useTrialBalance();
  const { data: businessDate } = useBusinessDate();
  const stats = useFinancialStats();

  const { totalDebits, totalCredits, isBalanced, totalAssets, totalLiabilities, netIncome } = useMemo(() => {
    const debits = trialBalance.reduce((sum, t) => sum + t.totalDebit, 0);
    const credits = trialBalance.reduce((sum, t) => sum + t.totalCredit, 0);

    let assets = 0, liabilities = 0, revenue = 0, expenses = 0;
    trialBalance.forEach((item) => {
      const balance = item.totalDebit - item.totalCredit;
      const type = item.account.type;
      if (type === "asset") assets += balance;
      else if (type === "liability") liabilities -= balance;
      else if (type === "revenue") revenue -= balance;
      else if (type === "expense") expenses += balance;
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

  const tabTriggerClass =
    "gap-1.5 sm:gap-2 h-10 sm:h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-2 sm:px-4 text-xs sm:text-sm transition-all";

  return (
    <MainLayout
      fixedHeight
      title="Finance & Accounting"
      subtitle={`Business Date: ${businessDate || "Loading..."} ${businessDate ? `(${formatISOasBS(businessDate, "short")} BS)` : ""}`}
      actions={
        <Badge variant="outline" className="hidden sm:inline-flex gap-1.5 bg-primary/10 text-primary border-primary/20 text-xs">
          <CalendarDays className="h-3 w-3" />
          {businessDate ? `${businessDate} | ${formatISOasBS(businessDate, "short")} BS` : "Today"}
        </Badge>
      }
    >
      <div className="flex flex-col h-full overflow-hidden">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col overflow-hidden">
          <div className="border-b overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="justify-start h-12 bg-transparent p-0 flex-nowrap min-w-max gap-6">
              <TabsTrigger value="dashboard" className={tabTriggerClass}>
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </TabsTrigger>
              <TabsTrigger value="setup" className={tabTriggerClass}>
                <Settings2 className="h-4 w-4" /> Setup
              </TabsTrigger>
              <TabsTrigger value="transactions" className={tabTriggerClass}>
                <RefreshCw className="h-4 w-4" /> Transaction
              </TabsTrigger>
              <TabsTrigger value="reports" className={tabTriggerClass}>
                <FileText className="h-4 w-4" /> Report
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ========== DASHBOARD ========== */}
          <TabsContent value="dashboard" className="space-y-6 mt-0 p-4 sm:p-6 overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard title="Total Assets" value={formatCurrency(totalAssets)} change="Current period" changeType="neutral" icon={Wallet} delay={0} />
              <MetricCard title="Net Income" value={formatCurrency(netIncome)} change={netIncome >= 0 ? "Profit" : "Loss"} changeType={netIncome >= 0 ? "positive" : "negative"} icon={netIncome >= 0 ? ArrowUpRight : ArrowDownRight} delay={50} />
              <MetricCard title="Outstanding Receivables" value={formatCurrency(stats.outstandingReceivables)} change={`${stats.invoiceCount} invoices`} changeType="neutral" icon={CreditCard} delay={100} />
              <MetricCard title="Trial Balance" value={isBalanced ? "Balanced" : "Unbalanced"} change={isBalanced ? "All entries balanced" : `Diff: ${formatCurrency(Math.abs(totalDebits - totalCredits))}`} changeType={isBalanced ? "positive" : "negative"} icon={Scale} delay={150} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard title="Total Accounts" value={accounts.length.toString()} change={`${accounts.filter((a) => a.is_active).length} active`} changeType="neutral" icon={BookOpen} delay={200} />
              <MetricCard title="Journal Entries" value={journalEntries.length.toString()} change={`${journalEntries.filter((e) => e.is_posted).length} posted`} changeType="neutral" icon={FileText} delay={250} />
              <MetricCard title="Total Revenue" value={formatCurrency(stats.totalRevenue)} change="This period" changeType="positive" icon={TrendingUp} delay={300} />
              <MetricCard title="Total Expenses" value={formatCurrency(stats.totalExpenses)} change={`${stats.expenseCount} records`} changeType="neutral" icon={CircleDollarSign} delay={350} />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => handleTabChange("transactions")}>
                <Send className="h-5 w-5 text-primary" />
                <span className="text-xs">Journal Entries</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => handleTabChange("transactions")}>
                <CreditCard className="h-5 w-5 text-primary" />
                <span className="text-xs">Invoices & Payments</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => handleTabChange("reports")}>
                <Scale className="h-5 w-5 text-primary" />
                <span className="text-xs">Trial Balance</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => handleTabChange("reports")}>
                <TrendingUp className="h-5 w-5 text-primary" />
                <span className="text-xs">Financial Statements</span>
              </Button>
            </div>

          </TabsContent>

          {/* ========== SETUP ========== */}
          <TabsContent value="setup" className="flex-1 overflow-hidden mt-0">
             <div className="h-full p-4 sm:p-6 overflow-hidden">
                <SubTabPanel tabs={setupSubTabs} />
             </div>
          </TabsContent>

          {/* ========== TRANSACTIONS ========== */}
          <TabsContent value="transactions" className="flex-1 overflow-hidden mt-0">
             <div className="h-full p-4 sm:p-6 overflow-hidden">
                <SubTabPanel tabs={transactionSubTabs} />
             </div>
          </TabsContent>

          {/* ========== REPORTS ========== */}
          <TabsContent value="reports" className="flex-1 overflow-hidden mt-0">
             <div className="h-full p-4 sm:p-6 overflow-hidden">
                <SubTabPanel tabs={reportSubTabs} />
             </div>
          </TabsContent>


        </Tabs>
      </div>
    </MainLayout>
  );
}
