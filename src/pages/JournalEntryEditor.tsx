import { useState, useMemo, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
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
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type") || "Standard";

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
  const [attachments, setAttachments] = useState<{ id: string, name: string, size: string, type: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    entry_type: "Journal Voucher",
    series: "ACC-JV-.YYYY.-",
    company: "Unico Plastics Inc.",
    posting_date: new Date().toISOString().split("T")[0],
    miti: adToBs(new Date()),
    fiscal_year: "2080/81",
    voucher_no: "Generated Automatically",
    finance_book: "",
    from_template: "",
    reference_number: "",
    lines: [
      { account_id: "", party_type: "", party: "", debit: 0, credit: 0 },
      { account_id: "", party_type: "", party: "", debit: 0, credit: 0 },
    ] as JournalLineItem[],
  });

  const [adDisplay, setAdDisplay] = useState(formatAdDate(formData.posting_date));
  const [bsDisplay, setBsDisplay] = useState(formData.miti);

  const syncDates = (newAd: string, newBs: string) => {
    setFormData(prev => ({ ...prev, posting_date: newAd, miti: newBs }));
    setAdDisplay(formatAdDate(newAd));
    setBsDisplay(newBs);
  };

  // Sync posting date with business date
  useEffect(() => {
    if (businessDate && !id && !isDirty) {
      const bs = adToBs(businessDate);
      syncDates(businessDate, bs);
    }
  }, [businessDate, id, isDirty]);

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
        reference_number: entryData.reference || "",
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

    setFormData((prev) => ({
      ...prev,
      lines: [...prev.lines, ...newRows],
    }));
    setIsDirty(true);
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
    if (e.key === "Enter") {
      const target = e.target as HTMLElement;
      // Skip buttons like plus, edit, delete
      if (target.tagName === "BUTTON" || target.closest(".skip-nav")) return;

      const form = document.querySelector("main");
      if (form) {
        const focusableElements = Array.from(form.querySelectorAll(
          'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [contenteditable="true"]'
        )).filter(el => {
          const style = window.getComputedStyle(el);
          return style.display !== 'none' && style.visibility !== 'hidden' && (el as HTMLElement).tabIndex !== -1;
        });

        const index = focusableElements.indexOf(target);
        if (index > -1 && index < focusableElements.length - 1) {
          (focusableElements[index + 1] as HTMLElement).focus();
          e.preventDefault();
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

    const newAttachments = Array.from(files).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      type: file.type
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

  const handleSave = async () => {
    if (!isBalanced) {
      toast.error("Debit and Credit totals must be equal and greater than zero");
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
      description: `Journal Entry - ${formData.reference_number || 'No Ref'}`,
      reference: formData.reference_number,
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
      navigate("/finance");
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
          <Button variant="outline" onClick={() => navigate("/finance")}>
            {isReadOnly ? "Back" : "Cancel"}
          </Button>
          {!id && (
            <Button variant="secondary" onClick={() => navigate(`/finance/journal/new?type=${type === 'Quick' ? 'Standard' : 'Quick'}`)}>
              {type === 'Quick' ? 'Standard Mode' : 'Quick Entry'}
            </Button>
          )}
          {!isReadOnly && (
            <Button onClick={handleSave} disabled={createJournalEntry.isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Save className="h-4 w-4 mr-2" />
              {createJournalEntry.isPending ? "Saving..." : "Save"}
            </Button>
          )}
          {isReadOnly && (
            <Button variant="outline" className="gap-2" onClick={() => window.print()}>
              <Printer className="h-4 w-4" /> Print
            </Button>
          )}
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
                  onValueChange={(v) => setFormData(p => ({...p, fiscal_year: v}))}
                >
                  <SelectTrigger className="bg-background/50 border-muted-foreground/20 h-10 text-sm">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2080/81">2080/81</SelectItem>
                    <SelectItem value="2079/80">2079/80</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Date (AD) <span className="text-destructive">*</span>
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
                        setFormData(p => ({ ...p, posting_date: parsed, miti: bs }));
                        setBsDisplay(bs);
                      }
                    }}
                    className="bg-background/50 border-muted-foreground/20 h-10 font-mono pr-8 text-sm"
                  />
                  <Popover>
                    <PopoverTrigger asChild disabled={isReadOnly}>
                      <button className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50">
                        <CalendarIcon className="h-3.5 w-3.5" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        mode="single"
                        selected={fromDateStr(formData.posting_date)}
                        month={fromDateStr(formData.posting_date)}
                        onSelect={(date) => {
                          if (date) {
                            const ad = toYmd(date);
                            const bs = adToBs(ad);
                            syncDates(ad, bs);
                          }
                        }}
                        disabled={(date) => !allowFutureDates && date > new Date()}
                        initialFocus
                      />
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
                        setFormData(p => ({ ...p, miti: val, posting_date: ad }));
                        setAdDisplay(formatAdDate(ad));
                      } else {
                        setFormData(p => ({ ...p, miti: val }));
                      }
                    }}
                    className="bg-background/50 border-muted-foreground/20 h-10 font-mono pr-8 text-sm"
                  />
                  <Popover>
                    <PopoverTrigger asChild disabled={isReadOnly}>
                      <button className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50">
                        <CalendarIcon className="h-3.5 w-3.5" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <NepaliCalendar
                        selected={formData.miti}
                        disableFuture={!allowFutureDates}
                        onSelect={(bs) => {
                          const ad = bsToAd(bs);
                          if (ad) {
                            syncDates(ad, bs);
                          }
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Voucher Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  disabled={isReadOnly}
                  value={formData.entry_type}
                  onValueChange={(v) => setFormData(p => ({...p, entry_type: v}))}
                >
                  <SelectTrigger className="bg-background/50 border-muted-foreground/20 h-10 text-sm">
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
                    value={formData.voucher_no}
                    className="bg-muted/50 border-muted-foreground/20 h-10 font-mono font-bold text-primary text-sm"
                    placeholder="Auto"
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
            <div className="overflow-x-auto">
              <div className="min-w-[1100px]">
                <div className="grid grid-cols-[50px_60px_2.5fr_1.5fr_120px_120px_2fr_80px] bg-muted/20 border-b items-center h-10 px-4">
                  <div className="text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">#</div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">No.</div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Account</div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2">Sub Ledger</div>
                  <div className="text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Debit</div>
                  <div className="text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Credit</div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-4">Remarks</div>
                  <div className="text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground pr-4">Action</div>
                </div>

                <Reorder.Group axis="y" values={formData.lines} onReorder={reorderLines} className="divide-y divide-muted-foreground/10">
                  {formData.lines.map((line, index) => (
                    <Reorder.Item
                      key={index}
                      value={line}
                      dragListener={!isReadOnly}
                      className={cn(
                        "grid grid-cols-[50px_60px_2.5fr_1.5fr_120px_120px_2fr_80px] items-center h-14 px-4 bg-background/40 transition-colors group",
                        !isReadOnly && "hover:bg-muted/10"
                      )}
                    >
                      <div className={cn(
                        "flex justify-center text-muted-foreground transition-colors skip-nav",
                        !isReadOnly ? "cursor-grab active:cursor-grabbing hover:text-primary" : "opacity-30"
                      )}>
                        <MoreVertical className="h-4 w-4" />
                      </div>
                      <div className="font-mono text-muted-foreground text-sm pl-2">{index + 1}</div>
                      <div className="flex items-center gap-2 pr-4">
                        <div className="flex-1 min-w-0">
                          <Select
                            disabled={isReadOnly}
                            value={line.account_id}
                            onValueChange={(v) => updateLine(index, "account_id", v)}
                          >
                            <SelectTrigger className="border-none bg-transparent hover:bg-background/50 transition-colors focus:ring-0 px-0 h-8 font-semibold w-full text-sm disabled:opacity-100">
                              <SelectValue placeholder="Select Account" />
                            </SelectTrigger>
                            <SelectContent>
                              {accounts?.map((acc) => (
                                <SelectItem key={acc.id} value={acc.id}>
                                  {acc.name} - {acc.code}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {!isReadOnly && (
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
                      <div className="px-2">
                        <Input
                          readOnly={isReadOnly}
                          placeholder="Sub Ledger"
                          value={line.party_type}
                          onChange={(e) => updateLine(index, "party_type", e.target.value)}
                          className="border-none bg-transparent hover:bg-background/50 transition-colors focus:ring-0 px-0 h-8 placeholder:text-muted-foreground/30 text-sm"
                        />
                      </div>
                      <div className="pr-4">
                        <Input
                          readOnly={isReadOnly}
                          type="number"
                          placeholder="0.00"
                          value={line.debit || ""}
                          onChange={(e) => updateLine(index, "debit", parseFloat(e.target.value) || 0)}
                          className="text-right border-none bg-transparent hover:bg-background/50 transition-colors focus:ring-0 h-8 font-mono font-bold text-sm"
                        />
                      </div>
                      <div className="pr-4">
                        <Input
                          readOnly={isReadOnly}
                          type="number"
                          placeholder="0.00"
                          value={line.credit || ""}
                          onChange={(e) => updateLine(index, "credit", parseFloat(e.target.value) || 0)}
                          className="text-right border-none bg-transparent hover:bg-background/50 transition-colors focus:ring-0 h-8 font-mono font-bold text-sm"
                        />
                      </div>
                      <div className="px-4">
                        <Input
                          readOnly={isReadOnly}
                          placeholder="Remarks"
                          value={line.party}
                          onChange={(e) => updateLine(index, "party", e.target.value)}
                          className="border-none bg-transparent hover:bg-background/50 transition-colors focus:ring-0 px-0 h-8 placeholder:text-muted-foreground/30 w-full text-sm"
                        />
                      </div>
                      <div className="text-right pr-4 skip-nav">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="gap-2">
                              <Eye className="h-4 w-4" /> View
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2">
                              <Edit2 className="h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2">
                              <Printer className="h-4 w-4" /> Print
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-destructive" onClick={() => handleRemoveRow(index)}>
                              <Trash2 className="h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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

        <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
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
                    className="flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/20 rounded-lg p-8 hover:border-primary/50 transition-colors cursor-pointer group relative"
                  >
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*,application/pdf"
                    />
                    <div className="h-12 w-12 rounded-full bg-primary/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Upload className="h-6 w-6 text-primary" />
                    </div>
                    <p className="text-sm font-medium">Click to upload or drag and drop</p>
                    <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG up to 10MB</p>
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Attached Files ({attachments.length})</p>
                  <div className="space-y-2">
                    {attachments.length === 0 && (
                      <div className="text-center py-4 border rounded-md border-dashed bg-muted/10 text-muted-foreground text-xs">
                        No files attached
                      </div>
                    )}
                    {attachments.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-2 rounded-md bg-muted/30 border border-muted-foreground/10 group">
                        <div className="flex items-center gap-3">
                          <FileIcon className={cn(
                            "h-4 w-4",
                            file.type.includes('image') ? "text-amber-500" : "text-blue-500"
                          )} />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium truncate max-w-[200px]">{file.name}</span>
                            <span className="text-[10px] text-muted-foreground">{file.size}</span>
                          </div>
                        </div>
                        {!isReadOnly && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeAttachment(file.id);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Reference Number
                  </Label>
                  <Input
                    readOnly={isReadOnly}
                    placeholder="Invoice #, etc."
                    className="bg-background/50 border-muted-foreground/20 h-11"
                    value={formData.reference_number}
                    onChange={(e) => setFormData(p => ({...p, reference_number: e.target.value}))}
                  />
                </div>
              </div>

            </div>
          </CardContent>
        </Card>
      </div>

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
