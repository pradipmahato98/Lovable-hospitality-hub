import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  ChevronRight,
  ArrowLeft,
  Lock,
  Eye,
  Server,
  ShieldCheck,
} from "lucide-react";

// Setup Layer Services
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

// Transaction Layer Services
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

// Reporting Layer Services
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

// Infrastructure Layer Services
import { EventBusService } from "@/components/finance/infrastructure/EventBusService";
import { SharedDataService } from "@/components/finance/infrastructure/SharedDataService";
import { APIGatewayService } from "@/components/finance/infrastructure/APIGatewayService";
import { SecurityLayerService } from "@/components/finance/infrastructure/SecurityLayerService";

import { useAccounts, useJournalEntries, useTrialBalance } from "@/hooks/useFinance";
import { useBusinessDate } from "@/hooks/useSettings";
import { useFinancePermissions } from "@/hooks/useFinancePermissions";
import { MetricCard } from "@/components/dashboard/MetricCard";
import {
  TrendingUp,
  Scale,
  BookOpen,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Database,
  Plus
} from "lucide-react";
import { useMemo } from "react";

export default function Finance() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedService, setSelectedService] = useState<string | null>(null);

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
    const tb = trialBalance || [];
    const debits = tb.reduce((sum, t) => sum + (t.totalDebit || 0), 0);
    const credits = tb.reduce((sum, t) => sum + (t.totalCredit || 0), 0);

    let assets = 0;
    let liabilities = 0;
    let revenue = 0;
    let expenses = 0;

    tb.forEach(item => {
      if (!item.account) return;
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
      netIncome: (Math.abs(revenue) || 0) - (expenses || 0)
    };
  }, [trialBalance]);

  const setupServices = [
    { id: "coa", title: "1.1 Chart of Accounts Service", Component: ChartOfAccountsService },
    { id: "fin-config", title: "1.2 Financial Configuration Service", Component: FinancialConfigurationService },
    { id: "customer-master", title: "1.3 Customer Master Service", Component: CustomerMasterService },
    { id: "vendor-master", title: "1.4 Vendor Master Service", Component: VendorMasterService },
    { id: "bank-cash-setup", title: "1.5 Bank & Cash Setup Service", Component: BankCashSetupService },
    { id: "asset-master", title: "1.6 Asset Master Service", Component: AssetMasterService },
    { id: "tax-config", title: "1.7 Tax Configuration Service", Component: TaxConfigurationService },
    { id: "budget-setup", title: "1.8 Budget Setup Service", Component: BudgetSetupService },
    { id: "access-control", title: "1.9 Access Control & Compliance Service", Component: AccessControlService },
    { id: "statement-mapping", title: "1.10 Financial Statement Mapping Service", Component: FinancialStatementMappingService },
  ];

  const transactionServices = [
    { id: "journal-mgmt", title: "2.1 Journal Management Service", Component: JournalManagementService },
    { id: "ar-transaction", title: "2.2 AR Transaction Service", Component: ARTransactionService },
    { id: "ap-transaction", title: "2.3 AP Transaction Service", Component: APTransactionService },
    { id: "bank-cash-trans", title: "2.4 Bank & Cash Transaction Service", Component: BankCashTransactionService },
    { id: "asset-ops", title: "2.5 Asset Operations Service", Component: AssetOperationsService },
    { id: "tax-calc", title: "2.6 Tax Calculation & Booking Service", Component: TaxCalculationService },
    { id: "budget-exec", title: "2.7 Budget Execution Service", Component: BudgetExecutionService },
    { id: "period-close", title: "2.8 Financial Period Close Service", Component: FinancialPeriodCloseService },
    { id: "approval-workflow", title: "2.9 Approval Workflow Engine", Component: ApprovalWorkflowService },
    { id: "integration-orchestrator", title: "2.10 Integration Orchestrator Service", Component: IntegrationOrchestratorService },
  ];

  const reportingServices = [
    { id: "fin-reporting", title: "3.1 Financial Reporting Service", Component: FinancialReportingService },
    { id: "ledger-inquiry", title: "3.2 Ledger & Inquiry Service", Component: LedgerInquiryService },
    { id: "ar-reporting", title: "3.3 AR Reporting Service", Component: ARReportingService },
    { id: "ap-reporting", title: "3.4 AP Reporting Service", Component: APReportingService },
    { id: "cash-bank-reporting", title: "3.5 Cash & Bank Reporting Service", Component: CashBankReportingService },
    { id: "fixed-assets-reporting", title: "3.6 Fixed Assets Reporting Service", Component: FixedAssetsReportingService },
    { id: "tax-reporting", title: "3.7 Tax Reporting Service", Component: TaxReportingService },
    { id: "budget-forecast-reporting", title: "3.8 Budget & Forecast Reporting Service", Component: BudgetForecastReportingService },
    { id: "audit-reporting", title: "3.9 Audit Reporting Service", Component: AuditReportingService },
    { id: "consolidation-bi", title: "3.10 Consolidation & BI Service", Component: ConsolidationBIService },
  ];

  const infrastructureServices = [
    { id: "event-bus", title: "4.1 Event Bus", Component: EventBusService },
    { id: "data-lake", title: "4.2 Shared Data Services", Component: SharedDataService },
    { id: "api-gateway", title: "4.3 API Gateway", Component: APIGatewayService },
    { id: "security-layer", title: "4.4 Security Layer", Component: SecurityLayerService },
  ];

  const renderServiceList = (services: any[]) => {
    if (selectedService) {
      const service = services.find(s => s.id === selectedService);
      if (service) {
        const permission = checkPermission(service.title);
        const isReadOnly = permission === 'view';

        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => setSelectedService(null)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Microservices
              </Button>
              <h2 className="text-xl font-bold font-display">{service.title}</h2>
              {isReadOnly && (
                <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 gap-1">
                  <Eye className="h-3 w-3" /> View Only
                </Badge>
              )}
            </div>
            <service.Component isReadOnly={isReadOnly} />
          </div>
        );
      }
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => {
          const permission = checkPermission(service.title);
          const hasAccess = permission !== 'none';
          const isReadOnly = permission === 'view';

          return (
            <Card
              key={service.id}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md group border-primary/10",
                !hasAccess ? "opacity-50 grayscale pointer-events-none" : "hover:bg-secondary/50"
              )}
              onClick={() => setSelectedService(service.id)}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/5 rounded-lg group-hover:bg-primary/10 transition-colors">
                    <Settings2 className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">{service.title}</span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Operational Service</span>
                  </div>
                  {isReadOnly && <Eye className="h-3 w-3 text-amber-500" />}
                  {!hasAccess && <Lock className="h-3 w-3 text-destructive/50" />}
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <MainLayout
      title="Finance & Accounting"
      subtitle={`Microservices Architecture | Business Date: ${businessDate || "Loading..."}`}
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
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setSelectedService(null); }}>
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
                Setup Layer
              </TabsTrigger>
              <TabsTrigger
                value="transactions"
                className="gap-2 h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 transition-all"
              >
                <RefreshCw className="h-4 w-4" />
                Transaction Layer
              </TabsTrigger>
              <TabsTrigger
                value="reports"
                className="gap-2 h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 transition-all"
              >
                <FileText className="h-4 w-4" />
                Reporting Layer
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
                value={(accounts?.length || 0).toString()}
                change={`${(accounts?.filter((a) => a.is_active) || []).length} active`}
                changeType="neutral"
                icon={BookOpen}
                delay={200}
              />
              <MetricCard
                title="Journal Entries"
                value={(journalEntries?.length || 0).toString()}
                change={`${(journalEntries?.filter((e) => e.is_posted) || []).length} posted`}
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
                change="All layers functional"
                changeType="positive"
                icon={RefreshCw}
                delay={350}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Microservice Health Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { name: "Setup Layer Services", status: "Operational", color: "text-success" },
                    { name: "Transaction Layer Services", status: "Operational", color: "text-success" },
                    { name: "Reporting Layer Services", status: "Operational", color: "text-success" },
                    { name: "Integration Gateway", status: "Connected", color: "text-primary" },
                  ].map((s, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                      <span className="text-sm font-medium">{s.name}</span>
                      <Badge variant="outline" className={cn(s.color, "bg-background")}>{s.status}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Access Architecture</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => setActiveTab("setup")}>
                    <Settings2 className="h-5 w-5" />
                    Setup Layer
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => setActiveTab("transactions")}>
                    <RefreshCw className="h-5 w-5" />
                    Transactions
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => setActiveTab("reports")}>
                    <FileText className="h-5 w-5" />
                    Reporting
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => { setActiveTab("transactions"); setSelectedService("period-close"); }}>
                    <Lock className="h-5 w-5" />
                    Period Close
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2 text-primary border-primary/20 bg-primary/5" onClick={() => navigate("/finance/journal/new")}>
                    <Plus className="h-5 w-5" />
                    New Journal
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <Card className="bg-primary/5 border-primary/10">
                <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                  <Zap className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Event Bus</p>
                    <p className="text-sm font-bold">12k events/hr</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-success/5 border-success/10">
                <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                  <ShieldCheck className="h-8 w-8 text-success" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Security Layer</p>
                    <p className="text-sm font-bold">100% Policy Match</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-blue-500/5 border-blue-500/10">
                <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                  <Server className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">API Gateway</p>
                    <p className="text-sm font-bold">24ms Avg Latency</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-purple-500/5 border-purple-500/10">
                <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                  <Database className="h-8 w-8 text-purple-500" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Data Lake</p>
                    <p className="text-sm font-bold">85% Optimization</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="setup" className="space-y-4 mt-4">
            {renderServiceList(setupServices)}
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4 mt-4">
            {renderServiceList(transactionServices)}
          </TabsContent>

          <TabsContent value="reports" className="space-y-4 mt-4">
            {renderServiceList(reportingServices)}
          </TabsContent>

          <TabsContent value="infrastructure" className="space-y-4 mt-4">
            {renderServiceList(infrastructureServices)}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
