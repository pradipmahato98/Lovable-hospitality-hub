import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BookOpen,
  FileText,
  PieChart,
  Plus,
  Search,
  Download,
  ChevronRight,
  Check,
  RefreshCw,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Scale,
  Send,
  History,
  Layers,
  Clock,
  LayoutDashboard,
} from "lucide-react";
import { toast } from "sonner";
import {
  useAccounts,
  useCreateAccount,
  useJournalEntries,
  useCreateJournalEntry,
  usePostJournalEntry,
  useLedger,
  useTrialBalance,
  Account,
} from "@/hooks/useFinance";
import { useBusinessDate, useUpdateBusinessDate } from "@/hooks/useSettings";
import { FinancialStatements } from "@/components/finance/FinancialStatements";
import { MetricCard } from "@/components/dashboard/MetricCard";

const accountTypeColors: Record<string, string> = {
  asset: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  liability: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  equity: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  revenue: "bg-success/20 text-success border-success/30",
  expense: "bg-destructive/20 text-destructive border-destructive/30",
};

export default function Finance() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [subView, setSubView] = useState<string | null>(null);
  const [accountCategory, setAccountCategory] = useState("all");
  const [postingTab, setPostingTab] = useState("new");
  const [isDayCloseDialogOpen, setIsDayCloseDialogOpen] = useState(false);
  const [postingDialogOpen, setPostingDialogOpen] = useState(false);
  const [quickPost, setQuickPost] = useState({
    account_id: "",
    contra_account_id: "",
    amount: 0,
    type: "debit" as "debit" | "credit",
    description: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  // Account creation dialog
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [newAccount, setNewAccount] = useState({
    code: "",
    name: "",
    type: "asset" as Account["type"],
    description: "",
  });

  // Journal entry dialog
  const [journalDialogOpen, setJournalDialogOpen] = useState(false);
  const [newJournalEntry, setNewJournalEntry] = useState({
    date: new Date().toISOString().slice(0, 10),
    description: "",
    reference: "",
    lines: [
      { account_id: "", debit: 0, credit: 0 },
      { account_id: "", debit: 0, credit: 0 },
    ],
  });

  // Hooks
  const { data: accounts, isLoading: accountsLoading } = useAccounts();
  const createAccount = useCreateAccount();
  const { data: journalEntries, isLoading: entriesLoading } = useJournalEntries();
  const createJournalEntry = useCreateJournalEntry();
  const postJournalEntry = usePostJournalEntry();
  const { data: ledgerData, isLoading: ledgerLoading } = useLedger(selectedAccountId || undefined);
  const { data: trialBalance, isLoading: trialBalanceLoading } = useTrialBalance();
  const { data: businessDate } = useBusinessDate();
  const updateBusinessDate = useUpdateBusinessDate();

  // Filtered accounts
  const filteredAccounts = accounts.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = accountCategory === "all" || a.type === accountCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate totals for trial balance
  const totalDebits = trialBalance.reduce((sum, t) => sum + t.totalDebit, 0);
  const totalCredits = trialBalance.reduce((sum, t) => sum + t.totalCredit, 0);
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

  const handleCreateAccount = async () => {
    if (!newAccount.code || !newAccount.name) {
      toast.error("Please fill in account code and name");
      return;
    }

    try {
      await createAccount.mutateAsync({
        code: newAccount.code,
        name: newAccount.name,
        type: newAccount.type,
        description: newAccount.description || null,
        parent_id: null,
        is_active: true,
      });
      toast.success("Account created successfully");
      setAccountDialogOpen(false);
      setNewAccount({ code: "", name: "", type: "asset", description: "" });
    } catch (error) {
      toast.error("Failed to create account");
    }
  };

  const handleCreateJournalEntry = async () => {
    if (!newJournalEntry.description) {
      toast.error("Please enter a description");
      return;
    }

    const validLines = newJournalEntry.lines.filter(
      (l) => l.account_id && (l.debit > 0 || l.credit > 0)
    );

    if (validLines.length < 2) {
      toast.error("Please add at least two lines");
      return;
    }

    const totalDebit = validLines.reduce((sum, l) => sum + l.debit, 0);
    const totalCredit = validLines.reduce((sum, l) => sum + l.credit, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      toast.error("Debits must equal credits");
      return;
    }

    try {
      await createJournalEntry.mutateAsync({
        date: newJournalEntry.date,
        description: newJournalEntry.description,
        reference: newJournalEntry.reference || null,
        lines: validLines,
      });
      toast.success("Journal entry created");
      setJournalDialogOpen(false);
      setNewJournalEntry({
        date: new Date().toISOString().slice(0, 10),
        description: "",
        reference: "",
        lines: [
          { account_id: "", debit: 0, credit: 0 },
          { account_id: "", debit: 0, credit: 0 },
        ],
      });
    } catch (error) {
      toast.error("Failed to create journal entry");
    }
  };

  const handlePostEntry = async (entryId: string) => {
    try {
      await postJournalEntry.mutateAsync(entryId);
      toast.success("Journal entry posted to ledger");
    } catch (error) {
      toast.error("Failed to post journal entry");
    }
  };

  const handleQuickPost = async () => {
    if (!quickPost.account_id || !quickPost.contra_account_id || !quickPost.amount || !quickPost.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const lines = [
        {
          account_id: quickPost.account_id,
          debit: quickPost.type === "debit" ? quickPost.amount : 0,
          credit: quickPost.type === "credit" ? quickPost.amount : 0,
        },
        {
          account_id: quickPost.contra_account_id,
          debit: quickPost.type === "credit" ? quickPost.amount : 0,
          credit: quickPost.type === "debit" ? quickPost.amount : 0,
        },
      ];

      const entry = await createJournalEntry.mutateAsync({
        date: businessDate || new Date().toISOString().split("T")[0],
        description: quickPost.description,
        lines: lines,
      });

      // Auto-post the journal entry
      await postJournalEntry.mutateAsync(entry.id);

      toast.success("Transaction posted successfully");
      setPostingDialogOpen(false);
      setQuickPost({
        account_id: "",
        contra_account_id: "",
        amount: 0,
        type: "debit",
        description: "",
      });
    } catch (error) {
      toast.error("Failed to post transaction");
    }
  };

  const handleDayClose = async () => {
    if (!businessDate) return;

    const currentDate = new Date(businessDate);
    currentDate.setDate(currentDate.getDate() + 1);
    const nextDate = currentDate.toISOString().split("T")[0];

    try {
      await updateBusinessDate.mutateAsync(nextDate);
      toast.success(`Business day closed. New date: ${nextDate}`);
      setIsDayCloseDialogOpen(false);
    } catch (error) {
      toast.error("Failed to close business day");
    }
  };

  const addJournalLine = () => {
    setNewJournalEntry((prev) => ({
      ...prev,
      lines: [...prev.lines, { account_id: "", debit: 0, credit: 0 }],
    }));
  };

  const updateJournalLine = (index: number, field: string, value: any) => {
    setNewJournalEntry((prev) => ({
      ...prev,
      lines: prev.lines.map((line, i) =>
        i === index ? { ...line, [field]: value } : line
      ),
    }));
  };

  return (
    <MainLayout
      title="Finance & Accounting"
      subtitle={`Business Date: ${businessDate || "Loading..."}`}
    >
      <div className="space-y-6">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setSubView(null); }}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <TabsList className="grid grid-cols-5 w-full max-w-2xl">
              <TabsTrigger value="dashboard" className="gap-2">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="setup" className="gap-2">
                <BookOpen className="h-4 w-4" />
                Setup
              </TabsTrigger>
              <TabsTrigger value="transactions" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Transactions
              </TabsTrigger>
              <TabsTrigger value="posting" className="gap-2">
                <Send className="h-4 w-4" />
                Transaction Posting
              </TabsTrigger>
              <TabsTrigger value="reports" className="gap-2">
                <FileText className="h-4 w-4" />
                Reports
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Total Accounts"
                value={accounts.length.toString()}
                change={`${accounts.filter((a) => a.is_active).length} active`}
                changeType="neutral"
                icon={BookOpen}
                delay={0}
              />
              <MetricCard
                title="Journal Entries"
                value={journalEntries.length.toString()}
                change={`${journalEntries.filter((e) => e.is_posted).length} posted`}
                changeType="neutral"
                icon={FileText}
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Journal Entries</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {journalEntries.slice(0, 5).map((entry) => {
                        const amount = entry.lines?.reduce((sum: number, l: any) => sum + (l.debit || 0), 0) || 0;
                        return (
                          <TableRow key={entry.id}>
                            <TableCell className="text-sm">{entry.date}</TableCell>
                            <TableCell className="text-sm font-medium">{entry.description}</TableCell>
                            <TableCell className="text-right font-mono text-sm">${amount.toFixed(2)}</TableCell>
                          </TableRow>
                        );
                      })}
                      {journalEntries.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">No recent entries</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Access</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => setActiveTab("transactions")}>
                    <Plus className="h-5 w-5" />
                    New Journal Entry
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => setActiveTab("posting")}>
                    <Send className="h-5 w-5" />
                    Quick Post
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => setActiveTab("reports")}>
                    <PieChart className="h-5 w-5" />
                    General Ledger
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => setActiveTab("reports")}>
                    <Scale className="h-5 w-5" />
                    Trial Balance
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Setup Tab */}
          <TabsContent value="setup" className="space-y-4">
            {subView === "accounts" ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Button variant="ghost" size="sm" onClick={() => setSubView(null)}>
                    <ChevronRight className="h-4 w-4 rotate-180 mr-1" />
                    Back to Setup
                  </Button>
                  <h2 className="text-lg font-semibold">Chart of Accounts</h2>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <Tabs value={accountCategory} onValueChange={setAccountCategory} className="w-auto">
                    <TabsList className="bg-secondary/50">
                      <TabsTrigger value="all">All</TabsTrigger>
                      <TabsTrigger value="asset">Assets</TabsTrigger>
                      <TabsTrigger value="liability">Liabilities</TabsTrigger>
                      <TabsTrigger value="equity">Equity</TabsTrigger>
                      <TabsTrigger value="revenue">Revenue</TabsTrigger>
                      <TabsTrigger value="expense">Expenses</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <div className="flex items-center gap-2">
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search accounts..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Button size="sm" onClick={() => setAccountDialogOpen(true)} className="gap-2">
                      <Plus className="h-4 w-4" />
                      New
                    </Button>
                  </div>
                </div>

                <Card>
                  <CardContent className="p-0">
                    {accountsLoading ? (
                      <div className="p-8 text-center text-muted-foreground">Loading accounts...</div>
                    ) : filteredAccounts.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">No accounts found</div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Code</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredAccounts.map((account) => (
                            <TableRow
                              key={account.id}
                              className="cursor-pointer hover:bg-secondary/50"
                              onClick={() => {
                                setSelectedAccountId(account.id);
                                setActiveTab("reports");
                                setSubView("ledger");
                              }}
                            >
                              <TableCell className="font-mono">{account.code}</TableCell>
                              <TableCell className="font-medium">{account.name}</TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={accountTypeColors[account.type]}
                                >
                                  {account.type}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {account.description || "-"}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={
                                    account.is_active
                                      ? "bg-success/20 text-success"
                                      : "bg-muted text-muted-foreground"
                                  }
                                >
                                  {account.is_active ? "Active" : "Inactive"}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { title: "Chart of Accounts configuration", id: "accounts" },
                  { title: "Account hierarchy and segments" },
                  { title: "Fiscal year and accounting periods" },
                  { title: "Journal types and approval workflows" },
                  { title: "Exchange rate tables" },
                  { title: "Posting rules and module mappings" },
                  { title: "Customer and corporate account setup" },
                  { title: "Credit limits and customer terms" },
                  { title: "Billing templates" },
                  { title: "Invoice numbering rules" },
                  { title: "Vendor master setup" },
                  { title: "Vendor payment terms" },
                  { title: "Withholding tax setup" },
                  { title: "PO/GRN matching rules" },
                  { title: "AP and AR approval workflows" },
                  { title: "Bank account configuration" },
                  { title: "Cash register setup" },
                  { title: "Bank reconciliation rules" },
                  { title: "Signatory and mandate settings" },
                  { title: "Asset categories and useful life settings" },
                  { title: "Depreciation methods" },
                  { title: "Asset numbering rules" },
                  { title: "Asset location and custodian mapping" },
                  { title: "Tax codes and slabs (VAT, GST, service tax)" },
                  { title: "Tax-inclusive/exclusive calculation rules" },
                  { title: "Region-specific tax compliance settings" },
                  { title: "Budget templates" },
                  { title: "Department-wise budget allocation" },
                  { title: "Budget approval workflows" },
                  { title: "Role-based permissions" },
                  { title: "Maker–checker rules" },
                  { title: "Audit period locking" },
                  { title: "Compliance framework rules" },
                  { title: "Financial statement layout configuration" },
                  { title: "Account-to-statement mapping" },
                  { title: "Scheduled reporting setup" },
                ].map((item, idx) => (
                  <Card
                    key={idx}
                    className="cursor-pointer hover:bg-secondary/50 transition-colors"
                    onClick={() => item.id && setSubView(item.id)}
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <span className="text-sm font-medium">{item.title}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-4">
            {subView === "journal" ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Button variant="ghost" size="sm" onClick={() => setSubView(null)}>
                    <ChevronRight className="h-4 w-4 rotate-180 mr-1" />
                    Back to Transactions
                  </Button>
                  <h2 className="text-lg font-semibold">Journal Entries</h2>
                </div>
                <div className="flex items-center justify-end">
                  <Button onClick={() => setJournalDialogOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    New Journal Entry
                  </Button>
                </div>

                <Card>
                  <CardContent className="p-0">
                    {entriesLoading ? (
                      <div className="p-8 text-center text-muted-foreground">
                        Loading journal entries...
                      </div>
                    ) : journalEntries.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        No journal entries yet
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Entry #</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Reference</TableHead>
                            <TableHead className="text-right">Debit</TableHead>
                            <TableHead className="text-right">Credit</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {journalEntries.map((entry) => {
                            const totalDebit =
                              entry.lines?.reduce((sum: number, l: any) => sum + (l.debit || 0), 0) || 0;
                            const totalCredit =
                              entry.lines?.reduce((sum: number, l: any) => sum + (l.credit || 0), 0) || 0;

                            return (
                              <TableRow key={entry.id}>
                                <TableCell className="font-mono text-primary">
                                  {entry.entry_number}
                                </TableCell>
                                <TableCell>{entry.date}</TableCell>
                                <TableCell>{entry.description}</TableCell>
                                <TableCell className="text-muted-foreground">
                                  {entry.reference || "-"}
                                </TableCell>
                                <TableCell className="text-right font-mono">
                                  ${totalDebit.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-right font-mono">
                                  ${totalCredit.toFixed(2)}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className={
                                      entry.is_posted
                                        ? "bg-success/20 text-success"
                                        : "bg-amber-500/20 text-amber-400"
                                    }
                                  >
                                    {entry.is_posted ? "Posted" : "Draft"}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {!entry.is_posted && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handlePostEntry(entry.id)}
                                      disabled={postJournalEntry.isPending}
                                    >
                                      <Check className="h-4 w-4 mr-1" />
                                      Post
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { title: "Manual journal entries", id: "journal" },
                  { title: "Recurring journals" },
                  { title: "Reversing journal entries" },
                  { title: "Auto-posting from PMS, POS, Inventory, Payroll", onClick: () => setActiveTab("posting") },
                  { title: "Multi-currency journal postings" },
                  { title: "Corporate/cash/OTA invoice generation" },
                  { title: "Group and event billing" },
                  { title: "Manual invoice creation" },
                  { title: "Credit notes & adjustments" },
                  { title: "Payment receipts (cash, card, bank, cheque)" },
                  { title: "Advance deposits and prepayments" },
                  { title: "Payment application (full/partial)" },
                  { title: "Dunning actions" },
                  { title: "Vendor invoice posting" },
                  { title: "GRN and invoice matching" },
                  { title: "Recurring vendor invoices" },
                  { title: "Vendor payments (single or batch)" },
                  { title: "Debit notes" },
                  { title: "Withholding tax deduction" },
                  { title: "Cash collections from operations" },
                  { title: "Cash deposits to bank" },
                  { title: "Bank payments and receipts" },
                  { title: "Bank reconciliation" },
                  { title: "Petty cash issuance and settlement" },
                  { title: "Asset addition (purchase/capitalization)" },
                  { title: "Asset disposal" },
                  { title: "Asset revaluation" },
                  { title: "Depreciation run" },
                  { title: "Asset transfers" },
                  { title: "Maintenance cost posting" },
                  { title: "Tax calculation on invoices" },
                  { title: "Tax adjustments" },
                  { title: "Tax period closing" },
                  { title: "Budget entry or revision" },
                  { title: "Forecast submission" },
                  { title: "Variance calculation" },
                  { title: "Approval actions (JEs, vendors, payments, budgets)" },
                  { title: "Financial period close and reopen", onClick: () => setIsDayCloseDialogOpen(true) },
                ].map((item: any, idx) => (
                  <Card
                    key={idx}
                    className="cursor-pointer hover:bg-secondary/50 transition-colors"
                    onClick={() => {
                      if (item.onClick) item.onClick();
                      else if (item.id) setSubView(item.id);
                    }}
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <span className="text-sm font-medium">{item.title}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Posting Tab */}
          <TabsContent value="posting" className="space-y-4">
            <Tabs value={postingTab} onValueChange={setPostingTab}>
              <TabsList className="grid grid-cols-4 w-full max-w-2xl">
                <TabsTrigger value="new" className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Posting
                </TabsTrigger>
                <TabsTrigger value="bulk" className="gap-2">
                  <Layers className="h-4 w-4" />
                  Bulk Posting
                </TabsTrigger>
                <TabsTrigger value="pending" className="gap-2">
                  <Clock className="h-4 w-4" />
                  Pending
                </TabsTrigger>
                <TabsTrigger value="history" className="gap-2">
                  <History className="h-4 w-4" />
                  History
                </TabsTrigger>
              </TabsList>

              <TabsContent value="new" className="mt-4 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Single Transaction Posting</CardTitle>
                    <CardDescription>Post a manual transaction to the general ledger</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Main Account</Label>
                          <Select
                            value={quickPost.account_id}
                            onValueChange={(v) => setQuickPost({ ...quickPost, account_id: v })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select account" />
                            </SelectTrigger>
                            <SelectContent>
                              {accounts.map((acc) => (
                                <SelectItem key={acc.id} value={acc.id}>
                                  {acc.code} - {acc.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Contra Account (Offset)</Label>
                          <Select
                            value={quickPost.contra_account_id}
                            onValueChange={(v) => setQuickPost({ ...quickPost, contra_account_id: v })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select offset account" />
                            </SelectTrigger>
                            <SelectContent>
                              {accounts.map((acc) => (
                                <SelectItem key={acc.id} value={acc.id}>
                                  {acc.code} - {acc.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Amount ($)</Label>
                            <Input
                              type="number"
                              placeholder="0.00"
                              value={quickPost.amount || ""}
                              onChange={(e) => setQuickPost({ ...quickPost, amount: parseFloat(e.target.value) || 0 })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Action</Label>
                            <Select
                              value={quickPost.type}
                              onValueChange={(v: "debit" | "credit") => setQuickPost({ ...quickPost, type: v })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="debit">Debit Main</SelectItem>
                                <SelectItem value="credit">Credit Main</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Input
                            placeholder="e.g., Manual utility payment"
                            value={quickPost.description}
                            onChange={(e) => setQuickPost({ ...quickPost, description: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Date</Label>
                          <Input type="date" value={businessDate || new Date().toISOString().slice(0, 10)} readOnly />
                        </div>
                        <div className="pt-4">
                          <Button
                            className="w-full gap-2"
                            onClick={handleQuickPost}
                            disabled={createJournalEntry.isPending}
                          >
                            <Send className="h-4 w-4" />
                            {createJournalEntry.isPending ? "Posting..." : "Post Transaction"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="bulk" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Bulk Transaction Posting</CardTitle>
                    <CardDescription>Upload a CSV or Excel file to post multiple transactions</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg border-muted-foreground/25">
                    <Layers className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                    <p className="text-sm text-muted-foreground mb-4">Drag and drop your file here, or click to browse</p>
                    <Button variant="outline" className="gap-2">
                      <Download className="h-4 w-4" />
                      Select File
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="pending" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Pending Postings</CardTitle>
                    <CardDescription>Transactions waiting for review and approval</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Account</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No pending postings found.
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Posting History</CardTitle>
                    <CardDescription>Recent manual and bulk posting activities</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Time</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Items</TableHead>
                          <TableHead className="text-right">Total Value</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No posting history available.
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-4">
            {subView === "ledger" ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Button variant="ghost" size="sm" onClick={() => setSubView(null)}>
                    <ChevronRight className="h-4 w-4 rotate-180 mr-1" />
                    Back to Reports
                  </Button>
                  <h2 className="text-lg font-semibold">General Ledger</h2>
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex-1 max-w-sm">
                    <Select
                      value={selectedAccountId || ""}
                      onValueChange={(v) => setSelectedAccountId(v || null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select account to view ledger" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Accounts</SelectItem>
                        {accounts.map((acc) => (
                          <SelectItem key={acc.id} value={acc.id}>
                            {acc.code} - {acc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Card>
                  <CardContent className="p-0">
                    {ledgerLoading ? (
                      <div className="p-8 text-center text-muted-foreground">Loading ledger...</div>
                    ) : ledgerData.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        No ledger entries found. Post some journal entries first.
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Entry #</TableHead>
                            <TableHead>Account</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Debit</TableHead>
                            <TableHead className="text-right">Credit</TableHead>
                            <TableHead className="text-right">Balance</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {ledgerData.map((entry) => (
                            <TableRow key={entry.id}>
                              <TableCell>{entry.date}</TableCell>
                              <TableCell className="font-mono text-primary">
                                {entry.entry_number}
                              </TableCell>
                              <TableCell>
                                <span className="font-mono text-xs">{entry.account_code}</span>{" "}
                                {entry.account_name}
                              </TableCell>
                              <TableCell>{entry.description}</TableCell>
                              <TableCell className="text-right font-mono">
                                {entry.debit > 0 ? `$${entry.debit.toFixed(2)}` : "-"}
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {entry.credit > 0 ? `$${entry.credit.toFixed(2)}` : "-"}
                              </TableCell>
                              <TableCell className="text-right font-mono font-semibold">
                                ${entry.running_balance.toFixed(2)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : subView === "trial-balance" ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Button variant="ghost" size="sm" onClick={() => setSubView(null)}>
                    <ChevronRight className="h-4 w-4 rotate-180 mr-1" />
                    Back to Reports
                  </Button>
                  <h2 className="text-lg font-semibold">Trial Balance</h2>
                </div>
                <div className="flex items-center justify-end">
                  <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Trial Balance</CardTitle>
                    <CardDescription>
                      Summary of all posted journal entries
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    {trialBalanceLoading ? (
                      <div className="p-8 text-center text-muted-foreground">
                        Loading trial balance...
                      </div>
                    ) : trialBalance.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        No posted entries yet
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Code</TableHead>
                            <TableHead>Account Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right">Debit</TableHead>
                            <TableHead className="text-right">Credit</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {trialBalance.map((row) => (
                            <TableRow key={row.account.id}>
                              <TableCell className="font-mono">{row.account.code}</TableCell>
                              <TableCell className="font-medium">{row.account.name}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className={accountTypeColors[row.account.type]}>
                                  {row.account.type}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                ${row.totalDebit.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                ${row.totalCredit.toFixed(2)}
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="font-bold border-t-2">
                            <TableCell colSpan={3} className="text-right">
                              Totals
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              ${totalDebits.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              ${totalCredits.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : subView === "financial-statements" ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Button variant="ghost" size="sm" onClick={() => setSubView(null)}>
                    <ChevronRight className="h-4 w-4 rotate-180 mr-1" />
                    Back to Reports
                  </Button>
                  <h2 className="text-lg font-semibold">Financial Statements</h2>
                </div>
                <FinancialStatements />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { title: "Trial Balance", id: "trial-balance" },
                  { title: "General ledger detail", id: "ledger" },
                  { title: "COA summary" },
                  { title: "Journal register" },
                  { title: "Journal audit log" },
                  { title: "Period close report" },
                  { title: "Consolidated Balance Sheet", id: "financial-statements" },
                  { title: "Consolidated Profit & Loss", id: "financial-statements" },
                  { title: "Consolidated Cash Flow", id: "financial-statements" },
                  { title: "AR Aging" },
                  { title: "Customer statements" },
                  { title: "Invoice register" },
                  { title: "Receipt register" },
                  { title: "Outstanding balances" },
                  { title: "Credit utilization report" },
                  { title: "AP Aging" },
                  { title: "Vendor statements" },
                  { title: "Vendor invoice register" },
                  { title: "Payment register" },
                  { title: "GRN vs invoice variance report" },
                  { title: "Outstanding vendor liabilities" },
                  { title: "Cash register reconciliation report" },
                  { title: "Daily cash movement report" },
                  { title: "Bank reconciliation statement" },
                  { title: "Cash flow statements (direct / indirect)" },
                  { title: "Asset register" },
                  { title: "Depreciation schedule" },
                  { title: "Asset disposal report" },
                  { title: "Asset verification report" },
                  { title: "Capitalization summary" },
                  { title: "Tax summary (sales/purchase)" },
                  { title: "Tax liability report" },
                  { title: "Withholding tax report" },
                  { title: "Tax audit trail" },
                  { title: "Budget vs Actual" },
                  { title: "Forecast vs Actual" },
                  { title: "Departmental variance reports" },
                  { title: "Audit logs" },
                  { title: "Internal control exception reports" },
                  { title: "Transaction history (before/after values)" },
                  { title: "Daily Revenue Report (financial extract)" },
                  { title: "Hospitality financial KPIs (RevPAR, ADR, OCC)" },
                  { title: "Departmental P&L" },
                  { title: "Enterprise-level consolidated financial statements" },
                ].map((item, idx) => (
                  <Card
                    key={idx}
                    className="cursor-pointer hover:bg-secondary/50 transition-colors"
                    onClick={() => item.id && setSubView(item.id)}
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <span className="text-sm font-medium">{item.title}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Quick Posting Dialog */}
      <Dialog open={postingDialogOpen} onOpenChange={setPostingDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Quick Transaction Posting</DialogTitle>
            <DialogDescription>Directly post a transaction between two accounts</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Account</Label>
              <Select
                value={quickPost.account_id}
                onValueChange={(v) => setQuickPost({ ...quickPost, account_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.code} - {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Contra Account</Label>
              <Select
                value={quickPost.contra_account_id}
                onValueChange={(v) => setQuickPost({ ...quickPost, contra_account_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select offset account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.code} - {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={quickPost.amount || ""}
                  onChange={(e) => setQuickPost({ ...quickPost, amount: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={quickPost.type}
                  onValueChange={(v: "debit" | "credit") => setQuickPost({ ...quickPost, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="debit">Debit</SelectItem>
                    <SelectItem value="credit">Credit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                placeholder="What is this for?"
                value={quickPost.description}
                onChange={(e) => setQuickPost({ ...quickPost, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPostingDialogOpen(false)}>Cancel</Button>
            <Button
              className="gap-2"
              onClick={handleQuickPost}
              disabled={createJournalEntry.isPending}
            >
              <Send className="h-4 w-4" />
              {createJournalEntry.isPending ? "Posting..." : "Post Now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Day Close Confirmation Dialog */}
      <Dialog open={isDayCloseDialogOpen} onOpenChange={setIsDayCloseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close Business Day?</DialogTitle>
            <DialogDescription>
              This will advance the business date from {businessDate} to the next day.
              Make sure all transactions for today have been posted.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsDayCloseDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDayClose} disabled={updateBusinessDate.isPending}>
              {updateBusinessDate.isPending ? "Closing..." : "Confirm Day Close"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Account Dialog */}
      <Dialog open={accountDialogOpen} onOpenChange={setAccountDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Account</DialogTitle>
            <DialogDescription>Add a new account to the chart of accounts</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Account Code</Label>
                <Input
                  placeholder="e.g., 1000"
                  value={newAccount.code}
                  onChange={(e) => setNewAccount((p) => ({ ...p, code: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Account Type</Label>
                <Select
                  value={newAccount.type}
                  onValueChange={(v: Account["type"]) =>
                    setNewAccount((p) => ({ ...p, type: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asset">Asset</SelectItem>
                    <SelectItem value="liability">Liability</SelectItem>
                    <SelectItem value="equity">Equity</SelectItem>
                    <SelectItem value="revenue">Revenue</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Account Name</Label>
              <Input
                placeholder="e.g., Cash on Hand"
                value={newAccount.name}
                onChange={(e) => setNewAccount((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Input
                placeholder="Brief description..."
                value={newAccount.description}
                onChange={(e) => setNewAccount((p) => ({ ...p, description: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAccountDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateAccount} disabled={createAccount.isPending}>
                {createAccount.isPending ? "Creating..." : "Create Account"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Journal Entry Dialog */}
      <Dialog open={journalDialogOpen} onOpenChange={setJournalDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Journal Entry</DialogTitle>
            <DialogDescription>Enter debits and credits for this transaction</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={newJournalEntry.date}
                  onChange={(e) =>
                    setNewJournalEntry((p) => ({ ...p, date: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Description</Label>
                <Input
                  placeholder="Transaction description"
                  value={newJournalEntry.description}
                  onChange={(e) =>
                    setNewJournalEntry((p) => ({ ...p, description: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Reference (Optional)</Label>
              <Input
                placeholder="Invoice #, Check #, etc."
                value={newJournalEntry.reference}
                onChange={(e) =>
                  setNewJournalEntry((p) => ({ ...p, reference: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Lines</Label>
              <div className="space-y-2">
                {newJournalEntry.lines.map((line, index) => (
                  <div key={index} className="grid grid-cols-4 gap-2">
                    <Select
                      value={line.account_id}
                      onValueChange={(v) => updateJournalLine(index, "account_id", v)}
                    >
                      <SelectTrigger className="col-span-2">
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((acc) => (
                          <SelectItem key={acc.id} value={acc.id}>
                            {acc.code} - {acc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      placeholder="Debit"
                      value={line.debit || ""}
                      onChange={(e) =>
                        updateJournalLine(index, "debit", parseFloat(e.target.value) || 0)
                      }
                    />
                    <Input
                      type="number"
                      placeholder="Credit"
                      value={line.credit || ""}
                      onChange={(e) =>
                        updateJournalLine(index, "credit", parseFloat(e.target.value) || 0)
                      }
                    />
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={addJournalLine}>
                <Plus className="h-4 w-4 mr-1" />
                Add Line
              </Button>
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <div className="text-sm text-muted-foreground">
                Debit: $
                {newJournalEntry.lines.reduce((s, l) => s + l.debit, 0).toFixed(2)} | Credit: $
                {newJournalEntry.lines.reduce((s, l) => s + l.credit, 0).toFixed(2)}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setJournalDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateJournalEntry} disabled={createJournalEntry.isPending}>
                  {createJournalEntry.isPending ? "Creating..." : "Create Entry"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
