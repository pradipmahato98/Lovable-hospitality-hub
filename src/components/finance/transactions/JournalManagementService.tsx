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
import { Plus, Check, Send, ShieldCheck, Activity } from "lucide-react";
import {
  useJournalEntries,
  useCreateJournalEntry,
  usePostJournalEntry,
  useAccounts,
  JournalEntry
} from "@/hooks/useFinance";
import { toast } from "sonner";
import { useBusinessDate } from "@/hooks/useSettings";
import { JournalEntryEditor } from "./JournalEntryEditor";

interface JournalManagementServiceProps {
  isReadOnly?: boolean;
}

export function JournalManagementService({ isReadOnly }: JournalManagementServiceProps) {
  const [journalEditorOpen, setJournalEditorOpen] = useState(false);
  const [postingDialogOpen, setPostingDialogOpen] = useState(false);
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

  if (journalEditorOpen) {
    return <JournalEntryEditor onClose={() => setJournalEditorOpen(false)} />;
  }

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
            <Button onClick={() => setJournalEditorOpen(true)} className="gap-2">
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
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Voucher Type</TableHead>
                  <TableHead>Voucher No.</TableHead>
                  <TableHead>Transaction Date</TableHead>
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
                    <TableRow key={entry.id}>
                      <TableCell>
                        {!entry.is_posted && !isReadOnly && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePostEntry(entry.id)}
                            disabled={postJournalEntry.isPending}
                            className="h-8 px-2 text-success hover:text-success hover:bg-success/10"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Post
                          </Button>
                        )}
                        {entry.is_posted && (
                          <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                            Completed
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono">
                          {entry.voucher_type || "JV"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-primary">{entry.entry_number}</TableCell>
                      <TableCell>{entry.date}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{entry.description}</TableCell>
                      <TableCell className="text-right font-mono font-bold">
                        ${totalDebit.toFixed(2)}
                      </TableCell>
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
                          <span className="text-sm font-medium">{creatorName}</span>
                          <span className="text-xs text-muted-foreground">{createdDate}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>


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
