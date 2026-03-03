import { useState } from "react";
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
import { Plus, Check, Send, ShieldCheck, Activity, Eye, Trash2, Printer, MoreVertical, Edit2, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  useJournalEntries,
  useCreateJournalEntry,
  usePostJournalEntry,
  useAccounts,
  JournalEntry
} from "@/hooks/useFinance";
import { toast } from "sonner";
import { useBusinessDate } from "@/hooks/useSettings";
import { cn } from "@/lib/utils";

interface JournalManagementServiceProps {
  isReadOnly?: boolean;
}

export function JournalManagementService({ isReadOnly }: JournalManagementServiceProps) {
  const navigate = useNavigate();
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
            <Button onClick={() => navigate("/finance/journal/new")} className="gap-2">
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
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="w-16">Action</TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      Voucher Type
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-4 w-4 p-0 opacity-50 hover:opacity-100">
                            <Search className="h-3 w-3" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-40 p-2">
                          <Input placeholder="Search Type..." className="h-8 text-xs" />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      Voucher No.
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-4 w-4 p-0 opacity-50 hover:opacity-100">
                            <Search className="h-3 w-3" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-40 p-2">
                          <Input placeholder="Search No..." className="h-8 text-xs" />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      Transaction Date (AD)
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-4 w-4 p-0 opacity-50 hover:opacity-100">
                            <Search className="h-3 w-3" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-40 p-2">
                          <Input type="date" className="h-8 text-xs" />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </TableHead>
                  <TableHead>Miti (BS)</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Entry By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {journalEntries.map((entry) => {
                  const totalDebit = entry.lines?.reduce((sum: number, l: any) => sum + (l.debit || 0), 0) || 0;
                  const creatorName = entry.created_by_profile
                    ? `${entry.created_by_profile.first_name || ""} ${entry.created_by_profile.last_name || ""}`.trim()
                    : "System";
                  const createdDate = new Date(entry.created_at).toLocaleString([], {
                    year: 'numeric',
                    month: 'numeric',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <TableRow key={entry.id} className="group hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate(`/finance/journal/${entry.id}`)}>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-32">
                            <DropdownMenuItem onClick={() => navigate(`/finance/journal/${entry.id}`)}>
                              <Eye className="h-4 w-4 mr-2" /> View
                            </DropdownMenuItem>
                            {!entry.is_posted && (
                              <DropdownMenuItem onClick={() => navigate(`/finance/journal/${entry.id}`)}>
                                <Edit2 className="h-4 w-4 mr-2" /> Edit
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem>
                              <Printer className="h-4 w-4 mr-2" /> Print
                            </DropdownMenuItem>
                            {!entry.is_posted && (
                              <DropdownMenuItem
                                className="text-success focus:text-success"
                                onClick={() => handlePostEntry(entry.id)}
                              >
                                <Check className="h-4 w-4 mr-2" /> Post
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="text-destructive focus:text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono text-[10px] px-1.5 py-0 h-5">
                          {entry.voucher_type || "JV"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-primary font-bold">{entry.entry_number}</TableCell>
                      <TableCell className="text-sm">{entry.date}</TableCell>
                      <TableCell className="text-sm font-mono">{entry.miti || "-"}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm">{entry.description}</TableCell>
                      <TableCell className="text-right font-mono font-bold text-sm">
                        ${totalDebit.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] px-1.5 py-0 h-5",
                            entry.is_posted ? "bg-success/20 text-success border-success/30" : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                          )}
                        >
                          {entry.is_posted ? "Posted" : "Draft"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        <span className="font-medium">{creatorName}</span>
                        <span className="text-muted-foreground ml-1">({createdDate})</span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
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
