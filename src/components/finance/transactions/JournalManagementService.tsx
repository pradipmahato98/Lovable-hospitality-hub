import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Check, Send, ShieldCheck, Search } from "lucide-react";
import {
  useJournalEntries, useCreateJournalEntry, usePostJournalEntry, useAccounts, JournalEntry
} from "@/hooks/useFinance";
import { toast } from "sonner";
import { useBusinessDate } from "@/hooks/useSettings";
import { NepaliDateInput, NepaliDateSearch } from "@/components/shared/NepaliDateInput";
import { formatISOasBS } from "@/lib/nepaliDate";

interface JournalManagementServiceProps {
  isReadOnly?: boolean;
}

export function JournalManagementService({ isReadOnly }: JournalManagementServiceProps) {
  const [journalDialogOpen, setJournalDialogOpen] = useState(false);
  const [postingDialogOpen, setPostingDialogOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState<{ from: string; to: string } | null>(null);
  const [searchText, setSearchText] = useState("");
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

  const { data: journalEntries, isLoading } = useJournalEntries();
  const { data: accounts } = useAccounts();
  const createJournalEntry = useCreateJournalEntry();
  const postJournalEntry = usePostJournalEntry();
  const { data: businessDate } = useBusinessDate();

  // Filter entries by date range and search text
  const filteredEntries = useMemo(() => {
    let entries = journalEntries || [];
    if (dateFilter) {
      entries = entries.filter(e => e.date >= dateFilter.from && e.date <= dateFilter.to);
    }
    if (searchText) {
      const q = searchText.toLowerCase();
      entries = entries.filter(e =>
        e.description?.toLowerCase().includes(q) ||
        e.entry_number?.toLowerCase().includes(q) ||
        e.reference?.toLowerCase().includes(q) ||
        formatISOasBS(e.date, "long").toLowerCase().includes(q)
      );
    }
    return entries;
  }, [journalEntries, dateFilter, searchText]);

  const handleCreateJournalEntry = async () => {
    if (!newJournalEntry.description) { toast.error("Please enter a description"); return; }
    const validLines = newJournalEntry.lines.filter(l => l.account_id && (l.debit > 0 || l.credit > 0));
    if (validLines.length < 2) { toast.error("Please add at least two lines"); return; }
    const totalDebit = validLines.reduce((sum, l) => sum + l.debit, 0);
    const totalCredit = validLines.reduce((sum, l) => sum + l.credit, 0);
    if (Math.abs(totalDebit - totalCredit) > 0.01) { toast.error("Debits must equal credits"); return; }
    try {
      await createJournalEntry.mutateAsync({
        date: newJournalEntry.date,
        description: newJournalEntry.description,
        reference: newJournalEntry.reference || null,
        lines: validLines,
      });
      toast.success("Journal entry created");
      setJournalDialogOpen(false);
      setNewJournalEntry({ date: new Date().toISOString().slice(0, 10), description: "", reference: "", lines: [{ account_id: "", debit: 0, credit: 0 }, { account_id: "", debit: 0, credit: 0 }] });
    } catch { toast.error("Failed to create journal entry"); }
  };

  const handlePostEntry = async (entryId: string) => {
    try { await postJournalEntry.mutateAsync(entryId); toast.success("Journal entry posted to ledger"); }
    catch { toast.error("Failed to post journal entry"); }
  };

  const handleQuickPost = async () => {
    if (!quickPost.account_id || !quickPost.contra_account_id || !quickPost.amount || !quickPost.description) {
      toast.error("Please fill in all required fields"); return;
    }
    try {
      const lines = [
        { account_id: quickPost.account_id, debit: quickPost.type === "debit" ? quickPost.amount : 0, credit: quickPost.type === "credit" ? quickPost.amount : 0 },
        { account_id: quickPost.contra_account_id, debit: quickPost.type === "credit" ? quickPost.amount : 0, credit: quickPost.type === "debit" ? quickPost.amount : 0 },
      ];
      const entry = await createJournalEntry.mutateAsync({
        date: businessDate || new Date().toISOString().split("T")[0],
        description: quickPost.description,
        lines,
      });
      await postJournalEntry.mutateAsync(entry.id);
      toast.success("Transaction posted successfully");
      setPostingDialogOpen(false);
      setQuickPost({ account_id: "", contra_account_id: "", amount: 0, type: "debit", description: "" });
    } catch { toast.error("Failed to post transaction"); }
  };

  const addJournalLine = () => {
    setNewJournalEntry(prev => ({ ...prev, lines: [...prev.lines, { account_id: "", debit: 0, credit: 0 }] }));
  };

  const updateJournalLine = (index: number, field: string, value: any) => {
    setNewJournalEntry(prev => ({
      ...prev,
      lines: prev.lines.map((line, i) => i === index ? { ...line, [field]: value } : line),
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display">Journal Management</h2>
          <p className="text-muted-foreground text-sm">Create and manage manual, recurring, and reversing journals.</p>
        </div>
        {!isReadOnly && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setPostingDialogOpen(true)} className="gap-2">
              <Send className="h-4 w-4" /> Quick Post
            </Button>
            <Button onClick={() => setJournalDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" /> New Journal Entry
            </Button>
          </div>
        )}
      </div>

      {/* Search & Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-3 items-end">
            <div className="flex-1 space-y-1">
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Search (AD/BS/Text)</span>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search by entry #, description, or BS date (e.g. Falgun)..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="pl-8 h-9 text-sm"
                />
              </div>
            </div>
            <NepaliDateSearch
              onSearch={(from, to) => setDateFilter({ from, to })}
            />
            {dateFilter && (
              <Button variant="ghost" size="sm" className="h-9 text-xs" onClick={() => setDateFilter(null)}>
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Journal Register</CardTitle>
              <CardDescription>
                {businessDate ? `Business date: ${businessDate} (${formatISOasBS(businessDate, "long")} BS)` : "Today"}
                {dateFilter && ` • Filtered: ${dateFilter.from} to ${dateFilter.to}`}
              </CardDescription>
            </div>
            <Badge variant="outline" className="bg-success/10 text-success border-success/20">
              <ShieldCheck className="h-3 w-3 mr-1" /> Audit Ready
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading journal entries...</div>
          ) : filteredEntries.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {dateFilter || searchText ? "No entries match your search" : "No journal entries yet"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entry #</TableHead>
                    <TableHead>Date (AD)</TableHead>
                    <TableHead>मिति (BS)</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry) => {
                    const totalDebit = entry.lines?.reduce((sum: number, l: any) => sum + (l.debit || 0), 0) || 0;
                    const totalCredit = entry.lines?.reduce((sum: number, l: any) => sum + (l.credit || 0), 0) || 0;
                    return (
                      <TableRow key={entry.id}>
                        <TableCell className="font-mono text-primary">{entry.entry_number}</TableCell>
                        <TableCell className="text-sm">{entry.date}</TableCell>
                        <TableCell className="text-sm text-primary font-medium">{formatISOasBS(entry.date, "long")}</TableCell>
                        <TableCell>{entry.description}</TableCell>
                        <TableCell className="text-right font-mono">${totalDebit.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-mono">${totalCredit.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={entry.is_posted ? "bg-success/20 text-success" : "bg-amber-500/20 text-amber-400"}>
                            {entry.is_posted ? "Posted" : "Draft"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {!entry.is_posted && !isReadOnly && (
                            <Button variant="ghost" size="sm" onClick={() => handlePostEntry(entry.id)} disabled={postJournalEntry.isPending}>
                              <Check className="h-4 w-4 mr-1" /> Post
                            </Button>
                          )}
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

      {/* Create Journal Dialog */}
      <Dialog open={journalDialogOpen} onOpenChange={setJournalDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Journal Entry</DialogTitle>
            <DialogDescription>Enter debits and credits for this transaction</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <NepaliDateInput
                label="Entry Date"
                value={newJournalEntry.date}
                onChange={(d) => setNewJournalEntry(p => ({ ...p, date: d }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                placeholder="Transaction description"
                value={newJournalEntry.description}
                onChange={(e) => setNewJournalEntry(p => ({ ...p, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Reference (Optional)</Label>
              <Input
                placeholder="Invoice #, Check #, etc."
                value={newJournalEntry.reference}
                onChange={(e) => setNewJournalEntry(p => ({ ...p, reference: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Lines</Label>
              <div className="space-y-2">
                {newJournalEntry.lines.map((line, index) => (
                  <div key={index} className="grid grid-cols-4 gap-2">
                    <Select value={line.account_id} onValueChange={(v) => updateJournalLine(index, "account_id", v)}>
                      <SelectTrigger className="col-span-2"><SelectValue placeholder="Select account" /></SelectTrigger>
                      <SelectContent>
                        {accounts.map((acc) => (
                          <SelectItem key={acc.id} value={acc.id}>{acc.code} - {acc.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input type="number" placeholder="Debit" value={line.debit || ""} onChange={(e) => updateJournalLine(index, "debit", parseFloat(e.target.value) || 0)} />
                    <Input type="number" placeholder="Credit" value={line.credit || ""} onChange={(e) => updateJournalLine(index, "credit", parseFloat(e.target.value) || 0)} />
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={addJournalLine}>
                <Plus className="h-4 w-4 mr-1" /> Add Line
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
              <Select value={quickPost.account_id} onValueChange={(v) => setQuickPost({ ...quickPost, account_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                <SelectContent>
                  {accounts?.map((acc) => <SelectItem key={acc.id} value={acc.id}>{acc.code} - {acc.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Contra Account</Label>
              <Select value={quickPost.contra_account_id} onValueChange={(v) => setQuickPost({ ...quickPost, contra_account_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select offset account" /></SelectTrigger>
                <SelectContent>
                  {accounts?.map((acc) => <SelectItem key={acc.id} value={acc.id}>{acc.code} - {acc.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input type="number" placeholder="0.00" value={quickPost.amount || ""} onChange={(e) => setQuickPost({ ...quickPost, amount: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={quickPost.type} onValueChange={(v: "debit" | "credit") => setQuickPost({ ...quickPost, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="debit">Debit</SelectItem>
                    <SelectItem value="credit">Credit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input placeholder="What is this for?" value={quickPost.description} onChange={(e) => setQuickPost({ ...quickPost, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPostingDialogOpen(false)}>Cancel</Button>
            <Button className="gap-2" onClick={handleQuickPost} disabled={createJournalEntry.isPending}>
              <Send className="h-4 w-4" />
              {createJournalEntry.isPending ? "Posting..." : "Post Now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
