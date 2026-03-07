import React, { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  MoreHorizontal,
  PlusCircle,
  Upload,
  FileText,
  X,
  Eye,
  Download,
  Globe,
  RefreshCw,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  useAccounts,
  useCreateJournalEntry,
  useJournalEntries,
} from "@/hooks/useFinance";
import { useSuppliers } from "@/hooks/useInventory";
import { useGuests } from "@/hooks/useGuests";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  adToBs,
  bsToAd,
  formatBsDate,
  getFiscalYear,
  getFiscalYearRange,
  parseBsDate,
  formatAdDate,
  parseAdDate
} from "@/utils/nepaliDate";
import { NepaliCalendar } from "@/components/ui/nepali-calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { useUIPreferences } from "@/hooks/useSettings";
import { api } from "@/lib/api-bridge";

interface JournalLine {
  id: string;
  sub_ledger_type: "none" | "vendor" | "customer";
  sub_ledger_id: string;
  account_id: string;
  debit: number;
  credit: number;
  remarks: string;
  currency: string;
  exchange_rate: number;
  base_debit: number;
  base_credit: number;
}

interface JournalEntryEditorProps {
  onClose: () => void;
}

const VOUCHER_TYPES = [
  { label: "Journal Voucher", value: "JV" },
  { label: "Payment Voucher", value: "PV" },
  { label: "Receipt Voucher", value: "RV" },
  { label: "Contra Voucher", value: "CV" },
];

const CURRENCIES = [
  { code: "USD", symbol: "$", rate: 1 },
  { code: "NPR", symbol: "Rs", rate: 133.5 },
  { code: "EUR", symbol: "€", rate: 0.92 },
  { code: "GBP", symbol: "£", rate: 0.79 },
  { code: "INR", symbol: "₹", rate: 83.3 },
];

