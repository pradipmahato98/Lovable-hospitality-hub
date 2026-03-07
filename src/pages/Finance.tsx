import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  ArrowDownRight,
  ChevronLeft,
  Briefcase,
  Building2,
  History,
  ShieldCheck,
  Calculator,
  Globe,
  PieChart,
  Zap,
  ArrowRight
} from "lucide-react";

// Setup Services
import { ChartOfAccountsService } from "@/components/finance/setup/ChartOfAccountsService";
import { AccessControlService } from "@/components/finance/setup/AccessControlService";
import { VendorMasterService } from "@/components/finance/setup/VendorMasterService";
import { CustomerMasterService } from "@/components/finance/setup/CustomerMasterService";
import { AssetMasterService } from "@/components/finance/setup/AssetMasterService";
import { BudgetSetupService } from "@/components/finance/setup/BudgetSetupService";
import { BankCashSetupService } from "@/components/finance/setup/BankCashSetupService";
import { TaxConfigurationService } from "@/components/finance/setup/TaxConfigurationService";
import { FinancialConfigurationService } from "@/components/finance/setup/FinancialConfigurationService";

// Transaction Services
import { JournalManagementService } from "@/components/finance/transactions/JournalManagementService";
import { APTransactionService } from "@/components/finance/transactions/APTransactionService";
import { ARTransactionService } from "@/components/finance/transactions/ARTransactionService";
import { BankCashTransactionService } from "@/components/finance/transactions/BankCashTransactionService";
import { AssetOperationsService } from "@/components/finance/transactions/AssetOperationsService";
import { BudgetExecutionService } from "@/components/finance/transactions/BudgetExecutionService";
import { FinancialPeriodCloseService } from "@/components/finance/transactions/FinancialPeriodCloseService";
import { TaxCalculationService } from "@/components/finance/transactions/TaxCalculationService";
import { IntegrationOrchestratorService } from "@/components/finance/transactions/IntegrationOrchestratorService";
import { ApprovalWorkflowService } from "@/components/finance/transactions/ApprovalWorkflowService";

// Reporting Services
import { FinancialReportingService } from "@/components/finance/reporting/FinancialReportingService";
import { APReportingService } from "@/components/finance/reporting/APReportingService";
import { ARReportingService } from "@/components/finance/reporting/ARReportingService";
import { LedgerInquiryService } from "@/components/finance/reporting/LedgerInquiryService";
import { AuditReportingService } from "@/components/finance/reporting/AuditReportingService";
import { BudgetForecastReportingService } from "@/components/finance/reporting/BudgetForecastReportingService";
import { RevenueRecognitionService } from "@/components/finance/reporting/RevenueRecognitionService";

// Infrastructure
import { EventBusService } from "@/components/finance/infrastructure/EventBusService";

import { useAccounts, useJournalEntries, useTrialBalance } from "@/hooks/useFinance";
import { useBusinessDate } from "@/hooks/useSettings";
import { useFinancePermissions } from "@/hooks/useFinancePermissions";
import { MetricCard } from "@/components/dashboard/MetricCard";

