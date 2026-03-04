import { useState, useMemo, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronRight,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  MoreHorizontal,
  Edit2,
  AlertCircle,
  Paperclip,
  Upload,
  FileIcon,
  Calendar as CalendarIcon,
  ArrowUp,
  ArrowDown,
  Printer,
  Eye,
  MoreVertical,
  Menu,
  ShieldCheck,
} from "lucide-react";
import { useAccounts, useCreateJournalEntry, useJournalEntry, useUpdateJournalEntry, useCreateAccount, Account } from "@/hooks/useFinance";
import { useBusinessDate } from "@/hooks/useSettings";
import { toast } from "sonner";
import { adToBs, bsToAd, formatAdDate, parseAdDate, toYmd, fromDateStr } from "@/utils/nepaliDate";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { NepaliCalendar } from "@/components/ui/nepali-calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Reorder } from "framer-motion";
import { format } from "date-fns";

interface JournalLineItem {
  account_id: string;
  party_type: string;
  party: string;
  debit: number;
  credit: number;
}

export default function JournalEntryEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Persist entry type (Standard/Quick)
  const [type, setType] = useState(() => {
    const urlType = searchParams.get("type");
    if (urlType) return urlType;
    return localStorage.getItem("journal_entry_type") || "Standard";
  });

  useEffect(() => {
    localStorage.setItem("journal_entry_type", type);
    if (searchParams.get("type") !== type) {
      setSearchParams({ type }, { replace: true });
    }
  }, [type, searchParams, setSearchParams]);

  const { data: accounts, isLoading: isLoadingAccounts } = useAccounts();
  const { data: entryData, isLoading: isLoadingEntry } = useJournalEntry(id);
  const isReadOnly = entryData?.is_posted || false;
  const createJournalEntry = useCreateJournalEntry();
  const updateJournalEntry = useUpdateJournalEntry();
  const createAccount = useCreateAccount();
  const { data: businessDate } = useBusinessDate();

  const [isDirty, setIsDirty] = useState(false);
  const [ledgerDialogOpen, setLedgerDialogOpen] = useState(false);
  const [newLedger, setNewLedger] = useState({
    code: "",
    name: "",
    type: "asset" as Account["type"],
    description: "",
  });
  const [currentRowIndex, setCurrentRowIndex] = useState<number | null>(null);
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<{ id: string, name: string, size: string, type: string, url?: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    entry_type: "",
    series: "ACC-JV-.YYYY.-",
    company: "Unico Plastics Inc.",
    posting_date: toYmd(new Date()),
    miti: adToBs(new Date()),
    fiscal_year: "2082/83",
    voucher_no: "",
    finance_book: "",
    from_template: "",
    narration: "",
    lines: [
      { account_id: "", party_type: "", party: "", debit: 0, credit: 0 },
      { account_id: "", party_type: "", party: "", debit: 0, credit: 0 },
    ] as JournalLineItem[],
  });

  const [adDisplay, setAdDisplay] = useState(formatAdDate(toYmd(new Date())));
  const [bsDisplay, setBsDisplay] = useState(adToBs(new Date()));
  const [adMonth, setAdMonth] = useState<Date>(new Date());

  const fiscalLimits = useMemo(() => {
    const limits: Record<string, { adStart: string, adEnd: string, bsStart: string, bsEnd: string }> = {
      "2082/83": {
        adStart: "2025-07-16",
        adEnd: "2026-07-15",
        bsStart: "2082/04/01",
        bsEnd: "2083/03/31",
      },
      "2081/82": {
        adStart: "2024-07-16",
        adEnd: "2025-07-15",
        bsStart: "2081/04/01",
        bsEnd: "2082/03/31",
      },
      "2080/81": {
        adStart: "2023-07-17",
        adEnd: "2024-07-15",
        bsStart: "2080/04/01",
        bsEnd: "2081/03/31",
      },
      "2079/80": {
        adStart: "2022-07-17",
        adEnd: "2023-07-16",
        bsStart: "2079/04/01",
        bsEnd: "2080/03/31",
      }
    };
    return limits[formData.fiscal_year] || null;
  }, [formData.fiscal_year]);

  const calculateFiscalYear = (adDate: string) => {
    if (adDate >= "2025-07-16" && adDate <= "2026-07-15") return "2082/83";
    if (adDate >= "2024-07-16" && adDate <= "2025-07-15") return "2081/82";
    if (adDate >= "2023-07-17" && adDate <= "2024-07-15") return "2080/81";
    if (adDate >= "2022-07-17" && adDate <= "2023-07-16") return "2079/80";
    return "2082/83"; // Default
  };

  const syncDates = (newAd: string, newBs: string) => {
    const newFy = calculateFiscalYear(newAd);

    setFormData(prev => {
      let voucherNo = prev.voucher_no;
      if (prev.entry_type) {
        const prefix = prev.entry_type === "Journal Voucher" ? "JV" :
                       prev.entry_type === "Payment Voucher" ? "PV" :
                       prev.entry_type === "Receipt Voucher" ? "RV" :
                       prev.entry_type === "Contra Voucher" ? "CV" : "JV";
        const shortFy = newFy.split('/').map(s => s.slice(-2)).join('/');
        voucherNo = `${prefix}-${shortFy}-01`;
      }
      return {
        ...prev,
        posting_date: newAd,
        miti: newBs,
        fiscal_year: newFy,
        voucher_no: voucherNo
      };
    });
    setAdDisplay(formatAdDate(newAd));
    setBsDisplay(newBs);
    const date = fromDateStr(newAd);
    if (date) setAdMonth(date);
  };

  // Sync posting date with current date (Today) by default
  useEffect(() => {
    if (!id && !isDirty) {
      const today = new Date();
      const ad = toYmd(today);
      const bs = adToBs(today);
      syncDates(ad, bs);
    }
  }, [id, isDirty]);

  // Load existing entry if editing
  useEffect(() => {
    if (id && entryData) {
      const bs = entryData.miti || adToBs(entryData.date);
      setFormData({
        entry_type: entryData.voucher_type || "Journal Voucher",
        series: entryData.series || "ACC-JV-.YYYY.-",
        company: "Unico Plastics Inc.",
        posting_date: entryData.date,
        miti: bs,
        fiscal_year: entryData.fiscal_year || "2080/81",
        voucher_no: entryData.entry_number,
        finance_book: entryData.finance_book || "",
        from_template: entryData.from_template || "",
        narration: entryData.reference || "",
        lines: entryData.lines?.map(l => ({
          account_id: l.account_id,
          party_type: l.sub_ledger || l.party_type || "",
          party: l.description || l.party_id || "",
          debit: l.debit,
          credit: l.credit
        })) || [
          { account_id: "", party_type: "", party: "", debit: 0, credit: 0 },
          { account_id: "", party_type: "", party: "", debit: 0, credit: 0 },
        ],
      });
      setAdDisplay(formatAdDate(entryData.date));
      setBsDisplay(bs);
    }
  }, [id, entryData]);

  const totals = useMemo(() => {
    return formData.lines.reduce(
      (acc, line) => ({
        debit: acc.debit + (Number(line.debit) || 0),
        credit: acc.credit + (Number(line.credit) || 0),
      }),
      { debit: 0, credit: 0 }
    );
  }, [formData.lines]);

  const isBalanced = Math.abs(totals.debit - totals.credit) < 0.01 && totals.debit > 0;

  const allowFutureDates = useMemo(() => {
    return formData.lines.some(l => {
      const acc = accounts?.find(a => a.id === l.account_id);
      return acc?.name.toLowerCase().match(/prepaid|rent|salary|recurring/);
    });
  }, [formData.lines, accounts]);

  const handleAddRow = (count: number = 1) => {
    const newRows = Array(count).fill(null).map(() => ({
      account_id: "",
      party_type: "",
      party: "",
      debit: 0,
      credit: 0
    }));

    const newIndex = formData.lines.length;
    setFormData((prev) => ({
      ...prev,
      lines: [...prev.lines, ...newRows],
    }));
    setIsDirty(true);

    // Auto-focus the first field of the new row (Sub Ledger) after a short delay
    setTimeout(() => {
      setEditingRowIndex(newIndex);
      setTimeout(() => {
        const subLedgerInputs = document.querySelectorAll('.sub-ledger-input');
        const rowInput = subLedgerInputs[newIndex] as HTMLElement;
        if (rowInput) rowInput.focus();
      }, 50);
    }, 100);
  };

  const handleRemoveRow = (index: number) => {
    if (formData.lines.length <= 2) {
      toast.error("A journal entry must have at least 2 lines");
      return;
    }
    const newLines = [...formData.lines];
    newLines.splice(index, 1);
    setFormData((prev) => ({ ...prev, lines: newLines }));
    setIsDirty(true);
  };

  const reorderLines = (newLines: JournalLineItem[]) => {
    setFormData(prev => ({ ...prev, lines: newLines }));
    setIsDirty(true);
  };

  const updateLine = (index: number, field: keyof JournalLineItem, value: any) => {
    const newLines = [...formData.lines];
    newLines[index] = { ...newLines[index], [field]: value };

    // Auto-clear credit if debit is entered, and vice versa
    if (field === "debit" && value > 0) newLines[index].credit = 0;
    if (field === "credit" && value > 0) newLines[index].debit = 0;

    setFormData((prev) => ({ ...prev, lines: newLines }));
    setIsDirty(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl+S to save
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      handleSave(true);
      return;
    }

    if (e.key === "Enter" || e.key === "Tab") {
      const target = e.target as HTMLElement;

      // Special logic for empty Ledger Account - only for Enter
      if (e.key === "Enter") {
        const trigger = target.classList.contains('ledger-account-select-trigger') ? target : target.closest('.ledger-account-select-trigger') as HTMLElement;
        if (trigger) {
          const rowIdx = parseInt(trigger.getAttribute('data-row-index') || "-1");
          if (rowIdx !== -1 && !formData.lines[rowIdx].account_id) {
            const saveBtn = document.querySelector('.main-save-btn') as HTMLElement;
            if (saveBtn) {
              saveBtn.focus();
              e.preventDefault();
              return;
            }
          }
        }
      }

      // Logic for adding new row on Enter at the end of a row
      if (e.key === "Enter" && target.classList.contains('remarks-input')) {
        const rowIdx = parseInt(target.getAttribute('data-row-index') || "-1");
        if (rowIdx === formData.lines.length - 1 && formData.lines.length >= 2) {
          const currentLine = formData.lines[rowIdx];
          if (currentLine.account_id && (currentLine.debit > 0 || currentLine.credit > 0)) {
            handleAddRow(1);
            e.preventDefault();
            return;
          }
        }
      }

      // Skip non-form buttons like Action, Add Row, etc. on Enter
      const isNavigableButton = target.classList.contains('main-save-btn');
      const isSelectTrigger = target.classList.contains('select-trigger');
      if (e.key === "Enter" && target.tagName === "BUTTON" && !isNavigableButton && !isSelectTrigger) return;

      const form = document.querySelector("main");
      if (form) {
        // Collect all potential form controls in order
        const focusableElements = Array.from(form.querySelectorAll(
          'input:not([disabled]), .select-trigger:not([disabled]), button.main-save-btn, textarea:not([disabled])'
        )).filter(el => {
          const style = window.getComputedStyle(el);
          const isSkip = el.closest(".skip-nav") && e.key === "Enter";
          const isSpecialInput = el.classList.contains('ad-date-input') || el.classList.contains('bs-miti-input');
          const isReadonly = (el as HTMLInputElement).readOnly && !isSpecialInput;
          const isVisible = style.display !== 'none' && style.visibility !== 'hidden';
          return isVisible && (el as HTMLElement).tabIndex !== -1 && !isSkip && !isReadonly;
        });

        const index = focusableElements.indexOf(target);
        if (index > -1) {
          if (e.shiftKey && e.key === "Tab") {
            if (index > 0) {
              (focusableElements[index - 1] as HTMLElement).focus();
              e.preventDefault();
            }
          } else if (index < focusableElements.length - 1) {
            (focusableElements[index + 1] as HTMLElement).focus();
            e.preventDefault();
          }
        }
      }
    }
  };

  const handleCreateLedger = async () => {
    if (!newLedger.code || !newLedger.name) {
      toast.error("Please fill in ledger code and name");
      return;
    }

    try {
      const result = await createAccount.mutateAsync({
        code: newLedger.code,
        name: newLedger.name,
        type: newLedger.type,
        description: newLedger.description || null,
        parent_id: null,
        is_active: true,
      });
      toast.success("Ledger created successfully");
      setLedgerDialogOpen(false);

      // If we were creating this for a specific row, select it
      if (currentRowIndex !== null) {
        updateLine(currentRowIndex, "account_id", result.id);
      }

      setNewLedger({ code: "", name: "", type: "asset", description: "" });
      setCurrentRowIndex(null);
    } catch (error) {
      toast.error("Failed to create ledger");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const oversizedFiles = Array.from(files).filter(f => f.size > 2 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error("File size limit is 2MB. Please remove larger files.");
      return;
    }

    const newAttachments = Array.from(files).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      type: file.type,
      url: URL.createObjectURL(file)
    }));

    setAttachments(prev => [...prev, ...newAttachments]);
    setIsDirty(true);
    toast.success(`${files.length} file(s) uploaded`);

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
    setIsDirty(true);
  };

  const handleSave = async (shouldNavigate: boolean = true) => {
    if (!isBalanced) {
      toast.error("Debit and Credit totals must be equal and greater than zero");
      return;
    }

    if (!formData.narration) {
      toast.error("Narration is mandatory");
      return;
    }

    // Validation for future dates
    const today = new Date().toISOString().split('T')[0];
    const isFutureDate = formData.posting_date > today;

    // Check for monthly posting exceptions
    const isMonthlyPosting = formData.lines.some(line => {
      const account = accounts?.find(a => a.id === line.account_id);
      if (!account) return false;
      const name = account.name.toLowerCase();
      return name.includes("prepaid") || name.includes("rent") || name.includes("salary") || name.includes("recurring");
    });

    if (isFutureDate && !isMonthlyPosting) {
      toast.error("Future dates are only allowed for monthly postings (Prepaid, Rent, Salary, Recurring)");
      return;
    }

    const payload = {
      date: formData.posting_date,
      miti: formData.miti,
      fiscal_year: formData.fiscal_year,
      voucher_type: formData.entry_type,
      description: `Journal Entry - ${formData.narration || 'No Ref'}`,
      reference: formData.narration,
      series: formData.series || "ACC-JV-.YYYY.-",
      lines: formData.lines
        .filter(l => l.account_id && (l.debit > 0 || l.credit > 0))
        .map(l => ({
          account_id: l.account_id,
          debit: l.debit,
          credit: l.credit,
          description: l.party || null,
          party_type: l.party_type || null,
          sub_ledger: l.party_type || null,
          party_id: null
        }))
    };

    try {
      if (id) {
        await updateJournalEntry.mutateAsync({ id, entry: payload });
        toast.success("Journal Entry updated successfully");
      } else {
        await createJournalEntry.mutateAsync(payload);
        toast.success("Journal Entry saved successfully");
      }
      setIsDirty(false);

      if (shouldNavigate) {
        navigate("/finance");
      } else {
        // Reset form for "Save & New"
        setFormData(prev => {
          const prefix = prev.entry_type === "Journal Voucher" ? "JV" :
                         prev.entry_type === "Payment Voucher" ? "PV" :
                         prev.entry_type === "Receipt Voucher" ? "RV" :
                         prev.entry_type === "Contra Voucher" ? "CV" : "JV";
          const shortFy = prev.fiscal_year.split('/').map(s => s.slice(-2)).join('/');
          return {
            ...prev,
            voucher_no: `${prefix}-${shortFy}-01`, // In a real app, this would fetch the next increment
            narration: "",
            lines: [
              { account_id: "", party_type: "", party: "", debit: 0, credit: 0 },
              { account_id: "", party_type: "", party: "", debit: 0, credit: 0 },
            ]
          };
        });
        setEditingRowIndex(null);
        setAttachments([]);
      }
    } catch (error) {
      toast.error("Failed to save journal entry");
    }
  };

  return (
    <MainLayout
      title={id ? "Edit Journal Entry" : "New Journal Entry"}
      subtitle={
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
          <button onClick={() => navigate("/finance")} className="hover:text-primary transition-colors">Accounting</button>
          <ChevronRight className="h-3 w-3" />
          <button onClick={() => navigate("/finance")} className="hover:text-primary transition-colors">Journal Entry</button>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">{id || "new-journal-entry-3"}</span>
        </div>
      }
      actions={
        <div className="flex items-center gap-3">
          {isDirty && !isReadOnly && (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 gap-1 px-3 py-1">
              <AlertCircle className="h-3 w-3" /> Not Saved
            </Badge>
          )}
          {isReadOnly && (
            <Badge variant="outline" className="bg-success/10 text-success border-success/20 gap-1 px-3 py-1">
              <ShieldCheck className="h-3 w-3" /> Posted Entry
            </Badge>
          )}
          {!id && (
            <Button variant="secondary" size="sm" onClick={() => setType(type === 'Quick' ? 'Standard' : 'Quick')}>
              {type === 'Quick' ? 'Standard Mode' : 'Quick Entry'}
            </Button>
          )}
          {!isReadOnly && (
            <Button size="sm" onClick={() => handleSave(true)} disabled={createJournalEntry.isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Save className="h-4 w-4 mr-2" />
              {createJournalEntry.isPending ? "Saving..." : "Save"}
            </Button>
          )}
          {isReadOnly && (
            <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
              <Printer className="h-4 w-4" /> Print
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => navigate("/finance")} className="ml-2 border-primary/20 hover:bg-primary/5">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {isReadOnly ? "Back" : "Cancel"}
          </Button>
        </div>
      }
    >
      <div className="max-w-7xl mx-auto space-y-6 pb-20" onKeyDown={handleKeyDown}>
        <Card className={cn(
          "border-none shadow-sm bg-card/50 backdrop-blur-sm transition-all duration-300",
          type === "Quick" && "max-h-0 opacity-0 overflow-hidden py-0 my-0 border-0"
        )}>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {/* Row 1: Fiscal Year, AD Date, BS Miti, Voucher Type, Voucher No */}
              <div className="space-y-2">
                <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Fiscal Year <span className="text-destructive">*</span>
                </Label>
                <Select
                  disabled={isReadOnly}
                  value={formData.fiscal_year}
                  onValueChange={(v) => {
                    setFormData(p => {
                      const prefix = p.entry_type === "Journal Voucher" ? "JV" :
                                     p.entry_type === "Payment Voucher" ? "PV" :
                                     p.entry_type === "Receipt Voucher" ? "RV" :
                                     p.entry_type === "Contra Voucher" ? "CV" : "JV";
                      const shortFy = v.split('/').map(s => s.slice(-2)).join('/');
                      return {
                        ...p,
                        fiscal_year: v,
                        voucher_no: `${prefix}-${shortFy}-01`
                      };
                    });
                    // Jump to start of selected fiscal year
                    const limits: Record<string, { ad: string, bs: string }> = {
                      "2082/83": { ad: "2025-07-16", bs: "2082/04/01" },
                      "2081/82": { ad: "2024-07-16", bs: "2081/04/01" },
                      "2080/81": { ad: "2023-07-17", bs: "2080/04/01" },
                      "2079/80": { ad: "2022-07-17", bs: "2079/04/01" },
                    };
                    if (limits[v]) {
                      syncDates(limits[v].ad, limits[v].bs);
                    }
                  }}
                >
                  <SelectTrigger className="bg-background/50 border-muted-foreground/20 h-10 text-sm select-trigger">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2082/83">2082/83</SelectItem>
                    <SelectItem value="2081/82">2081/82</SelectItem>
                    <SelectItem value="2080/81">2080/81</SelectItem>
                    <SelectItem value="2079/80">2079/80</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Transaction Date AD <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    readOnly={isReadOnly}
                    placeholder="DD/MM/YYYY"
                    value={adDisplay}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAdDisplay(val);
                      const parsed = parseAdDate(val);
                      if (parsed) {
                        const bs = adToBs(parsed);
                        syncDates(parsed, bs);
                      }
                    }}
                    className="bg-background/50 border-muted-foreground/20 h-10 font-mono pr-8 text-sm ad-date-input"
                  />
                  <Popover>
                    <PopoverTrigger asChild disabled={isReadOnly}>
                      <button className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50">
                        <CalendarIcon className="h-3.5 w-3.5" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <div className="flex flex-col">
                        <Calendar
                          mode="single"
                          selected={fromDateStr(formData.posting_date)}
                          month={adMonth}
                          onMonthChange={setAdMonth}
                          onSelect={(date) => {
                            if (date) {
                              const ad = toYmd(date);
                              const bs = adToBs(ad);
                              syncDates(ad, bs);
                            }
                          }}
                          onDayClick={(date) => {
                            const ad = toYmd(date);
                            const bs = adToBs(ad);
                            syncDates(ad, bs);
                          }}
                          disabled={(date) => {
                            const ymd = toYmd(date);
                            const outOfFiscal = fiscalLimits ? (ymd < fiscalLimits.adStart || ymd > fiscalLimits.adEnd) : false;
                            const future = !allowFutureDates && date > new Date();
                            return outOfFiscal || future;
                          }}
                          initialFocus
                        />
                        <div className="p-2 border-t flex justify-center bg-muted/5">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-primary font-bold w-full hover:bg-primary/5"
                            onClick={() => {
                              const today = new Date();
                              syncDates(toYmd(today), adToBs(today));
                            }}
                          >
                            Today
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Miti (BS) <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    readOnly={isReadOnly}
                    placeholder="YYYY/MM/DD"
                    value={bsDisplay}
                    onChange={(e) => {
                      const val = e.target.value;
                      setBsDisplay(val);
                      const ad = bsToAd(val);
                      if (ad) {
                        syncDates(ad, val);
                      } else {
                        setFormData(p => ({ ...p, miti: val }));
                      }
                    }}
                    className="bg-background/50 border-muted-foreground/20 h-10 font-mono pr-8 text-sm bs-miti-input"
                  />
                  <Popover>
                    <PopoverTrigger asChild disabled={isReadOnly}>
                      <button className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50">
                        <CalendarIcon className="h-3.5 w-3.5" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <div className="flex flex-col">
                        <NepaliCalendar
                          selected={formData.miti}
                          disableFuture={!allowFutureDates}
                          minDate={fiscalLimits?.bsStart}
                          maxDate={fiscalLimits?.bsEnd}
                          onSelect={(bs) => {
                            const ad = bsToAd(bs);
                            if (ad) {
                              syncDates(ad, bs);
                            }
                          }}
                        />
                        <div className="p-2 border-t flex justify-center bg-muted/5">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-primary font-bold w-full hover:bg-primary/5"
                            onClick={() => {
                              const today = new Date();
                              syncDates(toYmd(today), adToBs(today));
                            }}
                          >
                            Today
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Voucher Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  disabled={isReadOnly || (formData.entry_type !== "" && !!id)}
                  value={formData.entry_type}
                  onValueChange={(v) => {
                    setFormData(p => {
                      const prefix = v === "Journal Voucher" ? "JV" :
                                     v === "Payment Voucher" ? "PV" :
                                     v === "Receipt Voucher" ? "RV" :
                                     v === "Contra Voucher" ? "CV" : "JV";
                      const shortFy = p.fiscal_year.split('/').map(s => s.slice(-2)).join('/');
                      return {
                        ...p,
                        entry_type: v,
                        voucher_no: `${prefix}-${shortFy}-01`
                      };
                    });
                  }}
                >
                  <SelectTrigger className="bg-background/50 border-muted-foreground/20 h-10 text-sm select-trigger voucher-type-select">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Journal Voucher">Journal Voucher</SelectItem>
                    <SelectItem value="Payment Voucher">Payment Voucher</SelectItem>
                    <SelectItem value="Receipt Voucher">Receipt Voucher</SelectItem>
                    <SelectItem value="Contra Voucher">Contra Voucher</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Voucher No.
                </Label>
                <div className="space-y-1">
                  <Input
                    readOnly
                    tabIndex={-1}
                    value={formData.voucher_no}
                    className="bg-muted/50 border-muted-foreground/20 h-10 font-mono text-amber-500 text-sm focus:ring-0 select-none pointer-events-none"
                    placeholder="Pick Type"
                  />
                  <p className="text-[9px] text-muted-foreground italic leading-tight">
                    * Assigned automatically
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="border-b bg-muted/30 px-6 py-4">
            <CardTitle className="text-base font-semibold">Accounting Entries</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div
              data-testid="accounting-entries-container"
              className={cn("overflow-hidden transition-all duration-300", !formData.entry_type && "opacity-50 pointer-events-none grayscale-[0.5]")}
            >
              <div className="w-full">
                <div className="grid grid-cols-[60px_40px_1fr_1.5fr_100px_100px_1.2fr] bg-muted/20 border-b items-center h-10 px-4">
                  <div className="text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Action</div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">No.</div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2">Sub Ledger</div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Ledger Account</div>
                  <div className="text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Debit</div>
                  <div className="text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Credit</div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-4">Remarks</div>
                </div>

                <Reorder.Group axis="y" values={formData.lines} onReorder={reorderLines} className="divide-y divide-muted-foreground/10">
                  {formData.lines.map((line, index) => (
                    <Reorder.Item
                      key={index}
                      value={line}
                      dragListener={!isReadOnly}
                      className={cn(
                        "grid grid-cols-[60px_40px_1fr_1.5fr_100px_100px_1.2fr] items-center h-14 px-4 bg-background/40 transition-colors group",
                        !isReadOnly && "hover:bg-muted/10",
                        editingRowIndex === index && "bg-primary/5"
                      )}
                    >
                      <div className="text-center skip-nav">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuItem className="gap-2" onClick={() => setEditingRowIndex(editingRowIndex === index ? null : index)}>
                              <Edit2 className="h-4 w-4" /> {editingRowIndex === index ? "Finish Editing" : "Edit Row"}
                            </DropdownMenuItem>
                            {!isReadOnly && (
                              <DropdownMenuItem className="gap-2 text-destructive" onClick={() => handleRemoveRow(index)}>
                                <Trash2 className="h-4 w-4" /> Delete Row
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="font-mono text-muted-foreground text-xs">{index + 1}</div>
                      <div className="px-2">
                        <Input
                          readOnly={isReadOnly || editingRowIndex !== index}
                          placeholder="Sub Ledger"
                          value={line.party_type}
                          data-row-index={index}
                          onChange={(e) => updateLine(index, "party_type", e.target.value)}
                          className={cn(
                            "border-none bg-transparent transition-colors focus:ring-0 px-0 h-8 placeholder:text-muted-foreground/30 text-sm sub-ledger-input",
                            editingRowIndex === index && "hover:bg-background/50"
                          )}
                        />
                      </div>
                      <div className="flex items-center gap-2 pr-4">
                        <div className="flex-1 min-w-0">
                          <Select
                            disabled={isReadOnly || editingRowIndex !== index}
                            value={line.account_id}
                            onValueChange={(v) => updateLine(index, "account_id", v)}
                          >
                            <SelectTrigger
                              data-row-index={index}
                              className={cn(
                                "border-none bg-transparent transition-colors focus:ring-0 px-0 h-8 w-full text-sm disabled:opacity-100 select-trigger ledger-account-select-trigger",
                                editingRowIndex === index && "hover:bg-background/50"
                              )}
                            >
                              <SelectValue placeholder="Select Account" />
                            </SelectTrigger>
                            <SelectContent className="ledger-account-select">
                              {accounts?.map((acc) => (
                                <SelectItem key={acc.id} value={acc.id}>
                                  {acc.name} - {acc.code}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {!isReadOnly && editingRowIndex === index && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 skip-nav"
                            tabIndex={-1}
                            onClick={() => {
                              setCurrentRowIndex(index);
                              setLedgerDialogOpen(true);
                            }}
                          >
                            <Plus className="h-3 w-3 text-primary" />
                          </Button>
                        )}
                      </div>
                      <div className="pr-4">
                        <Input
                          readOnly={isReadOnly || editingRowIndex !== index}
                          type="number"
                          placeholder="0.00"
                          value={line.debit || ""}
                          data-row-index={index}
                          onChange={(e) => updateLine(index, "debit", parseFloat(e.target.value) || 0)}
                          className={cn(
                            "text-right border-none bg-transparent transition-colors focus:ring-0 h-8 font-mono text-sm debit-input",
                            editingRowIndex === index && "hover:bg-background/50"
                          )}
                        />
                      </div>
                      <div className="pr-4">
                        <Input
                          readOnly={isReadOnly || editingRowIndex !== index}
                          type="number"
                          placeholder="0.00"
                          value={line.credit || ""}
                          data-row-index={index}
                          onChange={(e) => updateLine(index, "credit", parseFloat(e.target.value) || 0)}
                          className={cn(
                            "text-right border-none bg-transparent transition-colors focus:ring-0 h-8 font-mono text-sm credit-input",
                            editingRowIndex === index && "hover:bg-background/50"
                          )}
                        />
                      </div>
                      <div className="px-4">
                        <Input
                          readOnly={isReadOnly || editingRowIndex !== index}
                          placeholder="Remarks"
                          value={line.party}
                          data-row-index={index}
                          onChange={(e) => updateLine(index, "party", e.target.value)}
                          className={cn(
                            "border-none bg-transparent transition-colors focus:ring-0 px-0 h-8 placeholder:text-muted-foreground/30 w-full text-sm remarks-input",
                            editingRowIndex === index && "hover:bg-background/50"
                          )}
                        />
                      </div>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              </div>
            </div>
            <div className="p-4 bg-muted/5 flex items-center justify-between border-t">
              <div className="flex gap-2">
                {!isReadOnly && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => handleAddRow(1)} className="h-8 text-xs font-semibold">
                      <Plus className="h-3 w-3 mr-1" /> Add Row
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleAddRow(5)} className="h-8 text-xs font-semibold">
                      <Plus className="h-3 w-3 mr-1" /> Add Multiple (5)
                    </Button>
                  </>
                )}
                {isReadOnly && (
                   <div className="text-xs text-muted-foreground italic flex items-center h-8">
                     * This entry has been posted and cannot be modified.
                   </div>
                )}
              </div>

              <div className="grid grid-cols-[120px_120px_2fr_80px] items-center gap-0 w-[520px]">
                <div className="text-right pr-4">
                  <div className="text-[10px] font-semibold uppercase text-muted-foreground mb-1">Total Debit</div>
                  <div className="font-mono font-bold text-sm">${totals.debit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>
                <div className="text-right pr-4">
                  <div className="text-[10px] font-semibold uppercase text-muted-foreground mb-1">Total Credit</div>
                  <div className="font-mono font-bold text-sm">${totals.credit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>
                <div className="px-4">
                  <div className="text-[10px] font-semibold uppercase text-muted-foreground mb-1">Difference</div>
                  <div className={cn(
                    "font-mono font-bold text-sm",
                    Math.abs(totals.debit - totals.credit) < 0.01 ? "text-success" : "text-destructive"
                  )}>
                    ${Math.abs(totals.debit - totals.credit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="w-20"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          data-testid="attachments-container"
          className={cn("border-none shadow-sm bg-card/50 backdrop-blur-sm transition-all duration-300", !formData.entry_type && "opacity-50 pointer-events-none grayscale-[0.5]")}
        >
          <CardHeader className="border-b bg-muted/30 px-6 py-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Paperclip className="h-4 w-4" />
              Attachments
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-4">
                {!isReadOnly && (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/20 rounded-lg p-4 hover:border-primary/50 transition-colors cursor-pointer group relative bg-muted/5"
                  >
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*,application/pdf"
                    />
                    <div className="h-10 w-10 rounded-full bg-primary/5 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                      <Upload className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-xs font-medium">Click to upload or drag and drop</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">PDF, JPG, PNG up to 2MB</p>
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Attached Files ({attachments.length})</p>
                  <div className="grid grid-cols-1 gap-2">
                    {attachments.length === 0 && (
                      <div className="text-center py-3 border rounded-md border-dashed bg-muted/10 text-muted-foreground text-[10px]">
                        No files attached
                      </div>
                    )}
                    {attachments.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-2 rounded-md bg-muted/30 border border-muted-foreground/10 group">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileIcon className={cn(
                            "h-3.5 w-3.5 flex-shrink-0",
                            file.type.includes('image') ? "text-amber-500" : "text-blue-500"
                          )} />
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-medium truncate">{file.name}</span>
                            <span className="text-[9px] text-muted-foreground">{file.size}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => file.url && window.open(file.url, '_blank')}
                            title="Preview"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <a
                            href={file.url}
                            download={file.name}
                            className={cn(
                              buttonVariants({ variant: "ghost", size: "icon" }),
                              "h-6 w-6"
                            )}
                            title="Download"
                          >
                            <ArrowDown className="h-3 w-3" />
                          </a>
                          {!isReadOnly && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                setAttachmentToDelete(file.id);
                                setDeleteConfirmOpen(true);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Narration <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    readOnly={isReadOnly}
                    placeholder="Brief description of the entry..."
                    className="bg-background/50 border-muted-foreground/20 h-11"
                    value={formData.narration}
                    onChange={(e) => setFormData(p => ({...p, narration: e.target.value}))}
                    required
                  />
                </div>
                {!isReadOnly && (
                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => handleSave(false)}
                      disabled={createJournalEntry.isPending}
                      className="border-primary/20 hover:bg-primary/5 text-primary"
                    >
                      Save & New
                    </Button>
                    <Button
                      onClick={() => handleSave(true)}
                      disabled={createJournalEntry.isPending}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[100px] main-save-btn"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </div>
                )}
              </div>

            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Attachment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this attachment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (attachmentToDelete) {
                  removeAttachment(attachmentToDelete);
                  setDeleteConfirmOpen(false);
                  setAttachmentToDelete(null);
                }
              }}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={ledgerDialogOpen} onOpenChange={setLedgerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Ledger</DialogTitle>
            <DialogDescription>Add a new ledger to the chart of accounts</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ledger Code</Label>
                <Input
                  placeholder="e.g., 1000"
                  value={newLedger.code}
                  onChange={(e) => setNewLedger((p) => ({ ...p, code: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Ledger Type</Label>
                <Select
                  value={newLedger.type}
                  onValueChange={(v: Account["type"]) =>
                    setNewLedger((p) => ({ ...p, type: v }))
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
              <Label>Ledger Name</Label>
              <Input
                placeholder="e.g., Cash on Hand"
                value={newLedger.name}
                onChange={(e) => setNewLedger((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Input
                placeholder="Brief description..."
                value={newLedger.description}
                onChange={(e) => setNewLedger((p) => ({ ...p, description: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setLedgerDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateLedger} disabled={createAccount.isPending}>
                {createAccount.isPending ? "Creating..." : "Create Ledger"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