export function JournalEntryEditor({ onClose }: JournalEntryEditorProps) {
  const [attachments, setAttachments] = useState<File[]>([]);
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string; type: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      if (file.size > 2 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 2MB limit`);
        return false;
      }
      return true;
    });
    setAttachments(prev => [...prev, ...validFiles]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handlePreview = (file: File) => {
    const url = URL.createObjectURL(file);
    setPreviewFile({ url, name: file.name, type: file.type });
  };

  const handleDownload = (file: File) => {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const { data: accounts } = useAccounts();
  const { data: entries } = useJournalEntries();
  const { data: suppliers } = useSuppliers();
  const { data: guests } = useGuests();
  const createJournalEntry = useCreateJournalEntry();
  const { data: uiPrefs } = useUIPreferences();
  const separator = uiPrefs?.date_separator || "/";

  const [fiscalYear, setFiscalYear] = useState(getFiscalYear(new Date()));
  const [dateAD, setDateAD] = useState(new Date());
  const [dateADInput, setDateADInput] = useState(formatAdDate(new Date(), separator));
  const [mitiBS, setMitiBS] = useState(formatBsDate(adToBs(new Date()), separator));

  useEffect(() => {
    setDateADInput(formatAdDate(dateAD, separator));
    setMitiBS(formatBsDate(adToBs(dateAD), separator));
  }, [separator]);

  const [voucherType, setVoucherType] = useState<string>("");
  const [voucherNo, setVoucherNo] = useState("");
  const [narration, setNarration] = useState("");
  const [lines, setLines] = useState<JournalLine[]>([
    { id: crypto.randomUUID(), sub_ledger_type: "none", sub_ledger_id: "", account_id: "", debit: 0, credit: 0, remarks: "", currency: "USD", exchange_rate: 1, base_debit: 0, base_credit: 0 },
    { id: crypto.randomUUID(), sub_ledger_type: "none", sub_ledger_id: "", account_id: "", debit: 0, credit: 0, remarks: "", currency: "USD", exchange_rate: 1, base_debit: 0, base_credit: 0 },
  ]);

  const [editingRowId, setEditingRowId] = useState<string | null>(lines[0].id);

  const fiscalYears = useMemo(() => {
    const currentAD = new Date();
    const currentFYStr = getFiscalYear(currentAD);
    const [start] = currentFYStr.split('/').map(Number);
    return [
      currentFYStr,
      `${start - 1}/${start.toString().slice(-2)}`,
      `${start - 2}/${(start - 1).toString().slice(-2)}`
    ];
  }, []);

  const dateAdRef = useRef<HTMLInputElement>(null);
  const mitiBsRef = useRef<HTMLInputElement>(null);
  const voucherTypeRef = useRef<HTMLButtonElement>(null);
  const saveBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (voucherType && fiscalYear && entries) {
      const prefix = voucherType;
      const count = (entries.filter(e => e.voucher_type === voucherType).length + 1).toString().padStart(2, '0');
      setVoucherNo(`${prefix}-${fiscalYear}-${count}`);
    } else {
      setVoucherNo("");
    }
  }, [voucherType, fiscalYear, entries]);

  const handleDateADChange = (date: Date | undefined) => {
    if (!date) return;
    setDateAD(date);
    setDateADInput(formatAdDate(date, separator));
    setMitiBS(formatBsDate(adToBs(date), separator));
  };

  const handleMitiBSChange = (date: Date) => {
    setDateAD(date);
    setDateADInput(formatAdDate(date, separator));
    setMitiBS(formatBsDate(adToBs(date), separator));
  };

  const handleFYChange = (fy: string) => {
    setFiscalYear(fy);
    const { start } = getFiscalYearRange(fy);
    setDateAD(start);
    setDateADInput(formatAdDate(start, separator));
    setMitiBS(formatBsDate(adToBs(start), separator));
  };

  const fyRange = useMemo(() => getFiscalYearRange(fiscalYear), [fiscalYear]);

  const handleManualADInput = (val: string) => {
    setDateADInput(val);
    const parsed = parseAdDate(val);
    if (parsed) {
        if (parsed >= fyRange.start && parsed <= fyRange.end) {
            setDateAD(parsed);
            setMitiBS(formatBsDate(adToBs(parsed), separator));
        } else {
            toast.error(`Date must be within Fiscal Year ${fiscalYear}`);
        }
    }
  };

  const handleManualBSInput = (val: string) => {
    setMitiBS(val);
    const parsedBS = parseBsDate(val);
    if (parsedBS) {
        const ad = bsToAd(parsedBS.year, parsedBS.month, parsedBS.day);
        if (ad >= fyRange.start && ad <= fyRange.end) {
            setDateAD(ad);
            setDateADInput(formatAdDate(ad, separator));
        } else {
            toast.error(`Date must be within Fiscal Year ${fiscalYear}`);
        }
    }
  };

  const totalDebit = lines.reduce((sum, l) => sum + (Number(l.base_debit) || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + (Number(l.base_credit) || 0), 0);
  const difference = Math.abs(totalDebit - totalCredit);

  const addRow = () => {
    const newId = crypto.randomUUID();
    setLines(prev => [...prev, { id: newId, sub_ledger_type: "none", sub_ledger_id: "", account_id: "", debit: 0, credit: 0, remarks: "", currency: "USD", exchange_rate: 1, base_debit: 0, base_credit: 0 }]);
    setEditingRowId(newId);
    return newId;
  };

  const removeRow = (id: string) => {
    if (lines.length <= 2) {
      toast.error("At least two lines are required");
      return;
    }
    setLines(lines.filter(l => l.id !== id));
  };

  const updateLine = (id: string, field: keyof JournalLine, value: any) => {
    setLines(prevLines => prevLines.map(l => {
      if (l.id !== id) return l;
      const newLine = { ...l, [field]: value };

      // Recalculate base amounts if debit, credit, or rate changes
      if (field === "debit" || field === "credit" || field === "exchange_rate" || field === "currency") {
          if (field === "currency") {
              newLine.exchange_rate = CURRENCIES.find(c => c.code === value)?.rate || 1;
          }
          newLine.base_debit = (newLine.debit || 0) * newLine.exchange_rate;
          newLine.base_credit = (newLine.credit || 0) * newLine.exchange_rate;
      }
      return newLine;
    }));
  };

  const handleSave = async () => {
    if (!voucherType) {
      toast.error("Please select a voucher type");
      return;
    }
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      toast.error("Total Debit and Total Credit must be equal");
      return;
    }
    if (!narration) {
      toast.error("Please enter a narration");
      return;
    }

    const toastId = toast.loading("Saving voucher...");

    try {
      const uploadedAttachments: { name: string; url: string; type: string }[] = [];
      for (const file of attachments) {
        const fileExt = file.name.split('.').pop();
        const filePath = `journal-attachments/${crypto.randomUUID()}.${fileExt}`;
        const { error: uploadError } = await api.storage.from('attachments').upload(filePath, file);
        if (uploadError) continue;
        const { data: { publicUrl } } = api.storage.from('attachments').getPublicUrl(filePath);
        uploadedAttachments.push({ name: file.name, url: publicUrl, type: file.type });
      }

      await createJournalEntry.mutateAsync({
        date: dateAD.toISOString().split("T")[0],
        miti: mitiBS,
        fiscal_year: fiscalYear,
        voucher_type: voucherType,
        description: narration,
        reference: voucherNo,
        attachments: uploadedAttachments,
        lines: lines
          .filter(l => l.account_id && (l.base_debit > 0 || l.base_credit > 0))
          .map(l => ({
            account_id: l.account_id,
            sub_ledger: l.sub_ledger_id ? `${l.sub_ledger_type}:${l.sub_ledger_id}` : null,
            debit: l.base_debit,
            credit: l.base_credit,
            description: l.remarks,
          })),
      });
      toast.success("Voucher saved successfully", { id: toastId });
      onClose();
    } catch (error) {
      toast.error("Failed to save voucher", { id: toastId });
    }
  };

  const isBlocked = !voucherType;

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleSave]);

  const handleKeyDown = (e: React.KeyboardEvent, field: string, id?: string) => {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      if (field === "fy") dateAdRef.current?.focus();
      else if (field === "dateAD") mitiBsRef.current?.focus();
      else if (field === "mitiBS") voucherTypeRef.current?.focus();
      else if (field === "voucherType") {
        document.getElementById(`sub-type-${lines[0].id}`)?.focus();
      }
      else if (field === "sub_type" && id) document.getElementById(`sub-ledger-${id}`)?.focus();
      else if (field === "sub_ledger" && id) document.getElementById(`account-${id}`)?.focus();
      else if (field === "account" && id) document.getElementById(`currency-${id}`)?.focus();
      else if (field === "currency" && id) document.getElementById(`debit-${id}`)?.focus();
      else if (field === "debit" && id) document.getElementById(`credit-${id}`)?.focus();
      else if (field === "credit" && id) document.getElementById(`remarks-${id}`)?.focus();
      else if (field === "remarks" && id) {
        const index = lines.findIndex(l => l.id === id);
        if (index === lines.length - 1) {
          const newId = addRow();
          setTimeout(() => document.getElementById(`sub-type-${newId}`)?.focus(), 50);
        } else {
          document.getElementById(`sub-type-${lines[index + 1].id}`)?.focus();
        }
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold font-display">Advanced Journal Editor</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            ref={saveBtnRef}
            className="gap-2 bg-success hover:bg-success/90 text-success-foreground"
            onClick={handleSave}
            disabled={createJournalEntry.isPending || isBlocked}
          >
            <Save className="h-4 w-4" />
            <span>Save Voucher</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        <Card className="border-primary/10 shadow-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Fiscal Year</Label>
                <Select value={fiscalYear} onValueChange={handleFYChange}>
                  <SelectTrigger className="h-9" onKeyDown={(e) => handleKeyDown(e, "fy")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fiscalYears.map(fy => <SelectItem key={fy} value={fy}>{fy}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground" htmlFor="dateAD">Date AD</Label>
                <Input id="dateAD" ref={dateAdRef} className="h-9" value={dateADInput} onChange={(e) => handleManualADInput(e.target.value)} onKeyDown={(e) => handleKeyDown(e, "dateAD")} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground" htmlFor="mitiBS">Miti BS</Label>
                <Input id="mitiBS" ref={mitiBsRef} className="h-9" value={mitiBS} onChange={(e) => handleManualBSInput(e.target.value)} onKeyDown={(e) => handleKeyDown(e, "mitiBS")} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Voucher Type</Label>
                <Select value={voucherType} onValueChange={setVoucherType}>
                  <SelectTrigger ref={voucherTypeRef} className={cn("h-9", isBlocked && "ring-2 ring-primary animate-pulse")} onKeyDown={(e) => handleKeyDown(e, "voucherType")}>
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {VOUCHER_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Voucher No.</Label>
                <Input value={voucherNo} readOnly className="h-9 bg-muted font-mono text-amber-500 font-bold" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className={cn("space-y-4 transition-all duration-300", isBlocked && "opacity-50 grayscale pointer-events-none")}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-display">Multi-Currency & Sub-Ledger Entries</h2>
            <Button variant="outline" size="sm" onClick={addRow} className="gap-2"><Plus className="h-4 w-4" />Add Row</Button>
          </div>

          <div className="border rounded-lg overflow-hidden bg-card shadow-sm">
            <div className="grid grid-cols-[50px_100px_1fr_1.5fr_100px_120px_120px_1fr] bg-muted/50 border-b text-[10px] uppercase font-bold tracking-wider px-3 py-2 gap-2">
              <div>Act</div>
              <div>Sub Type</div>
              <div>Sub Ledger</div>
              <div>Ledger Account</div>
              <div>Curr</div>
              <div className="text-right">Debit</div>
              <div className="text-right">Credit</div>
              <div>Remarks</div>
            </div>
            <div className="divide-y">
              {lines.map((line) => (
                <div key={line.id} className={cn("grid grid-cols-[50px_100px_1fr_1.5fr_100px_120px_120px_1fr] p-2 items-center gap-2 transition-colors", editingRowId === line.id ? "bg-accent/30" : "hover:bg-accent/10")}>
                  <div className="flex justify-center">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeRow(line.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                  <div>
                    <Select value={line.sub_ledger_type} onValueChange={(v: any) => updateLine(line.id, "sub_ledger_type", v)}>
                      <SelectTrigger id={`sub-type-${line.id}`} className="h-7 text-xs" onKeyDown={(e) => handleKeyDown(e, "sub_type", line.id)}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="vendor">Vendor</SelectItem>
                        <SelectItem value="customer">Customer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Select value={line.sub_ledger_id} disabled={line.sub_ledger_type === 'none'} onValueChange={(v) => updateLine(line.id, "sub_ledger_id", v)}>
                      <SelectTrigger id={`sub-ledger-${line.id}`} className="h-7 text-xs" onKeyDown={(e) => handleKeyDown(e, "sub_ledger", line.id)}>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {line.sub_ledger_type === 'vendor' && suppliers?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                        {line.sub_ledger_type === 'customer' && guests?.map(g => <SelectItem key={g.id} value={g.id}>{g.first_name} {g.last_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Select value={line.account_id} onValueChange={(v) => updateLine(line.id, "account_id", v)}>
                      <SelectTrigger id={`account-${line.id}`} className="h-7 text-xs" onKeyDown={(e) => handleKeyDown(e, "account", line.id)}>
                        <SelectValue placeholder="Account..." />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts?.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.code} - {acc.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Select value={line.currency} onValueChange={(v) => updateLine(line.id, "currency", v)}>
                      <SelectTrigger id={`currency-${line.id}`} className="h-7 text-xs" onKeyDown={(e) => handleKeyDown(e, "currency", line.id)}>
                        <Globe className="h-3 w-3 mr-1" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map(c => <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Input id={`debit-${line.id}`} type="number" className="h-7 text-xs text-right" value={line.debit || ""} onChange={(e) => updateLine(line.id, "debit", parseFloat(e.target.value) || 0)} onKeyDown={(e) => handleKeyDown(e, "debit", line.id)} />
                  </div>
                  <div>
                    <Input id={`credit-${line.id}`} type="number" className="h-7 text-xs text-right" value={line.credit || ""} onChange={(e) => updateLine(line.id, "credit", parseFloat(e.target.value) || 0)} onKeyDown={(e) => handleKeyDown(e, "credit", line.id)} />
                  </div>
                  <div>
                    <Input id={`remarks-${line.id}`} className="h-7 text-xs" value={line.remarks} onChange={(e) => updateLine(line.id, "remarks", e.target.value)} onKeyDown={(e) => handleKeyDown(e, "remarks", line.id)} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Narration</Label>
                <Input placeholder="Voucher narration..." value={narration} onChange={(e) => setNarration(e.target.value)} className="h-20" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Attachments (Max 2MB)</Label>
                <div className="flex flex-wrap gap-1.5">
                  {attachments.map((file, i) => (
                    <div key={i} className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md text-[11px] border group">
                      <FileText className="h-3 w-3" />
                      <span className="max-w-[100px] truncate">{file.name}</span>
                      <Button variant="ghost" size="icon" className="h-4 w-4 text-destructive opacity-0 group-hover:opacity-100" onClick={() => removeAttachment(i)}><X className="h-2 w-2" /></Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="h-7 px-2 border-dashed text-[11px]" onClick={() => fileInputRef.current?.click()}><Plus className="h-3 w-3 mr-1" />Add File</Button>
                  <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileChange} accept="image/*,.pdf" />
                </div>
              </div>
            </div>
            <div className="bg-muted/30 rounded-lg p-4 space-y-3 border">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground uppercase font-bold">Base Total Debit (USD)</span>
                <span className="font-mono font-bold text-sm">${totalDebit.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground uppercase font-bold">Base Total Credit (USD)</span>
                <span className="font-mono font-bold text-sm">${totalCredit.toFixed(2)}</span>
              </div>
              <div className="pt-3 border-t flex justify-between items-center">
                <span className="font-bold">Difference</span>
                <Badge variant={difference < 0.01 ? "outline" : "destructive"} className={cn(difference < 0.01 && "bg-success/10 text-success border-success/20")}>
                  ${difference.toFixed(2)}
                </Badge>
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-primary/5 text-[10px] text-primary/70 italic">
                <RefreshCw className="h-3 w-3" />
                Amounts are automatically converted to Base Currency (USD) using real-time simulated exchange rates.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
