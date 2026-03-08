import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus, Pencil, Trash2, Save, FilePlus, Paperclip, Eye, X, Lock, ShieldCheck, Search, Check, Send,
} from "lucide-react";
import {
  useJournalEntries, useCreateJournalEntry, usePostJournalEntry, useAccounts, JournalEntry,
} from "@/hooks/useFinance";
import { toast } from "sonner";
import { useBusinessDate } from "@/hooks/useSettings";
import { NepaliDateInput, NepaliDateSearch } from "@/components/shared/NepaliDateInput";
import { formatISOasBS, adToBS, todayBS, formatBSDate } from "@/lib/nepaliDate";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────
type VoucherType = "journal" | "receipt" | "payment" | "contra";

const VOUCHER_PREFIXES: Record<VoucherType, string> = {
  journal: "JV",
  receipt: "RV",
  payment: "PV",
  contra: "CV",
};

const VOUCHER_LABELS: Record<VoucherType, string> = {
  journal: "Journal Voucher",
  receipt: "Receipt Voucher",
  payment: "Payment Voucher",
  contra: "Contra Voucher",
};

interface EntryLine {
  id: string;
  account_id: string;
  sub_account: string;
  debit: number;
  credit: number;
  remarks: string;
}

function generateId() {
  return crypto.randomUUID?.() || Math.random().toString(36).slice(2);
}

// ─── Nepali Fiscal Year helper ───────────────────────────────────────────────
function getNepaliFiscalYears() {
  const current = todayBS();
  const years: string[] = [];
  for (let y = current.year - 2; y <= current.year + 1; y++) {
    years.push(`${y}/${(y + 1).toString().slice(-2)}`);
  }
  return years;
}

function getCurrentNepaliFiscalYear() {
  const bs = todayBS();
  // Nepali FY runs Shrawan (month 4) to Ashar (month 3)
  if (bs.month >= 4) return `${bs.year}/${(bs.year + 1).toString().slice(-2)}`;
  return `${bs.year - 1}/${bs.year.toString().slice(-2)}`;
}

function generateVoucherNo(voucherType: VoucherType, fiscalYear: string) {
  const prefix = VOUCHER_PREFIXES[voucherType];
  const fyShort = fiscalYear.replace("/", "-");
  const seq = String(Math.floor(Math.random() * 9999) + 1).padStart(4, "0");
  return `${prefix}-${fyShort}-${seq}`;
}

// ─── Props ───────────────────────────────────────────────────────────────────
interface JournalManagementServiceProps {
  isReadOnly?: boolean;
}

