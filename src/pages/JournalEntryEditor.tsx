import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, ArrowLeft, Save, Send, AlertCircle, History, CheckCircle2, MoreVertical, Calculator } from "lucide-react";
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
import { SpringTransition } from "@/components/ui/ios/SpringTransition";
import { SegmentedControl } from "@/components/ui/ios/SegmentedControl";
import { AnimatePresence, motion } from "framer-motion";

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
  const queryParams = new URLSearchParams(location.search);
  const initialType = queryParams.get("type") === "quick" ? "quick" : "standard";

  const { data: accounts } = useAccounts();
  const { data: existingEntry, isLoading: isLoadingEntry } = useJournalEntry(id || null);
  const { data: businessDate } = useBusinessDate();

  const createMutation = useCreateJournalEntry();
  const updateMutation = useUpdateJournalEntry();
  const postMutation = usePostJournalEntry();

  const [entryType, setEntryType] = useState<"standard" | "quick">(initialType);
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
      if (businessDate) setDate(businessDate);

      const saved = localStorage.getItem("journal_entry_draft");
      if (saved && entryType === "standard") {
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
  }, [existingEntry, id, businessDate, entryType]);

  useEffect(() => {
    if (entryType === "quick" && !id && !description) {
      setDescription("Quick Transaction");
    }
  }, [entryType, id, description]);

  // Auto-save to localStorage
  useEffect(() => {
    if (!id && entryType === "standard" && isDirty) {
      const draft = { date, description, reference, lines };
      localStorage.setItem("journal_entry_draft", JSON.stringify(draft));
      setLastSaved(new Date());
    }
  }, [date, description, reference, lines, id, entryType, isDirty]);

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

    // Auto-balance if it's quick mode and we have exactly 2 lines
    if (entryType === "quick" && lines.length === 2) {
       const otherIndex = index === 0 ? 1 : 0;
       if (field === 'debit') newLines[otherIndex].credit = value;
       if (field === 'credit') newLines[otherIndex].debit = value;
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
      toast.error("Please add at least two valid lines");
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
      title={id ? `Journal Entry ${existingEntry?.entry_number}` : "Modern Journal Registry"}
      subtitle={id ? "Review and finalize transaction" : "Dynamic entry creation with auto-balance"}
      actions={
        <div className="flex items-center gap-2">
          {lastSaved && !isDirty && (
            <span className="text-xs text-muted-foreground flex items-center gap-1 mr-2 bg-success/5 px-2 py-1 rounded-full border border-success/10">
              <CheckCircle2 className="h-3 w-3 text-success" />
              Synced {lastSaved.toLocaleTimeString()}
            </span>
          )}
          <Button variant="outline" className="ios-material h-9" onClick={handleBack}>
            Cancel
          </Button>
          {!existingEntry?.is_posted && (
            <>
              <Button variant="outline" className="ios-material h-9" onClick={() => handleSave(false)} disabled={updateMutation.isPending || createMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                Draft
              </Button>
              <Button className="h-9 shadow-glow" onClick={() => handleSave(true)} disabled={updateMutation.isPending || createMutation.isPending || postMutation.isPending || !isBalanced}>
                <Send className="h-4 w-4 mr-2" />
                Post
              </Button>
            </>
          )}
        </div>
      }
    >
      <SpringTransition type="slide" className="max-w-6xl mx-auto space-y-8 pb-32">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <Button variant="link" className="p-0 h-auto text-muted-foreground hover:text-primary transition-colors flex items-center" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Return to Ledger
          </Button>

          {!id && (
            <SegmentedControl
              options={[
                { label: "Standard Entry", value: "standard" },
                { label: "Quick Balance", value: "quick" }
              ]}
              value={entryType}
              onChange={(v) => setEntryType(v as any)}
              className="w-full md:w-80"
            />
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-8">
            {/* Header Card */}
            <Card className="ios-material border-none overflow-hidden">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Transaction Date</Label>
                    <Input
                      type="date"
                      value={date}
                      onChange={(e) => { setDate(e.target.value); setIsDirty(true); }}
                      disabled={existingEntry?.is_posted}
                      className="bg-background/50 border-none focus-visible:ring-1 focus-visible:ring-primary h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Reference ID</Label>
                    <Input
                      placeholder="e.g. INV-2024-001"
                      value={reference}
                      onChange={(e) => { setReference(e.target.value); setIsDirty(true); }}
                      disabled={existingEntry?.is_posted}
                      className="bg-background/50 border-none focus-visible:ring-1 focus-visible:ring-primary h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Category</Label>
                    <Badge variant="outline" className="w-full h-11 justify-center text-sm font-normal bg-background/30 border-dashed border-muted-foreground/30">
                      Accounting / {entryType === 'quick' ? 'Direct Entry' : 'Standard Journal'}
                    </Badge>
                  </div>
                </div>
                <div className="mt-6 space-y-2">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Narration / Description</Label>
                  <Input
                    placeholder="Provide a detailed description of the transaction..."
                    value={description}
                    onChange={(e) => { setDescription(e.target.value); setIsDirty(true); }}
                    disabled={existingEntry?.is_posted}
                    className="bg-background/50 border-none focus-visible:ring-1 focus-visible:ring-primary h-12 text-lg"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Line Items - Modern List Style */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-xl">Journal Entries</h3>
                  <Badge className="bg-primary/10 text-primary border-none">{lines.length} lines</Badge>
                </div>
                {!existingEntry?.is_posted && (
                  <Button variant="outline" size="sm" onClick={addLine} className="ios-material rounded-full h-8 px-4 border-dashed hover:border-solid hover:bg-primary/5">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Entry
                  </Button>
                )}
              </div>

              <AnimatePresence mode="popLayout">
                <div className="space-y-3">
                  {lines.map((line, index) => (
                    <motion.div
                      key={index}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={cn(
                        "ios-material rounded-2xl p-4 transition-all border-l-4",
                        line.debit > 0 ? "border-l-success/50" : (line.credit > 0 ? "border-l-primary/50" : "border-l-muted")
                      )}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                        <div className="md:col-span-4 space-y-1">
                          <Label className="text-[10px] text-muted-foreground uppercase font-bold">Ledger Account</Label>
                          <Select
                            value={line.account_id}
                            onValueChange={(v) => updateLine(index, "account_id", v)}
                            disabled={existingEntry?.is_posted}
                          >
                            <SelectTrigger className="bg-background/40 border-none h-10">
                              <SelectValue placeholder="Select account..." />
                            </SelectTrigger>
                            <SelectContent className="ios-material-elevated border-none">
                              {accounts?.map((acc) => (
                                <SelectItem key={acc.id} value={acc.id} className="focus:bg-primary/10 focus:text-primary">
                                  <div className="flex flex-col">
                                    <span className="font-medium">{acc.name}</span>
                                    <span className="text-[10px] text-muted-foreground">{acc.code} • {acc.type}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="md:col-span-3 space-y-1">
                          <Label className="text-[10px] text-muted-foreground uppercase font-bold">Line Note</Label>
                          <Input
                            placeholder="Line details..."
                            value={line.description}
                            onChange={(e) => updateLine(index, "description", e.target.value)}
                            disabled={existingEntry?.is_posted}
                            className="bg-background/40 border-none h-10"
                          />
                        </div>
                        <div className="md:col-span-2 space-y-1">
                          <Label className="text-[10px] text-muted-foreground uppercase font-bold text-right block">Debit</Label>
                          <div className="relative">
                            <Input
                              type="number"
                              className="bg-background/40 border-none h-10 text-right pr-7 font-mono font-bold"
                              placeholder="0.00"
                              value={line.debit || ""}
                              onChange={(e) => updateLine(index, "debit", parseFloat(e.target.value) || 0)}
                              disabled={existingEntry?.is_posted}
                            />
                            <span className="absolute right-2 top-2.5 text-[10px] text-muted-foreground">$</span>
                          </div>
                        </div>
                        <div className="md:col-span-2 space-y-1">
                          <Label className="text-[10px] text-muted-foreground uppercase font-bold text-right block">Credit</Label>
                          <div className="relative">
                            <Input
                              type="number"
                              className="bg-background/40 border-none h-10 text-right pr-7 font-mono font-bold"
                              placeholder="0.00"
                              value={line.credit || ""}
                              onChange={(e) => updateLine(index, "credit", parseFloat(e.target.value) || 0)}
                              disabled={existingEntry?.is_posted}
                            />
                            <span className="absolute right-2 top-2.5 text-[10px] text-muted-foreground">$</span>
                          </div>
                        </div>
                        <div className="md:col-span-1 flex justify-end">
                          {!existingEntry?.is_posted && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-full"
                              onClick={() => removeLine(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
            </div>
          </div>

          {/* Sidebar Summary */}
          <div className="space-y-6">
            <Card className="ios-material-elevated border-none sticky top-24 shadow-elevated">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between mb-2">
                   <div className="p-2 bg-primary/10 rounded-xl text-primary">
                    <Calculator className="h-5 w-5" />
                   </div>
                   <Badge variant={existingEntry?.is_posted ? "default" : "secondary"} className="rounded-full">
                    {existingEntry?.is_posted ? "Posted" : "Draft"}
                   </Badge>
                </div>
                <CardTitle className="text-xl">Transaction Summary</CardTitle>
                <CardDescription>Real-time audit calculation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4 pt-4 border-t border-muted-foreground/10">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground font-medium">Total Assets (Dr)</span>
                    <span className="font-mono font-bold text-lg">${totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground font-medium">Total Claims (Cr)</span>
                    <span className="font-mono font-bold text-lg">${totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>

                  <div className={cn(
                    "flex flex-col gap-2 p-4 rounded-2xl transition-colors mt-6",
                    isBalanced ? "bg-success/5 border border-success/10" : "bg-destructive/5 border border-destructive/10"
                  )}>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold uppercase tracking-widest opacity-70">Variance</span>
                      <span className={cn("font-mono font-black text-xl", isBalanced ? "text-success" : "text-destructive")}>
                        ${difference.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      {isBalanced ? (
                        <>
                          <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                          <span className="text-[10px] text-success font-bold uppercase">Perfectly Balanced</span>
                        </>
                      ) : (
                        <>
                          <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                          <span className="text-[10px] text-destructive font-bold uppercase">Imbalance Detected</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {!isBalanced && (totalDebit > 0 || totalCredit > 0) && (
                  <div className="p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10 space-y-2">
                    <div className="flex items-center gap-2 text-amber-500">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-[10px] font-black uppercase">Validation Error</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      Journal entries must adhere to the double-entry system. Ensure total debits equal total credits to proceed with posting.
                    </p>
                  </div>
                )}

                {isDirty && (
                  <div className="flex items-center justify-center gap-2 py-2">
                    <History className="h-3 w-3 text-amber-500 animate-spin-slow" />
                    <span className="text-[10px] text-amber-500 font-bold uppercase tracking-tight">Unsaved Draft on Local Storage</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </SpringTransition>

      <AlertDialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <AlertDialogContent className="ios-material-elevated border-none max-w-sm rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center text-xl font-display">Abandon Entry?</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-sm leading-relaxed">
              Your modifications are temporarily stored. Navigating away will retain the browser draft, but changes won't be synced to the ledger server.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:flex-col gap-2 mt-4">
            <AlertDialogAction onClick={() => navigate("/finance?tab=transactions&service=journal-mgmt")} className="w-full rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Confirm & Exit
            </AlertDialogAction>
            <AlertDialogCancel className="w-full rounded-full ios-material border-none mt-0">
              Continue Editing
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
