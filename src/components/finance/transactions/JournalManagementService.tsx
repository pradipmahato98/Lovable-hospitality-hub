import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Check,
  Send,
  ShieldCheck,
  MoreHorizontal,
  Eye,
  Edit,
  Printer,
  Trash,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search
} from "lucide-react";
import {
  useJournalEntries,
  useCreateJournalEntry,
  usePostJournalEntry,
  useAccounts,
  JournalEntry
} from "@/hooks/useFinance";
import { toast } from "sonner";
import { useBusinessDate } from "@/hooks/useSettings";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface JournalManagementServiceProps {
  isReadOnly?: boolean;
}

type SortConfig = {
  key: keyof JournalEntry | 'voucher_type';
  direction: 'asc' | 'desc' | null;
};

export function JournalManagementService({ isReadOnly }: JournalManagementServiceProps) {
  const [journalDialogOpen, setJournalDialogOpen] = useState(false);
  const [postingDialogOpen, setPostingDialogOpen] = useState(false);
  const [newJournalEntry, setNewJournalEntry] = useState({
    date: new Date().toISOString().slice(0, 10),
    description: "",
    reference: "",
    lines: [
      { account_id: "", debit: 0, credit: 0 },
      { account_id: "", debit: 0, credit: 0 },
    ],
  });
  const [quickPost, setQuickPost] = useState({
    account_id: "",
    contra_account_id: "",
    amount: 0,
    type: "debit" as "debit" | "credit",
    description: "",
  });

  // Filtering & Sorting State
  const [filters, setFilters] = useState({
    voucherType: "",
    voucherNo: "",
    date: ""
  });
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'date',
    direction: 'desc'
  });

  const { data: journalEntries, isLoading } = useJournalEntries();
  const { data: accounts } = useAccounts();
  const createJournalEntry = useCreateJournalEntry();
  const postJournalEntry = usePostJournalEntry();
  const { data: businessDate } = useBusinessDate();

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

  const handleSort = (key: SortConfig['key']) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const filteredAndSortedEntries = useMemo(() => {
    let result = [...journalEntries];

    // Filter
    if (filters.voucherType) {
      result = result.filter(e => "JV".toLowerCase().includes(filters.voucherType.toLowerCase()));
    }
    if (filters.voucherNo) {
      result = result.filter(e => e.entry_number.toLowerCase().includes(filters.voucherNo.toLowerCase()));
    }
    if (filters.date) {
      result = result.filter(e => e.date.includes(filters.date));
    }

    // Sort
    if (sortConfig.direction) {
      result.sort((a, b) => {
        let valA: any = sortConfig.key === 'voucher_type' ? "JV" : a[sortConfig.key as keyof JournalEntry];
        let valB: any = sortConfig.key === 'voucher_type' ? "JV" : b[sortConfig.key as keyof JournalEntry];

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [journalEntries, filters, sortConfig]);

  const SortIcon = ({ column }: { column: SortConfig['key'] }) => {
    if (sortConfig.key !== column) return <ArrowUpDown className="ml-2 h-4 w-4" />;
    return sortConfig.direction === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-display">Journal Management</h2>
          <p className="text-muted-foreground text-sm">Create and manage manual, recurring, and reversing journals.</p>
        </div>
        {!isReadOnly && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setPostingDialogOpen(true)} className="gap-2">
              <Send className="h-4 w-4" />
              Quick Post
            </Button>
            <Button onClick={() => setJournalDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              New Journal Entry
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Journal Register</CardTitle>
              <CardDescription>Recent entries for business date {businessDate || "Today"}</CardDescription>
            </div>
            <Badge variant="outline" className="bg-success/10 text-success border-success/20">
              <ShieldCheck className="h-3 w-3 mr-1" /> Audit Ready
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading journal entries...</div>
          ) : journalEntries.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No journal entries yet</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Action</TableHead>
                    <TableHead>
                      <div className="flex flex-col gap-1.5 py-2">
                        <div
                          className="flex items-center gap-1 cursor-pointer select-none hover:text-primary transition-colors"
                          onClick={() => handleSort('voucher_type')}
                        >
                          <span className="font-bold text-xs">Voucher Type</span>
                          <SortIcon column="voucher_type" />
                        </div>
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                          <Input
                            placeholder="Search..."
                            className="h-7 pl-7 text-[10px] bg-muted/30 focus-visible:bg-background"
                            value={filters.voucherType}
                            onChange={(e) => setFilters(f => ({ ...f, voucherType: e.target.value }))}
                          />
                        </div>
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex flex-col gap-1.5 py-2">
                        <div
                          className="flex items-center gap-1 cursor-pointer select-none hover:text-primary transition-colors"
                          onClick={() => handleSort('entry_number')}
                        >
                          <span className="font-bold text-xs">Voucher No.</span>
                          <SortIcon column="entry_number" />
                        </div>
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                          <Input
                            placeholder="Search..."
                            className="h-7 pl-7 text-[10px] bg-muted/30 focus-visible:bg-background"
                            value={filters.voucherNo}
                            onChange={(e) => setFilters(f => ({ ...f, voucherNo: e.target.value }))}
                          />
                        </div>
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex flex-col gap-1.5 py-2">
                        <div
                          className="flex items-center gap-1 cursor-pointer select-none hover:text-primary transition-colors"
                          onClick={() => handleSort('date')}
                        >
                          <span className="font-bold text-xs">Transaction Date</span>
                          <SortIcon column="date" />
                        </div>
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                          <Input
                            type="date"
                            className="h-7 pl-7 text-[10px] bg-muted/30 focus-visible:bg-background"
                            value={filters.date}
                            onChange={(e) => setFilters(f => ({ ...f, date: e.target.value }))}
                          />
                        </div>
                      </div>
                    </TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Entry By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedEntries.map((entry) => {
                    const totalDebit = entry.lines?.reduce((sum: number, l: any) => sum + (l.debit || 0), 0) || 0;
                    const staffName = entry.created_by_profile
                      ? `${entry.created_by_profile.first_name} ${entry.created_by_profile.last_name}`
                      : "System";

                    return (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Actions">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              <DropdownMenuItem className="gap-2">
                                <Eye className="h-4 w-4" /> View
                              </DropdownMenuItem>
                              <DropdownMenuItem className="gap-2">
                                <Edit className="h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem className="gap-2">
                                <Printer className="h-4 w-4" /> Print
                              </DropdownMenuItem>
                              {!entry.is_posted && !isReadOnly && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="gap-2 text-success focus:text-success"
                                    onClick={() => handlePostEntry(entry.id)}
                                  >
                                    <Check className="h-4 w-4" /> Post to Ledger
                                  </DropdownMenuItem>
                                </>
                              )}
                              {!isReadOnly && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive">
                                    <Trash className="h-4 w-4" /> Delete
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                        <TableCell>JV</TableCell>
                        <TableCell className="font-mono text-primary">{entry.entry_number}</TableCell>
                        <TableCell>{entry.date}</TableCell>
                        <TableCell>{entry.description}</TableCell>
                        <TableCell className="text-right font-mono">${totalDebit.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={entry.is_posted ? "bg-success/20 text-success" : "bg-amber-500/20 text-amber-400"}
                          >
                            {entry.is_posted ? "Posted" : "Draft"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-xs">{staffName}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {format(new Date(entry.created_at), "dd/MM/yyyy HH:mm")}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

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
                  onChange={(e) => setNewJournalEntry((p) => ({ ...p, date: e.target.value }))}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Description</Label>
                <Input
                  placeholder="Transaction description"
                  value={newJournalEntry.description}
                  onChange={(e) => setNewJournalEntry((p) => ({ ...p, description: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Reference (Optional)</Label>
              <Input
                placeholder="Invoice #, Check #, etc."
                value={newJournalEntry.reference}
                onChange={(e) => setNewJournalEntry((p) => ({ ...p, reference: e.target.value }))}
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
                      onChange={(e) => updateJournalLine(index, "debit", parseFloat(e.target.value) || 0)}
                    />
                    <Input
                      type="number"
                      placeholder="Credit"
                      value={line.credit || ""}
                      onChange={(e) => updateJournalLine(index, "credit", parseFloat(e.target.value) || 0)}
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
                Debit: ${newJournalEntry.lines.reduce((s, l) => s + l.debit, 0).toFixed(2)} |
                Credit: ${newJournalEntry.lines.reduce((s, l) => s + l.credit, 0).toFixed(2)}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setJournalDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateJournalEntry} disabled={createJournalEntry.isPending}>
                  {createJournalEntry.isPending ? "Creating..." : "Create Entry"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
                  {accounts?.map((acc) => (
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
                  {accounts?.map((acc) => (
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
    </div>
  );
}
