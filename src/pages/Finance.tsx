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
  Wifi,
  WifiOff,
  RefreshCw,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Scale,
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
import { MetricCard } from "@/components/dashboard/MetricCard";
import { FinancialStatements } from "@/components/finance/FinancialStatements";

const accountTypeColors: Record<string, string> = {
  asset: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  liability: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  equity: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  revenue: "bg-success/20 text-success border-success/30",
  expense: "bg-destructive/20 text-destructive border-destructive/30",
};

export default function Finance() {
  const [activeTab, setActiveTab] = useState("accounts");
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
  const { data: accounts, isLoading: accountsLoading, realtimeStatus } = useAccounts();
  const createAccount = useCreateAccount();
  const { data: journalEntries, isLoading: entriesLoading } = useJournalEntries();
  const createJournalEntry = useCreateJournalEntry();
  const postJournalEntry = usePostJournalEntry();
  const { data: ledgerData, isLoading: ledgerLoading } = useLedger(selectedAccountId || undefined);
  const { data: trialBalance, isLoading: trialBalanceLoading } = useTrialBalance();

  // Filtered accounts
  const filteredAccounts = accounts.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate totals for metrics
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
    <MainLayout title="Finance" subtitle="Chart of accounts, journal entries, and ledger">
      <div className="space-y-6">
        {/* Metrics */}
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

        {/* Connection Status */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {realtimeStatus === "connected" ? (
            <Wifi className="h-4 w-4 text-success" />
          ) : (
            <WifiOff className="h-4 w-4 text-destructive" />
          )}
          <span>
            {realtimeStatus === "connected" ? "Real-time sync active" : "Connecting..."}
          </span>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <TabsList>
              <TabsTrigger value="accounts" className="gap-2">
                <BookOpen className="h-4 w-4" />
                Chart of Accounts
              </TabsTrigger>
              <TabsTrigger value="journal" className="gap-2">
                <FileText className="h-4 w-4" />
                Journal Entries
              </TabsTrigger>
              <TabsTrigger value="ledger" className="gap-2">
                <PieChart className="h-4 w-4" />
                General Ledger
              </TabsTrigger>
              <TabsTrigger value="trial-balance" className="gap-2">
                <Scale className="h-4 w-4" />
                Trial Balance
              </TabsTrigger>
              <TabsTrigger value="reports" className="gap-2">
                <DollarSign className="h-4 w-4" />
                Reports
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Chart of Accounts */}
          <TabsContent value="accounts" className="space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search accounts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button onClick={() => setAccountDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                New Account
              </Button>
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
                            setActiveTab("ledger");
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
          </TabsContent>

          {/* Journal Entries */}
          <TabsContent value="journal" className="space-y-4">
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
                          entry.lines?.reduce((sum, l: any) => sum + (l.debit || 0), 0) || 0;
                        const totalCredit =
                          entry.lines?.reduce((sum, l: any) => sum + (l.credit || 0), 0) || 0;

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
          </TabsContent>

          {/* General Ledger */}
          <TabsContent value="ledger" className="space-y-4">
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
          </TabsContent>

          {/* Trial Balance */}
          <TabsContent value="trial-balance" className="space-y-4">
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
          </TabsContent>

          {/* Financial Reports */}
          <TabsContent value="reports" className="space-y-4">
            <FinancialStatements />
          </TabsContent>
        </Tabs>
      </div>

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
