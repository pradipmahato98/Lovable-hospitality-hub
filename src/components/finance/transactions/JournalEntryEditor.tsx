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
  sub_ledger: string;
  account_id: string;
  debit: number;
  credit: number;
  remarks: string;
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

export function JournalEntryEditor({ onClose }: JournalEntryEditorProps) {
  const [attachments, setAttachments] = useState<File[]>([]);
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string; type: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      if (file.size > 1 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 1MB limit`);
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
  const createJournalEntry = useCreateJournalEntry();
  const { data: uiPrefs } = useUIPreferences();
  const separator = uiPrefs?.date_separator || "/";

  const [fiscalYear, setFiscalYear] = useState(getFiscalYear(new Date()));
  const [dateAD, setDateAD] = useState(new Date());
  const [dateADInput, setDateADInput] = useState(formatAdDate(new Date(), separator));
  const [mitiBS, setMitiBS] = useState(formatBsDate(adToBs(new Date()), separator));

  // Sync inputs when separator changes
  useEffect(() => {
    setDateADInput(formatAdDate(dateAD, separator));
    setMitiBS(formatBsDate(adToBs(dateAD), separator));
  }, [separator]);

  const [voucherType, setVoucherType] = useState<string>("");
  const [voucherNo, setVoucherNo] = useState("");
  const [narration, setNarration] = useState("");
  const [lines, setLines] = useState<JournalLine[]>([
    { id: crypto.randomUUID(), sub_ledger: "", account_id: "", debit: 0, credit: 0, remarks: "" },
    { id: crypto.randomUUID(), sub_ledger: "", account_id: "", debit: 0, credit: 0, remarks: "" },
  ]);

  const [editingRowId, setEditingRowId] = useState<string | null>(lines[0].id);

  const fiscalYears = useMemo(() => {
    const currentAD = new Date();
    const currentFYStr = getFiscalYear(currentAD);
    const [start] = currentFYStr.split('/').map(Number);

    // Generate years up to current, descending
    return [
      currentFYStr,
      `${start - 1}/${start.toString().slice(-2)}`,
      `${start - 2}/${(start - 1).toString().slice(-2)}`
    ];
  }, []);

  // Focus management
  const fyRef = useRef<HTMLButtonElement>(null);
  const dateAdRef = useRef<HTMLInputElement>(null);
  const mitiBsRef = useRef<HTMLInputElement>(null);
  const voucherTypeRef = useRef<HTMLButtonElement>(null);
  const narrationRef = useRef<HTMLInputElement>(null);
  const saveBtnRef = useRef<HTMLButtonElement>(null);

  // Voucher Number Generation
  useEffect(() => {
    if (voucherType && fiscalYear && entries) {
      const prefix = voucherType;
      // Use short form of FY for Voucher No (e.g., 81/82, 82/83)
      const shortFY = fiscalYear;
      const count = (entries.filter(e => e.voucher_type === voucherType).length + 1).toString().padStart(2, '0');
      setVoucherNo(`${prefix}-${shortFY}-${count}`);
    } else {
      setVoucherNo("");
    }
  }, [voucherType, fiscalYear, entries]);

  // Synchronize dates
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
    // Always jump to the start date of the selected fiscal year
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

  const totalDebit = lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
  const difference = Math.abs(totalDebit - totalCredit);

  const addRow = () => {
    const newId = crypto.randomUUID();
    setLines(prev => [...prev, { id: newId, sub_ledger: "", account_id: "", debit: 0, credit: 0, remarks: "" }]);
    setEditingRowId(newId);
    return newId;
  };

  const addMultipleRows = (count: number) => {
    const newRows = Array.from({ length: count }).map(() => ({
      id: crypto.randomUUID(),
      sub_ledger: "",
      account_id: "",
      debit: 0,
      credit: 0,
      remarks: "",
    }));
    setLines([...lines, ...newRows]);
  };

  const removeRow = (id: string) => {
    if (lines.length <= 2) {
      toast.error("At least two lines are required");
      return;
    }
    setLines(lines.filter(l => l.id !== id));
  };

  const updateLine = (id: string, field: keyof JournalLine, value: any) => {
    setLines(lines.map(l => l.id === id ? { ...l, [field]: value } : l));
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
      // 1. Upload Attachments if any
      const uploadedAttachments: { name: string; url: string; type: string }[] = [];

      for (const file of attachments) {
        const fileExt = file.name.split('.').pop();
        const filePath = `journal-attachments/${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await api.storage
          .from('attachments')
          .upload(filePath, file);

        if (uploadError) {
           console.error("Upload error:", uploadError);
           continue;
        }

        const { data: { publicUrl } } = api.storage
          .from('attachments')
          .getPublicUrl(filePath);

        uploadedAttachments.push({
          name: file.name,
          url: publicUrl,
          type: file.type
        });
      }

      // 2. Create Journal Entry
      await createJournalEntry.mutateAsync({
        date: dateAD.toISOString().split("T")[0],
        miti: mitiBS,
        fiscal_year: fiscalYear,
        voucher_type: voucherType,
        description: narration,
        reference: voucherNo,
        attachments: uploadedAttachments,
        lines: lines
          .filter(l => l.account_id && (l.debit > 0 || l.credit > 0))
          .map(l => ({
            account_id: l.account_id,
            sub_ledger: l.sub_ledger,
            debit: l.debit,
            credit: l.credit,
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

  // Global Shortcut for Saving
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

  // Keyboard navigation handler
  const handleKeyDown = (e: React.KeyboardEvent, field: string, id?: string) => {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();

      if (field === "fy") dateAdRef.current?.focus();
      else if (field === "dateAD") mitiBsRef.current?.focus();
      else if (field === "mitiBS") voucherTypeRef.current?.focus();
      else if (field === "voucherType") {
        // Move to first row Sub Ledger
        const firstRowSubLedger = document.getElementById(`sub-ledger-${lines[0].id}`);
        firstRowSubLedger?.focus();
      }
      else if (field === "sub_ledger" && id) {
        document.getElementById(`account-${id}`)?.focus();
      }
      else if (field === "account" && id) {
        const line = lines.find(l => l.id === id);
        if (!line?.account_id && lines.indexOf(line!) >= 2) {
            // Redirect to save button if at least 2 entries exist and current account is empty
            saveBtnRef.current?.focus();
        } else {
            document.getElementById(`debit-${id}`)?.focus();
        }
      }
      else if (field === "debit" && id) document.getElementById(`credit-${id}`)?.focus();
      else if (field === "credit" && id) document.getElementById(`remarks-${id}`)?.focus();
      else if (field === "remarks" && id) {
        const index = lines.findIndex(l => l.id === id);
        if (index === lines.length - 1) {
          const newId = addRow();
          // Timeout to wait for DOM update
          setTimeout(() => {
            document.getElementById(`sub-ledger-${newId}`)?.focus();
          }, 50);
        } else {
          document.getElementById(`sub-ledger-${lines[index + 1].id}`)?.focus();
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
          <h1 className="text-xl font-bold font-display">Journal Entry Editor</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            ref={saveBtnRef}
            className="gap-2 bg-success hover:bg-success/90 text-success-foreground shadow-sm transition-all active:scale-95"
            onClick={handleSave}
            disabled={createJournalEntry.isPending || isBlocked}
          >
            <Save className="h-4 w-4" />
            <span>Save Voucher</span>
            <kbd className="hidden md:inline-flex h-4 select-none items-center gap-1 rounded border bg-white/20 px-1.5 font-mono text-[10px] font-medium text-white opacity-90 ml-1">
              <span className="text-[10px]">⌘</span>S
            </kbd>
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
                  <SelectTrigger ref={fyRef} className="h-9" onKeyDown={(e) => handleKeyDown(e, "fy")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fiscalYears.map(fy => (
                      <SelectItem key={fy} value={fy}>{fy}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground" htmlFor="dateAD">Transaction Date AD</Label>
                <div className="relative">
                  <Input
                    id="dateAD"
                    ref={dateAdRef}
                    className="h-9 pr-8"
                    value={dateADInput}
                    onChange={(e) => handleManualADInput(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, "dateAD")}
                    placeholder={`DD${separator}MM${separator}YYYY`}
                  />
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-9 w-9 text-muted-foreground hover:text-primary"
                      >
                        <CalendarIcon className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateAD}
                        onSelect={handleDateADChange}
                        fromDate={fyRange.start}
                        toDate={fyRange.end}
                        initialFocus
                        classNames={{
                          day_today: "bg-success text-success-foreground hover:bg-success/90 rounded-full",
                          day_selected: "bg-amber-500 text-white hover:bg-amber-600 focus:bg-amber-500 focus:text-white rounded-full",
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground" htmlFor="mitiBS">Miti (BS)</Label>
                <div className="relative">
                  <Input
                    id="mitiBS"
                    ref={mitiBsRef}
                    className="h-9 pr-8"
                    value={mitiBS}
                    onChange={(e) => handleManualBSInput(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, "mitiBS")}
                    placeholder={`YYYY${separator}MM${separator}DD`}
                  />
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-9 w-9 text-muted-foreground hover:text-primary"
                      >
                        <CalendarIcon className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <NepaliCalendar
                        selected={dateAD}
                        onSelect={handleMitiBSChange}
                        minDate={fyRange.start}
                        maxDate={fyRange.end}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Voucher Type</Label>
                <Select
                  value={voucherType}
                  onValueChange={(v) => {
                    setVoucherType(v);
                    setTimeout(() => {
                      document.getElementById(`sub-ledger-${lines[0].id}`)?.focus();
                    }, 50);
                  }}
                >
                  <SelectTrigger
                    ref={voucherTypeRef}
                    className={cn("h-9", isBlocked && "ring-2 ring-primary animate-pulse")}
                    onKeyDown={(e) => handleKeyDown(e, "voucherType")}
                  >
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {VOUCHER_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Voucher No.</Label>
                <Input
                  value={voucherNo}
                  readOnly
                  className="h-9 bg-muted font-mono text-amber-500 font-bold pointer-events-none"
                  tabIndex={-1}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className={cn("space-y-4 transition-all duration-300", isBlocked && "opacity-50 grayscale pointer-events-none")}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-display">Accounting Entries</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => addMultipleRows(5)} className="gap-2">
                <PlusCircle className="h-4 w-4" />
                Add Multiple (5)
              </Button>
              <Button variant="outline" size="sm" onClick={addRow} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Row
              </Button>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden bg-card shadow-sm">
            <div className="grid grid-cols-[60px_40px_1fr_1.5fr_100px_100px_1.2fr] bg-muted/50 border-b text-[10px] uppercase font-bold tracking-wider px-3 py-2 gap-2">
              <div className="flex items-center">Action</div>
              <div className="flex items-center">No.</div>
              <div className="flex items-center">Sub Ledger</div>
              <div className="flex items-center">Ledger Account</div>
              <div className="flex items-center justify-end">Debit</div>
              <div className="flex items-center justify-end">Credit</div>
              <div className="flex items-center">Remarks</div>
            </div>
            <div className="divide-y">
              {lines.map((line, index) => (
                <div
                  key={line.id}
                  className={cn(
                    "grid grid-cols-[60px_40px_1fr_1.5fr_100px_100px_1.2fr] p-2 items-center gap-2 group transition-colors",
                    editingRowId === line.id ? "bg-accent/30" : "hover:bg-accent/10"
                  )}
                >
                  <div className="flex justify-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={() => setEditingRowId(line.id)}>
                          Edit Row
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => removeRow(line.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Row
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="text-sm font-mono text-muted-foreground">{index + 1}</div>
                  <div className={cn(editingRowId !== line.id && "pointer-events-none opacity-80")}>
                    <Input
                      id={`sub-ledger-${line.id}`}
                      placeholder="Sub Ledger"
                      value={line.sub_ledger}
                      readOnly={editingRowId !== line.id}
                      onChange={(e) => updateLine(line.id, "sub_ledger", e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, "sub_ledger", line.id)}
                      className="h-7 text-xs bg-transparent border-none focus-visible:ring-1"
                    />
                  </div>
                  <div className={cn(editingRowId !== line.id && "pointer-events-none opacity-80")}>
                    <Select
                      value={line.account_id}
                      disabled={editingRowId !== line.id}
                      onValueChange={(v) => {
                        updateLine(line.id, "account_id", v);
                        // Auto-forward on selection
                        setTimeout(() => {
                          document.getElementById(`debit-${line.id}`)?.focus();
                        }, 50);
                      }}
                    >
                      <SelectTrigger
                        id={`account-${line.id}`}
                        className="h-7 text-xs bg-transparent border-none focus-visible:ring-1"
                        onKeyDown={(e) => handleKeyDown(e, "account", line.id)}
                      >
                        <SelectValue placeholder="Select Ledger Account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts?.map(acc => (
                          <SelectItem key={acc.id} value={acc.id}>{acc.code} - {acc.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className={cn(editingRowId !== line.id && "pointer-events-none opacity-80")}>
                    <Input
                      id={`debit-${line.id}`}
                      type="number"
                      placeholder="0.00"
                      readOnly={editingRowId !== line.id}
                      className="h-7 text-xs text-right bg-transparent border-none focus-visible:ring-1"
                      value={line.debit || ""}
                      onChange={(e) => updateLine(line.id, "debit", parseFloat(e.target.value) || 0)}
                      onKeyDown={(e) => handleKeyDown(e, "debit", line.id)}
                    />
                  </div>
                  <div className={cn(editingRowId !== line.id && "pointer-events-none opacity-80")}>
                    <Input
                      id={`credit-${line.id}`}
                      type="number"
                      placeholder="0.00"
                      readOnly={editingRowId !== line.id}
                      className="h-7 text-xs text-right bg-transparent border-none focus-visible:ring-1"
                      value={line.credit || ""}
                      onChange={(e) => updateLine(line.id, "credit", parseFloat(e.target.value) || 0)}
                      onKeyDown={(e) => handleKeyDown(e, "credit", line.id)}
                    />
                  </div>
                  <div className={cn(editingRowId !== line.id && "pointer-events-none opacity-80")}>
                    <Input
                      id={`remarks-${line.id}`}
                      placeholder="Remarks"
                      readOnly={editingRowId !== line.id}
                      className="h-7 text-xs bg-transparent border-none focus-visible:ring-1"
                      value={line.remarks}
                      onChange={(e) => updateLine(line.id, "remarks", e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, "remarks", line.id)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Narration</Label>
                <Input
                  ref={narrationRef}
                  placeholder="Enter overall transaction narration"
                  value={narration}
                  onChange={(e) => setNarration(e.target.value)}
                  className="h-20"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground">Voucher Attachments (Max 1MB)</Label>
                <div className="flex flex-wrap gap-1.5">
                  {attachments.map((file, i) => (
                    <div key={i} className="flex items-center gap-1.5 bg-muted/50 hover:bg-muted px-2 py-1 rounded-md text-[11px] border border-border transition-colors group">
                      <FileText className="h-3 w-3 text-primary/60" />
                      <span className="max-w-[100px] truncate font-medium">{file.name}</span>
                      <div className="flex items-center gap-0.5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handlePreview(file)}>
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleDownload(file)}>
                          <Download className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={() => removeAttachment(i)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 border-dashed border-primary/30 hover:border-primary hover:bg-primary/5 text-[11px] gap-1.5"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Plus className="h-3 w-3" />
                    Add File
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    multiple
                    onChange={handleFileChange}
                    accept="image/*,.pdf"
                  />
                </div>
              </div>
            </div>
            <div className="bg-muted/30 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground uppercase font-bold tracking-tight">Total Debit</span>
                <span className="font-mono font-bold text-sm">${totalDebit.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground uppercase font-bold tracking-tight">Total Credit</span>
                <span className="font-mono font-bold text-sm">${totalCredit.toFixed(2)}</span>
              </div>
              <div className="pt-3 border-t flex justify-between items-center">
                <span className="font-bold">Difference</span>
                <Badge variant={difference === 0 ? "outline" : "destructive"} className={cn(difference === 0 && "bg-success/10 text-success border-success/20")}>
                  ${difference.toFixed(2)}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={!!previewFile} onOpenChange={(open) => !open && setPreviewFile(null)}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b flex-row items-center justify-between">
            <DialogTitle className="text-base truncate pr-8">{previewFile?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 bg-black/5 flex items-center justify-center p-4">
            {previewFile?.type.startsWith('image/') ? (
              <img src={previewFile.url} alt={previewFile.name} className="max-w-full max-h-full object-contain" />
            ) : previewFile?.type === 'application/pdf' ? (
              <iframe src={previewFile.url} className="w-full h-full border-none" title="PDF Preview" />
            ) : (
              <div className="text-center space-y-4">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                <p>Preview not available for this file type</p>
                <Button onClick={() => previewFile && handleDownload(new File([], previewFile.name))}>Download to View</Button>
              </div>
            )}
          </div>
          <DialogFooter className="p-4 border-t">
            <Button variant="outline" onClick={() => setPreviewFile(null)}>Close</Button>
            {previewFile && (
              <Button onClick={() => {
                const a = document.createElement('a');
                a.href = previewFile.url;
                a.download = previewFile.name;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
              }}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