export default function Finance() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "dashboard";
  const [activeService, setActiveService] = useState<string | null>(null);

  const setActiveTab = (tab: string) => {
    setSearchParams(prev => {
      prev.set("tab", tab);
      return prev;
    });
  };
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

  const coaPermission = checkPermission("1.1 Chart of Accounts Service");
  const journalPermission = checkPermission("2.1 Journal Management Service");
  const reportingPermission = checkPermission("3.1 Financial Reporting Service");
  const infrastructurePermission = checkPermission("4.1 Event Bus");

  const { totalDebits, totalCredits, isBalanced, totalAssets, totalLiabilities, netIncome } = useMemo(() => {
    if (!trialBalance || trialBalance.length === 0) {
      return { totalDebits: 0, totalCredits: 0, isBalanced: true, totalAssets: 0, totalLiabilities: 0, netIncome: 0 };
    }

    const debits = trialBalance.reduce((sum, t) => sum + (t.totalDebit || 0), 0);
    const credits = trialBalance.reduce((sum, t) => sum + (t.totalCredit || 0), 0);

    let assets = 0;
    let liabilities = 0;
    let revenue = 0;
    let expenses = 0;

    trialBalance.forEach(item => {
      const balance = (item.totalDebit || 0) - (item.totalCredit || 0);
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

  const services = {
    setup: [
      { id: "coa", name: "Chart of Accounts", icon: BookOpen, description: "Manage ledger structure", component: ChartOfAccountsService },
      { id: "vendors", name: "Vendors & Suppliers", icon: Building2, description: "Payable master data", component: VendorMasterService },
      { id: "customers", name: "Customers & Guests", icon: UserCircle, description: "Receivable master data", component: CustomerMasterService },
      { id: "assets", name: "Fixed Asset Master", icon: Briefcase, description: "Asset registry & life-cycles", component: AssetMasterService },
      { id: "budgets", name: "Budget Planning", icon: PieChart, description: "Fiscal year targets", component: BudgetSetupService },
      { id: "bank", name: "Bank & Cash Setup", icon: Wallet, description: "Manage bank accounts", component: BankCashSetupService },
      { id: "tax", name: "Tax Configuration", icon: Calculator, description: "Manage tax rates & rules", component: TaxConfigurationService },
      { id: "config", name: "Financial Config", icon: Settings2, description: "Global posting rules", component: FinancialConfigurationService },
      { id: "access", name: "Access Control", icon: ShieldCheck, description: "Permissions & audit locks", component: AccessControlService },
    ],
    transactions: [
      { id: "journal", name: "Journal Management", icon: RefreshCw, description: "Manual & recurring journals", component: JournalManagementService },
      { id: "ap", name: "Accounts Payable", icon: ArrowDownRight, description: "Invoices & vendor payments", component: APTransactionService },
      { id: "ar", name: "Accounts Receivable", icon: ArrowUpRight, description: "Billing & customer receipts", component: ARTransactionService },
      { id: "banking", name: "Bank & Cash Ops", icon: Wallet, description: "Reconciliation & transfers", component: BankCashTransactionService },
      { id: "asset-ops", name: "Asset Operations", icon: Briefcase, description: "Depreciation & disposals", component: AssetOperationsService },
      { id: "tax-calc", name: "Tax Calculation", icon: Calculator, description: "Automated tax computation", component: TaxCalculationService },
      { id: "orchestrator", name: "Module Integrations", icon: Zap, description: "Sync PMS/POS revenue", component: IntegrationOrchestratorService },
      { id: "approvals", name: "Approval Workflows", icon: ShieldCheck, description: "Maker-checker logic", component: ApprovalWorkflowService },
      { id: "budget-exec", name: "Budget Execution", icon: PieChart, description: "Approve budget variances", component: BudgetExecutionService },
      { id: "period-close", name: "Period End Close", icon: History, description: "Month/Year-end processing", component: FinancialPeriodCloseService },
    ],
    reporting: [
      { id: "financials", name: "Financial Statements", icon: FileText, description: "P&L, Balance Sheet, Cash Flow", component: FinancialReportingService },
      { id: "ledger-inquiry", name: "Ledger Inquiry", icon: BookOpen, description: "Detailed account analysis", component: LedgerInquiryService },
      { id: "ap-reports", name: "AP Reports", icon: ArrowDownRight, description: "Aging & vendor statements", component: APReportingService },
      { id: "ar-reports", name: "AR Reports", icon: ArrowUpRight, description: "Aging & guest statements", component: ARReportingService },
      { id: "revenue-recognition", name: "Revenue Recognition", icon: TrendingUp, description: "Deferred to earned revenue", component: RevenueRecognitionService },
      { id: "budget-variance", name: "Budget vs Actual", icon: PieChart, description: "Variance trend analysis", component: BudgetForecastReportingService },
      { id: "audit", name: "Audit Reports", icon: ShieldCheck, description: "Trial balance & logs", component: AuditReportingService },
    ]
  };

  const renderServiceContent = () => {
    if (!activeService) return null;
    const allServices = [...services.setup, ...services.transactions, ...services.reporting, { id: "infra", component: EventBusService }];
    const service = allServices.find(s => s.id === activeService);
    if (!service) return null;

    const ServiceComponent = service.component;
    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setActiveService(null)}
          className="gap-2 mb-2"
        >
          <ChevronLeft className="h-4 w-4" /> Back to {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
        </Button>
        <ServiceComponent
          isReadOnly={false}
          onEditorToggle={setIsJournalEditorOpen}
        />
      </div>
    );
  };

  const renderGrid = (serviceList: any[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
      {serviceList.map((service) => (
        <Card
          key={service.id}
          className="group hover:border-primary/50 cursor-pointer transition-all duration-300 hover:shadow-md"
          onClick={() => setActiveService(service.id)}
        >
          <CardHeader className="flex flex-row items-center gap-4 space-y-0">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <service.icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-sm font-semibold">{service.name}</CardTitle>
              <CardDescription className="text-xs line-clamp-1">{service.description}</CardDescription>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
          </CardHeader>
        </Card>
      ))}
    </div>
  );

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
        <Tabs value={activeTab} onValueChange={(v) => {
          setActiveTab(v);
          setActiveService(null);
        }}>
          <div className="border-b overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="justify-start h-12 bg-transparent p-0 flex-nowrap min-w-max gap-6">
              {[
                { id: "dashboard", name: "Dashboard", icon: LayoutDashboard },
                { id: "setup", name: "Setup", icon: Settings2 },
                { id: "transactions", name: "Transactions", icon: RefreshCw },
                { id: "reporting", name: "Reporting", icon: FileText },
                { id: "infrastructure", name: "Infrastructure", icon: Server },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="gap-2 h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 transition-all"
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.name}
                </TabsTrigger>
              ))}
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" /> Intelligence Dashboard
                  </CardTitle>
                  <CardDescription>Real-time financial health and automated audit status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px] flex items-center justify-center border-2 border-dashed rounded-lg bg-muted/20">
                    <p className="text-muted-foreground text-sm">Financial Analytics Engine Active</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Core Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">Active Accounts</span>
                    <span className="font-bold">{accounts.length}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">Posted Journals</span>
                    <span className="font-bold">{journalEntries.filter(e => e.is_posted).length}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">Sub-Ledgers</span>
                    <span className="font-bold">24</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground">Audit Health</span>
                    <Badge className="bg-success">Excellent</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="setup" className="mt-4">
            {activeService ? renderServiceContent() : renderGrid(services.setup)}
          </TabsContent>

          <TabsContent value="transactions" className="mt-4">
            {activeService ? renderServiceContent() : renderGrid(services.transactions)}
          </TabsContent>

          <TabsContent value="reporting" className="mt-4">
            {activeService ? renderServiceContent() : renderGrid(services.reporting)}
          </TabsContent>

          <TabsContent value="infrastructure" className="mt-4">
            <EventBusService isReadOnly={infrastructurePermission === 'view'} />
          </TabsContent>
        </Tabs>
        )}

        {isJournalEditorOpen && (
          <JournalEntryEditor
            onClose={() => setIsJournalEditorOpen(false)}
          />
        )}
      </div>
    </MainLayout>
  );
}
