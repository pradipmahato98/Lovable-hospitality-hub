import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, ArrowLeft, Save, Send, AlertCircle, History, CheckCircle2 } from "lucide-react";
import {
  useAccounts,
  useJournalEntry,
  useCreateJournalEntry,
  useUpdateJournalEntry,
  usePostJournalEntry
} from "@/hooks/useFinance";
import { useBusinessDate } from "@/hooks/useSettings";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";

interface JournalLineItem {
  id?: string;
  account_id: string;
  debit: number;
  credit: number;
  description: string;
}

export default function JournalEntryEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isQuickPost = new URLSearchParams(location.search).get("type") === "quick";

  const { data: accounts } = useAccounts();
  const { data: existingEntry, isLoading: isLoadingEntry } = useJournalEntry(id || null);
  const { data: businessDate } = useBusinessDate();

  const createMutation = useCreateJournalEntry();
  const updateMutation = useUpdateJournalEntry();
  const postMutation = usePostJournalEntry();

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [reference, setReference] = useState("");
  const [lines, setLines] = useState<JournalLineItem[]>([
    { account_id: "", debit: 0, credit: 0, description: "" },
    { account_id: "", debit: 0, credit: 0, description: "" },
  ]);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Initialize from existing entry
  useEffect(() => {
    if (existingEntry) {
      setDate(existingEntry.date);
      setDescription(existingEntry.description);
      setReference(existingEntry.reference || "");
      setLines(existingEntry.lines?.map(l => ({
        id: l.id,
        account_id: l.account_id,
        debit: l.debit,
        credit: l.credit,
        description: l.description || ""
      })) || [
        { account_id: "", debit: 0, credit: 0, description: "" },
        { account_id: "", debit: 0, credit: 0, description: "" },
      ]);
      setIsDirty(false);
    } else if (!id) {
      // Set business date for new entry
      if (businessDate) setDate(businessDate);

      // Load from localStorage if available
      const saved = localStorage.getItem("journal_entry_draft");
      if (saved && !isQuickPost) {
        try {
          const draft = JSON.parse(saved);
          setDate(draft.date || businessDate || new Date().toISOString().slice(0, 10));
          setDescription(draft.description || "");
          setReference(draft.reference || "");
          setLines(draft.lines || [
            { account_id: "", debit: 0, credit: 0, description: "" },
            { account_id: "", debit: 0, credit: 0, description: "" },
          ]);
        } catch (e) {
          console.error("Failed to parse draft", e);
        }
      }
    }
  }, [existingEntry, id, businessDate, isQuickPost]);

  // Handle Quick Post initialization
  useEffect(() => {
    if (isQuickPost && !id) {
      setDescription("Quick Transaction");
    }
  }, [isQuickPost, id]);

  // Auto-save to localStorage
  useEffect(() => {
    if (!id && !isQuickPost && isDirty) {
      const draft = { date, description, reference, lines };
      localStorage.setItem("journal_entry_draft", JSON.stringify(draft));
      setLastSaved(new Date());
    }
  }, [date, description, reference, lines, id, isQuickPost, isDirty]);

  // Prevent accidental closure
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const addLine = () => {
    setLines([...lines, { account_id: "", debit: 0, credit: 0, description: "" }]);
    setIsDirty(true);
  };

  const removeLine = (index: number) => {
    if (lines.length <= 2) {
      toast.error("A journal entry must have at least two lines");
      return;
    }
    const newLines = [...lines];
    newLines.splice(index, 1);
    setLines(newLines);
    setIsDirty(true);
  };

  const updateLine = (index: number, field: keyof JournalLineItem, value: any) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };

    // Auto-balance if it's the second line and first line has a value
    if (isQuickPost && lines.length === 2 && index === 0) {
       if (field === 'debit') newLines[1].credit = value;
       if (field === 'credit') newLines[1].debit = value;
    }

    setLines(newLines);
    setIsDirty(true);
  };

  const totalDebit = lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
  const difference = Math.abs(totalDebit - totalCredit);
  const isBalanced = difference < 0.01 && (totalDebit > 0 || totalCredit > 0);

  const handleSave = async (post = false) => {
    if (!description) {
      toast.error("Please enter a description");
      return;
    }

    const validLines = lines.filter(l => l.account_id && (l.debit > 0 || l.credit > 0));
    if (validLines.length < 2) {
      toast.error("Please add at least two valid lines (account and amount)");
      return;
    }

    if (!isBalanced) {
      toast.error(`Entry is not balanced. Difference: $${difference.toFixed(2)}`);
      return;
    }

    try {
      let entryId = id;
      if (id) {
        await updateMutation.mutateAsync({
          id,
          date,
          description,
          reference,
          lines: validLines
        });
        toast.success("Journal entry updated");
      } else {
        const entry = await createMutation.mutateAsync({
          date,
          description,
          reference,
          lines: validLines
        });
        entryId = entry.id;
        toast.success("Journal entry created");
        localStorage.removeItem("journal_entry_draft");
      }

      setIsDirty(false);

      if (post && entryId) {
        await postMutation.mutateAsync(entryId);
        toast.success("Journal entry posted to ledger");
        navigate("/finance?tab=transactions&service=journal-mgmt");
      } else if (!id) {
        // If it was a new entry and we just saved as draft, navigate to the edit page for it
        navigate(`/finance/journal/${entryId}`, { replace: true });
      }
    } catch (error) {
      toast.error("Failed to save journal entry");
    }
  };

  const handleBack = () => {
    if (isDirty) {
      setShowExitConfirm(true);
    } else {
      navigate("/finance?tab=transactions&service=journal-mgmt");
    }
  };

  if (id && isLoadingEntry) {
    return (
      <MainLayout title="Journal Entry Editor">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      title={id ? `Edit Journal Entry: ${existingEntry?.entry_number}` : (isQuickPost ? "Quick Post" : "New Journal Entry")}
      subtitle={id ? "Modify existing draft entry" : "Create a new accounting transaction"}
      actions={
        <div className="flex items-center gap-2">
          {lastSaved && !isDirty && (
            <span className="text-xs text-muted-foreground flex items-center gap-1 mr-2">
              <CheckCircle2 className="h-3 w-3 text-success" />
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
          {isDirty && (
            <span className="text-xs text-amber-500 flex items-center gap-1 mr-2">
              <History className="h-3 w-3" />
              Unsaved changes
            </span>
          )}
          <Button variant="outline" onClick={handleBack}>
            Cancel
          </Button>
          {!existingEntry?.is_posted && (
            <>
              <Button variant="outline" onClick={() => handleSave(false)} disabled={updateMutation.isPending || createMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              <Button onClick={() => handleSave(true)} disabled={updateMutation.isPending || createMutation.isPending || postMutation.isPending || !isBalanced}>
                <Send className="h-4 w-4 mr-2" />
                Post Entry
              </Button>
            </>
          )}
        </div>
      }
    >
      <div className="max-w-5xl mx-auto space-y-6 pb-20">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Button variant="link" className="p-0 h-auto text-muted-foreground hover:text-primary" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Journal Register
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Transaction Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => { setDate(e.target.value); setIsDirty(true); }}
                    disabled={existingEntry?.is_posted}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reference">Reference (Optional)</Label>
                  <Input
                    id="reference"
                    placeholder="Invoice #, Receipt #, etc."
                    value={reference}
                    onChange={(e) => { setReference(e.target.value); setIsDirty(true); }}
                    disabled={existingEntry?.is_posted}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="What is this transaction for?"
                  value={description}
                  onChange={(e) => { setDescription(e.target.value); setIsDirty(true); }}
                  disabled={existingEntry?.is_posted}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status & Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Status</span>
                <Badge variant={existingEntry?.is_posted ? "default" : "secondary"}>
                  {existingEntry?.is_posted ? "Posted" : "Draft"}
                </Badge>
              </div>
              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Debit</span>
                  <span className="font-mono font-bold">${totalDebit.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Credit</span>
                  <span className="font-mono font-bold">${totalCredit.toFixed(2)}</span>
                </div>
                <div className={cn(
                  "flex justify-between text-sm pt-2 border-t font-bold",
                  isBalanced ? "text-success" : "text-destructive"
                )}>
                  <span>Difference</span>
                  <span className="font-mono">${difference.toFixed(2)}</span>
                </div>
              </div>
              {!isBalanced && totalDebit > 0 && totalCredit > 0 && (
                <div className="p-3 bg-destructive/10 text-destructive rounded-md text-xs flex gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Entry must be balanced (Debit = Credit) before it can be posted.</span>
                </div>
              )}
              {isBalanced && (
                <div className="p-3 bg-success/10 text-success rounded-md text-xs flex gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Entry is balanced and ready to be saved or posted.</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Journal Lines</CardTitle>
              <CardDescription>Enter the debit and credit accounts for this transaction</CardDescription>
            </div>
            {!existingEntry?.is_posted && (
              <Button variant="outline" size="sm" onClick={addLine}>
                <Plus className="h-4 w-4 mr-2" />
                Add Line
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Account</TableHead>
                  <TableHead>Description (Optional)</TableHead>
                  <TableHead className="w-[15%] text-right">Debit</TableHead>
                  <TableHead className="w-[15%] text-right">Credit</TableHead>
                  {!existingEntry?.is_posted && <TableHead className="w-[50px]"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((line, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Select
                        value={line.account_id}
                        onValueChange={(v) => updateLine(index, "account_id", v)}
                        disabled={existingEntry?.is_posted}
                      >
                        <SelectTrigger className="w-full">
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
                    </TableCell>
                    <TableCell>
                      <Input
                        placeholder="Line description"
                        value={line.description}
                        onChange={(e) => updateLine(index, "description", e.target.value)}
                        disabled={existingEntry?.is_posted}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        className="text-right font-mono"
                        placeholder="0.00"
                        value={line.debit || ""}
                        onChange={(e) => updateLine(index, "debit", parseFloat(e.target.value) || 0)}
                        disabled={existingEntry?.is_posted}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        className="text-right font-mono"
                        placeholder="0.00"
                        value={line.credit || ""}
                        onChange={(e) => updateLine(index, "credit", parseFloat(e.target.value) || 0)}
                        disabled={existingEntry?.is_posted}
                      />
                    </TableCell>
                    {!existingEntry?.is_posted && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => removeLine(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes in this journal entry. Are you sure you want to leave?
              Your changes will be saved as a draft in your browser.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay on Page</AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate("/finance?tab=transactions&service=journal-mgmt")}>
              Leave Page
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