// ─── Main Component ──────────────────────────────────────────────────────────
export function JournalManagementService({ isReadOnly }: JournalManagementServiceProps) {
  // ── Header State ──
  const [fiscalYear, setFiscalYear] = useState(getCurrentNepaliFiscalYear());
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().slice(0, 10));
  const [voucherType, setVoucherType] = useState<VoucherType | "">("");
  const [voucherNo, setVoucherNo] = useState("");

  // ── Entry Lines ──
  const [lines, setLines] = useState<EntryLine[]>([]);
  const [editingLineId, setEditingLineId] = useState<string | null>(null);

  // ── New Line Input ──
  const [newLine, setNewLine] = useState<Omit<EntryLine, "id">>({
    account_id: "", sub_account: "", debit: 0, credit: 0, remarks: "",
  });

  // ── Narration & Attachment ──
  const [narration, setNarration] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Register View ──
  const [showRegister, setShowRegister] = useState(true);
  const [dateFilter, setDateFilter] = useState<{ from: string; to: string } | null>(null);
  const [searchText, setSearchText] = useState("");

  // ── Hooks ──
  const { data: journalEntries, isLoading } = useJournalEntries();
  const { data: accounts } = useAccounts();
  const createJournalEntry = useCreateJournalEntry();
  const postJournalEntry = usePostJournalEntry();
  const { data: businessDate } = useBusinessDate();

  // ── Derived ──
  const isHeaderComplete = !!transactionDate && !!voucherType;
  const totalDebit = lines.reduce((s, l) => s + l.debit, 0);
  const totalCredit = lines.reduce((s, l) => s + l.credit, 0);
  const isBalanced = lines.length >= 2 && Math.abs(totalDebit - totalCredit) < 0.01;

  // Generate voucher no when type or FY changes
  useEffect(() => {
    if (voucherType) {
      setVoucherNo(generateVoucherNo(voucherType as VoucherType, fiscalYear));
    }
  }, [voucherType, fiscalYear]);

  // ── Auto-match: when adding an entry, if previous entries exist, auto-fill debit/credit ──
  const getAutoAmount = useCallback(() => {
    if (lines.length === 0) return { debit: 0, credit: 0 };
    const diff = totalDebit - totalCredit;
    if (diff > 0) return { debit: 0, credit: diff };
    if (diff < 0) return { debit: Math.abs(diff), credit: 0 };
    return { debit: 0, credit: 0 };
  }, [lines, totalDebit, totalCredit]);

  // ── Add Line ──
  const handleAddLine = () => {
    if (!newLine.account_id) { toast.error("Please select a Ledger Account"); return; }
    if (newLine.debit === 0 && newLine.credit === 0) { toast.error("Enter Debit or Credit amount"); return; }
    if (newLine.debit > 0 && newLine.credit > 0) { toast.error("A line cannot have both Debit and Credit"); return; }

    const line: EntryLine = { ...newLine, id: generateId() };
    setLines(prev => [...prev, line]);

    // Auto-fill next line amounts
    const nextAuto = getAutoAmount();
    setNewLine({ account_id: "", sub_account: "", debit: 0, credit: 0, remarks: "" });
    // After state update, recalculate
    setTimeout(() => {
      const newTotal = [...lines, line];
      const d = newTotal.reduce((s, l) => s + l.debit, 0);
      const c = newTotal.reduce((s, l) => s + l.credit, 0);
      const diff = d - c;
      if (diff > 0) setNewLine(p => ({ ...p, credit: parseFloat(diff.toFixed(2)) }));
      else if (diff < 0) setNewLine(p => ({ ...p, debit: parseFloat(Math.abs(diff).toFixed(2)) }));
    }, 0);
  };

  // ── Edit / Delete Lines ──
  const handleDeleteLine = (id: string) => {
    setLines(prev => prev.filter(l => l.id !== id));
    toast.success("Line removed");
  };

  const handleEditLine = (line: EntryLine) => {
    setEditingLineId(line.id);
    setNewLine({ account_id: line.account_id, sub_account: line.sub_account, debit: line.debit, credit: line.credit, remarks: line.remarks });
    setLines(prev => prev.filter(l => l.id !== line.id));
  };

  // ── Save ──
  const handleSave = async (andNew: boolean) => {
    if (!narration.trim()) { toast.error("Narration is mandatory"); return; }
    if (lines.length < 2) { toast.error("At least two entry lines required"); return; }
    if (!isBalanced) { toast.error("Debit and Credit must be equal"); return; }

    try {
      const entry = await createJournalEntry.mutateAsync({
        date: transactionDate,
        description: narration,
        reference: voucherNo || null,
        lines: lines.map(l => ({
          account_id: l.account_id,
          debit: l.debit,
          credit: l.credit,
          description: l.remarks || null,
        })),
      });
      // Auto-post
      await postJournalEntry.mutateAsync(entry.id);
      toast.success(`${VOUCHER_LABELS[voucherType as VoucherType] || "Entry"} saved & posted — ${voucherNo}`);

      if (andNew) {
        // Reset for new entry
        setLines([]);
        setNarration("");
        setAttachment(null);
        setAttachmentPreview(null);
        setVoucherNo(generateVoucherNo(voucherType as VoucherType, fiscalYear));
        setNewLine({ account_id: "", sub_account: "", debit: 0, credit: 0, remarks: "" });
      } else {
        // Full reset
        setLines([]);
        setNarration("");
        setAttachment(null);
        setAttachmentPreview(null);
        setVoucherType("");
        setVoucherNo("");
        setNewLine({ account_id: "", sub_account: "", debit: 0, credit: 0, remarks: "" });
      }
    } catch {
      toast.error("Failed to save entry");
    }
  };

  // ── Keyboard shortcut Cmd+S ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  // ── Attachment ──
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      toast.error("File must be under 1 MB");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.type)) {
      toast.error("Only JPG, PNG, WEBP or PDF allowed");
      return;
    }
    setAttachment(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => setAttachmentPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setAttachmentPreview(null);
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
    setAttachmentPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Filtered Register ──
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

  const getAccountName = (id: string) => {
    const acc = accounts?.find(a => a.id === id);
    return acc ? `${acc.code} - ${acc.name}` : id;
  };

  // ─── Tab state ─────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<"new" | "register">("new");

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Page Header with Tab Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold font-display">Journal & Voucher Entry</h2>
          <p className="text-muted-foreground text-sm">Create journal, receipt, payment & contra vouchers</p>
        </div>
        <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
          <Button
            variant={activeTab === "new" ? "default" : "ghost"}
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => setActiveTab("new")}
          >
            <FilePlus className="h-3.5 w-3.5" /> New Journal Entries
          </Button>
          <Button
            variant={activeTab === "register" ? "default" : "ghost"}
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => setActiveTab("register")}
          >
            <BookOpen className="h-3.5 w-3.5" /> Journal Register
          </Button>
        </div>
      </div>

      {activeTab === "new" && (
      <>
      {/* ═══ CARD 1: Voucher Header ═══ */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Voucher Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Fiscal Year */}
            <div className="space-y-1.5">
              <Label className="text-xs">Fiscal Year *</Label>
              <Select value={fiscalYear} onValueChange={setFiscalYear}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {getNepaliFiscalYears().map(fy => (
                    <SelectItem key={fy} value={fy}>{fy} BS</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Transaction Date AD */}
            <div className="space-y-1.5">
              <Label className="text-xs">Transaction AD *</Label>
              <Input
                type="date"
                value={transactionDate}
                onChange={e => setTransactionDate(e.target.value)}
                className="h-9 text-sm"
                disabled={isReadOnly}
              />
            </div>

            {/* Nepali Miti BS */}
            <div className="space-y-1.5">
              <NepaliDateInput
                label="नेपाली मिति *"
                value={transactionDate}
                onChange={setTransactionDate}
                showDual={false}
                disabled={isReadOnly}
              />
            </div>

            {/* Voucher Type */}
            <div className="space-y-1.5">
              <Label className="text-xs">Voucher Type *</Label>
              <Select value={voucherType} onValueChange={(v) => setVoucherType(v as VoucherType)} disabled={isReadOnly}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(VOUCHER_LABELS) as VoucherType[]).map(vt => (
                    <SelectItem key={vt} value={vt}>{VOUCHER_LABELS[vt]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Voucher No */}
            <div className="space-y-1.5">
              <Label className="text-xs">Voucher No</Label>
              <Input
                value={voucherNo}
                readOnly
                className="h-9 text-sm bg-muted/50 font-mono"
                placeholder="Auto-generated"
              />
            </div>
          </div>

          {/* Locked state message */}
          {!isHeaderComplete && (
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-md p-2">
              <Lock className="h-3.5 w-3.5" />
              Select a date and voucher type to unlock the entry box below.
            </div>
          )}

          {/* ── Inline Entry Row (unlocked only when header complete) ── */}
          {isHeaderComplete && !isReadOnly && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 font-medium">Add Entry Line</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2 items-end">
                <div className="lg:col-span-2 space-y-1">
                  <Label className="text-[10px]">Ledger Account *</Label>
                  <Select value={newLine.account_id} onValueChange={v => setNewLine(p => ({ ...p, account_id: v }))}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select account" /></SelectTrigger>
                    <SelectContent>
                      {accounts?.map(acc => (
                        <SelectItem key={acc.id} value={acc.id} className="text-xs">{acc.code} - {acc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Sub Account</Label>
                  <Input
                    placeholder="Sub acct"
                    value={newLine.sub_account}
                    onChange={e => setNewLine(p => ({ ...p, sub_account: e.target.value }))}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Debit</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={newLine.debit || ""}
                    onChange={e => setNewLine(p => ({ ...p, debit: parseFloat(e.target.value) || 0, credit: parseFloat(e.target.value) ? 0 : p.credit }))}
                    className="h-9 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Credit</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={newLine.credit || ""}
                    onChange={e => setNewLine(p => ({ ...p, credit: parseFloat(e.target.value) || 0, debit: parseFloat(e.target.value) ? 0 : p.debit }))}
                    className="h-9 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Remarks</Label>
                  <div className="flex gap-1">
                    <Input
                      placeholder="Note"
                      value={newLine.remarks}
                      onChange={e => setNewLine(p => ({ ...p, remarks: e.target.value }))}
                      className="h-9 text-xs"
                    />
                    <Button size="sm" className="h-9 px-3 shrink-0" onClick={handleAddLine}>
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══ CARD 2: Entries Table ═══ */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            Entries
            {lines.length > 0 && (
              <Badge variant="secondary" className="text-xs">{lines.length} line{lines.length > 1 ? "s" : ""}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {lines.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              {isHeaderComplete ? "No entries yet — add lines above" : "Complete the voucher header to start adding entries"}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">Action</TableHead>
                      <TableHead>Ledger Account</TableHead>
                      <TableHead>Sub Account</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Credit</TableHead>
                      <TableHead>Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence mode="popLayout">
                      {lines.map((line, idx) => (
                        <motion.tr
                          key={line.id}
                          initial={{ opacity: 0, y: -20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 20 }}
                          transition={{ duration: 0.25, ease: "easeOut" }}
                          className="border-b transition-colors hover:bg-muted/50"
                        >
                          <TableCell className="p-2">
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditLine(line)}>
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDeleteLine(line.id)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs font-medium">{getAccountName(line.account_id)}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{line.sub_account || "—"}</TableCell>
                          <TableCell className="text-right font-mono text-xs">
                            {line.debit > 0 ? line.debit.toFixed(2) : "—"}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs">
                            {line.credit > 0 ? line.credit.toFixed(2) : "—"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{line.remarks || "—"}</TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>

              {/* Totals Row */}
              <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20">
                <span className="text-xs font-medium text-muted-foreground">Totals</span>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <span className="text-[10px] text-muted-foreground block">Debit</span>
                    <span className="font-mono text-sm font-semibold">{totalDebit.toFixed(2)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-muted-foreground block">Credit</span>
                    <span className="font-mono text-sm font-semibold">{totalCredit.toFixed(2)}</span>
                  </div>
                  <Badge variant={isBalanced ? "default" : "destructive"} className="text-xs">
                    {isBalanced ? "✓ Balanced" : `Diff: ${Math.abs(totalDebit - totalCredit).toFixed(2)}`}
                  </Badge>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ═══ CARD 3: Narration, Attachment & Save ═══ */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          {/* Narration */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Narration *</Label>
            <Textarea
              placeholder="What is this entry for? (mandatory)"
              value={narration}
              onChange={e => setNarration(e.target.value)}
              rows={3}
              className="text-sm resize-none"
              disabled={isReadOnly}
            />
          </div>

          {/* Attachment */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Attachment (max 1 MB — JPG, PNG, PDF)</Label>
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                className="hidden"
                onChange={handleFileChange}
              />
              {!attachment ? (
                <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={() => fileInputRef.current?.click()} disabled={isReadOnly}>
                  <Paperclip className="h-3.5 w-3.5" /> Attach File
                </Button>
              ) : (
                <div className="flex items-center gap-2 bg-muted/50 rounded-md px-3 py-2 text-xs">
                  <Paperclip className="h-3.5 w-3.5 text-primary" />
                  <span className="truncate max-w-[200px]">{attachment.name}</span>
                  <span className="text-muted-foreground">({(attachment.size / 1024).toFixed(0)} KB)</span>
                  {(attachmentPreview || attachment.type === "application/pdf") && (
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setPreviewOpen(true)}>
                      <Eye className="h-3 w-3" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={removeAttachment}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Save Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t">
            <Button
              variant="outline"
              className="gap-2 flex-1 sm:flex-none"
              onClick={() => handleSave(true)}
              disabled={isReadOnly || createJournalEntry.isPending || !isHeaderComplete}
            >
              <FilePlus className="h-4 w-4" />
              Save & New
            </Button>
            <Button
              className="gap-2 flex-1 sm:flex-none"
              onClick={() => handleSave(false)}
              disabled={isReadOnly || createJournalEntry.isPending || !isHeaderComplete}
            >
              <Save className="h-4 w-4" />
              {createJournalEntry.isPending ? "Saving..." : "Save"}
              <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground ml-1">
                ⌘S
              </kbd>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ═══ Attachment Preview Dialog ═══ */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Attachment Preview</DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-auto">
            {attachmentPreview ? (
              <img src={attachmentPreview} alt="Attachment" className="w-full rounded-md" />
            ) : attachment?.type === "application/pdf" ? (
              <div className="flex flex-col items-center gap-3 py-8 text-muted-foreground">
                <Paperclip className="h-10 w-10" />
                <p className="text-sm">PDF file: {attachment.name}</p>
                <Button variant="outline" size="sm" onClick={() => {
                  const url = URL.createObjectURL(attachment);
                  window.open(url, "_blank");
                }}>
                  Open in New Tab
                </Button>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
      </>
      )}

      {activeTab === "register" && (
      {/* ═══ Journal Register (existing entries) ═══ */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="text-base">Journal Register</CardTitle>
            <div className="flex gap-2 items-center flex-wrap">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search entries..."
                  value={searchText}
                  onChange={e => setSearchText(e.target.value)}
                  className="pl-8 h-9 text-sm w-[200px]"
                />
              </div>
              <NepaliDateSearch onSearch={(from, to) => setDateFilter({ from, to })} />
              {dateFilter && (
                <Button variant="ghost" size="sm" className="h-9 text-xs" onClick={() => setDateFilter(null)}>Clear</Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>
          ) : filteredEntries.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No entries found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Voucher #</TableHead>
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
                  {filteredEntries.map(entry => {
                    const d = entry.lines?.reduce((s: number, l: any) => s + (l.debit || 0), 0) || 0;
                    const c = entry.lines?.reduce((s: number, l: any) => s + (l.credit || 0), 0) || 0;
                    return (
                      <TableRow key={entry.id}>
                        <TableCell className="font-mono text-xs text-primary">{entry.reference || entry.entry_number}</TableCell>
                        <TableCell className="text-xs">{entry.date}</TableCell>
                        <TableCell className="text-xs text-primary font-medium">{formatISOasBS(entry.date, "long")}</TableCell>
                        <TableCell className="text-xs">{entry.description}</TableCell>
                        <TableCell className="text-right font-mono text-xs">{d.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-mono text-xs">{c.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("text-[10px]", entry.is_posted ? "bg-success/20 text-success" : "bg-amber-500/20 text-amber-600")}>
                            {entry.is_posted ? "Posted" : "Draft"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {!entry.is_posted && !isReadOnly && (
                            <Button variant="ghost" size="sm" className="text-xs" onClick={() => postJournalEntry.mutateAsync(entry.id).then(() => toast.success("Posted"))}>
                              <Check className="h-3 w-3 mr-1" /> Post
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
      )}
    </div>
  );
}
