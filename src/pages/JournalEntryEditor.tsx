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
  ChevronRight,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  MoreVertical,
  Edit2,
  AlertCircle,
  Paperclip,
  Upload,
  Calendar as CalendarIcon,
  ShieldCheck,
} from "lucide-react";
import { useAccounts, useCreateJournalEntry, useJournalEntry, useUpdateJournalEntry, Account } from "@/hooks/useFinance";
import { toast } from "sonner";
import { adToBs, bsToAd, formatAdDate, parseAdDate, toYmd, fromDateStr } from "@/utils/nepaliDate";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { NepaliCalendar } from "@/components/ui/nepali-calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

  const { data: accounts } = useAccounts();
  const { data: entryData } = useJournalEntry(id);
  const isReadOnly = entryData?.is_posted || false;
  const createJournalEntry = useCreateJournalEntry();
  const updateJournalEntry = useUpdateJournalEntry();

  const [isDirty, setIsDirty] = useState(false);
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const [attachments, setAttachments] = useState<{ id: string, name: string, size: string, type: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    entry_type: "",
    series: "ACC-JV-.YYYY.-",
    company: "LuxeStay ERP",
    posting_date: toYmd(new Date()),
    miti: adToBs(new Date()),
    fiscal_year: "2081/82",
    voucher_no: "",
    narration: "",
    lines: [
      { account_id: "", party_type: "", party: "", debit: 0, credit: 0 },
      { account_id: "", party_type: "", party: "", debit: 0, credit: 0 },
    ] as JournalLineItem[],
  });

  const [adDisplay, setAdDisplay] = useState(formatAdDate(toYmd(new Date())));
  const [bsDisplay, setBsDisplay] = useState(adToBs(new Date()));
  const [adMonth, setAdMonth] = useState<Date>(new Date());

  const syncDates = (newAd: string, newBs: string) => {
    setFormData(prev => {
      let voucherNo = prev.voucher_no;
      if (prev.entry_type) {
        const prefix = prev.entry_type === "Journal Voucher" ? "JV" :
                       prev.entry_type === "Payment Voucher" ? "PV" : "JV";
        const shortFy = prev.fiscal_year.split('/').map(s => s.slice(-2)).join('/');
        voucherNo = `${prefix}-${shortFy}-01`;
      }
      return { ...prev, posting_date: newAd, miti: newBs, voucher_no: voucherNo };
    });
    setAdDisplay(formatAdDate(newAd));
    setBsDisplay(newBs);
    const date = fromDateStr(newAd);
    if (date) setAdMonth(date);
  };

  useEffect(() => {
    if (id && entryData) {
      const bs = entryData.miti || adToBs(entryData.date);
      setFormData({
        entry_type: entryData.voucher_type || "Journal Voucher",
        series: entryData.series || "ACC-JV-.YYYY.-",
        company: "LuxeStay ERP",
        posting_date: entryData.date,
        miti: bs,
        fiscal_year: entryData.fiscal_year || "2081/82",
        voucher_no: entryData.entry_number,
        narration: entryData.reference || "",
        lines: entryData.lines?.map(l => ({
          account_id: l.account_id,
          party_type: l.sub_ledger || l.party_type || "",
          party: l.description || l.party_id || "",
          debit: l.debit,
          credit: l.credit
        })) || [],
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

  const difference = Math.abs(totals.debit - totals.credit);
  const isBalanced = difference < 0.01 && totals.debit > 0;

  const handleAddRow = (count: number = 1) => {
    const newRows = Array(count).fill(null).map(() => ({ account_id: "", party_type: "", party: "", debit: 0, credit: 0 }));
    setFormData(prev => ({ ...prev, lines: [...prev.lines, ...newRows] }));
    setIsDirty(true);
  };

  const handleRemoveRow = (index: number) => {
    if (formData.lines.length <= 2) return;
    const newLines = [...formData.lines];
    newLines.splice(index, 1);
    setFormData(prev => ({ ...prev, lines: newLines }));
    setIsDirty(true);
  };

  const updateLine = (index: number, field: keyof JournalLineItem, value: any) => {
    const newLines = [...formData.lines];
    newLines[index] = { ...newLines[index], [field]: value };
    if (field === "debit" && value > 0) newLines[index].credit = 0;
    if (field === "credit" && value > 0) newLines[index].debit = 0;
    setFormData(prev => ({ ...prev, lines: newLines }));
    setIsDirty(true);
  };

  const handleSave = async (shouldNavigate: boolean = true) => {
    if (!isBalanced) { toast.error("Entry is not balanced"); return; }
    if (!formData.narration) { toast.error("Narration is mandatory"); return; }
    const payload = {
      date: formData.posting_date, miti: formData.miti, fiscal_year: formData.fiscal_year,
      voucher_type: formData.entry_type, description: `Journal Entry - ${formData.narration}`,
      reference: formData.narration, series: formData.series,
      lines: formData.lines.filter(l => l.account_id && (l.debit > 0 || l.credit > 0))
        .map(l => ({ account_id: l.account_id, debit: l.debit, credit: l.credit, description: l.party || null, sub_ledger: l.party_type || null }))
    };
    try {
      if (id) await updateJournalEntry.mutateAsync({ id, entry: payload });
      else await createJournalEntry.mutateAsync(payload);
      toast.success("Saved successfully");
      setIsDirty(false);
      if (shouldNavigate) navigate("/finance");
      else {
        setFormData(p => ({ ...p, narration: "", lines: [{ account_id: "", party_type: "", party: "", debit: 0, credit: 0 }, { account_id: "", party_type: "", party: "", debit: 0, credit: 0 }] }));
        setAttachments([]);
      }
    } catch (error) { toast.error("Failed to save"); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      const target = e.target as HTMLElement;
      if (target.classList.contains('remarks-input')) {
        const rowIdx = parseInt(target.getAttribute('data-row-index') || "-1");
        if (rowIdx === formData.lines.length - 1 && formData.lines[rowIdx].account_id) {
          handleAddRow(1); e.preventDefault();
        }
      }
      if (target.classList.contains('ledger-account-select-trigger')) {
        const rowIdx = parseInt(target.getAttribute('data-row-index') || "-1");
        if (rowIdx !== -1 && !formData.lines[rowIdx].account_id) {
          (document.querySelector('.main-save-btn') as HTMLElement)?.focus();
          e.preventDefault();
        }
      }
    }
  };

  return (
    <MainLayout
      title={id ? "Edit Journal Entry" : "New Journal Entry"}
      subtitle={
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
          <button onClick={() => navigate("/finance")} className="hover:text-primary">Accounting</button>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">Journal Entry</span>
        </div>
      }
      actions={
        <div className="flex items-center gap-3">
          {isReadOnly && <Badge className="bg-success/10 text-success border-success/20"><ShieldCheck className="h-3 w-3 mr-1" /> Posted</Badge>}
          {isDirty && <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20"><AlertCircle className="h-3 w-3 mr-1" /> Not Saved</Badge>}
          <Button variant="outline" size="sm" onClick={() => navigate("/finance")}><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button>
        </div>
      }
    >
      <div className="max-w-7xl mx-auto space-y-6 pb-20" onKeyDown={handleKeyDown}>
        <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div className="space-y-2">
                <Label className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">Fiscal Year <span className="text-destructive">*</span></Label>
                <Select value={formData.fiscal_year} onValueChange={(v) => setFormData(p => ({...p, fiscal_year: v}))}>
                  <SelectTrigger className="h-10 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="2081/82">2081/82</SelectItem><SelectItem value="2080/81">2080/81</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">Transaction Date AD <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Input value={adDisplay} onChange={(e) => {setAdDisplay(e.target.value); const p = parseAdDate(e.target.value); if(p) syncDates(p, adToBs(p));}} className="h-10 font-mono text-sm ad-date-input pr-8" />
                  <Popover><PopoverTrigger asChild><button className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"><CalendarIcon className="h-3.5 w-3.5" /></button></PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={fromDateStr(formData.posting_date)} month={adMonth} onMonthChange={setAdMonth} onSelect={(d) => {if(d) {const ad=toYmd(d); syncDates(ad, adToBs(ad));}}}/></PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">Miti (BS) <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Input value={bsDisplay} onChange={(e) => {setBsDisplay(e.target.value); const ad = bsToAd(e.target.value); if(ad) syncDates(ad, e.target.value);}} className="h-10 font-mono text-sm bs-miti-input pr-8" />
                  <Popover><PopoverTrigger asChild><button className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"><CalendarIcon className="h-3.5 w-3.5" /></button></PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><NepaliCalendar selected={formData.miti} onSelect={(bs) => {const ad=bsToAd(bs); if(ad) syncDates(ad, bs);}}/></PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">Voucher Type <span className="text-destructive">*</span></Label>
                <Select value={formData.entry_type} onValueChange={(v) => {
                  setFormData(p => {
                    const prefix = v === "Journal Voucher" ? "JV" : v === "Payment Voucher" ? "PV" : v === "Receipt Voucher" ? "RV" : "CV";
                    const shortFy = p.fiscal_year.split('/').map(s => s.slice(-2)).join('/');
                    return { ...p, entry_type: v, voucher_no: `${prefix}-${shortFy}-01` };
                  });
                }}>
                  <SelectTrigger className="h-10 text-sm voucher-type-select"><SelectValue placeholder="Pick Type" /></SelectTrigger>
                  <SelectContent><SelectItem value="Journal Voucher">Journal Voucher</SelectItem><SelectItem value="Payment Voucher">Payment Voucher</SelectItem><SelectItem value="Receipt Voucher">Receipt Voucher</SelectItem><SelectItem value="Contra Voucher">Contra Voucher</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">Voucher No.</Label>
                <div className="space-y-1"><Input readOnly value={formData.voucher_no} className="h-10 font-mono text-amber-500 text-sm bg-muted/50" /><p className="text-[9px] text-muted-foreground italic leading-tight">* Assigned automatically</p></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="border-b bg-muted/30 px-6 py-4"><CardTitle className="text-base font-semibold">Accounting Entries</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div data-testid="accounting-entries-container" className={cn("transition-all duration-300", !formData.entry_type && "opacity-50 pointer-events-none grayscale")}>
              <div className="grid grid-cols-[60px_40px_1fr_1.5fr_100px_100px_1.2fr] bg-muted/20 border-b h-10 px-4 items-center">
                <div className="text-center text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">Action</div>
                <div className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">No.</div>
                <div className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider px-2">Sub Ledger</div>
                <div className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">Ledger Account</div>
                <div className="text-right text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">Debit</div>
                <div className="text-right text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">Credit</div>
                <div className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider px-4">Remarks</div>
              </div>
              <div className="divide-y divide-muted-foreground/10">
                {formData.lines.map((line, index) => (
                  <div key={index} className={cn("grid grid-cols-[60px_40px_1fr_1.5fr_100px_100px_1.2fr] items-center h-14 px-4 bg-background/40 hover:bg-muted/10", editingRowIndex === index && "bg-primary/5")}>
                    <div className="text-center">
                      <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 row-action-trigger"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent><DropdownMenuItem onClick={() => setEditingRowIndex(index)}><Edit2 className="h-4 w-4 mr-2" /> Edit Row</DropdownMenuItem>{!isReadOnly && <DropdownMenuItem className="text-destructive" onClick={() => handleRemoveRow(index)}><Trash2 className="h-4 w-4 mr-2" /> Delete Row</DropdownMenuItem>}</DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="font-mono text-muted-foreground text-xs">{index + 1}</div>
                    <div className="px-2"><Input readOnly={editingRowIndex !== index} value={line.party_type} onChange={(e) => updateLine(index, "party_type", e.target.value)} className="border-none bg-transparent h-8 text-sm sub-ledger-input px-0 focus:ring-0" placeholder="Sub Ledger" /></div>
                    <div className="flex items-center gap-2">
                      <Select disabled={editingRowIndex !== index} value={line.account_id} onValueChange={(v) => updateLine(index, "account_id", v)}>
                        <SelectTrigger data-row-index={index} className="border-none bg-transparent h-8 text-sm ledger-account-select-trigger px-0 focus:ring-0 w-full"><SelectValue placeholder="Select Account" /></SelectTrigger>
                        <SelectContent className="ledger-account-select">{accounts?.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name} - {acc.code}</SelectItem>)}</SelectContent>
                      </Select>
                      {editingRowIndex === index && <Button variant="ghost" size="icon" className="h-6 w-6"><Plus className="h-3 w-3 text-primary" /></Button>}
                    </div>
                    <div className="pr-4"><Input type="number" readOnly={editingRowIndex !== index} value={line.debit || ""} onChange={(e) => updateLine(index, "debit", parseFloat(e.target.value) || 0)} className="text-right border-none bg-transparent h-8 font-mono text-sm debit-input focus:ring-0" placeholder="0.00" /></div>
                    <div className="pr-4"><Input type="number" readOnly={editingRowIndex !== index} value={line.credit || ""} onChange={(e) => updateLine(index, "credit", parseFloat(e.target.value) || 0)} className="text-right border-none bg-transparent h-8 font-mono text-sm credit-input focus:ring-0" placeholder="0.00" /></div>
                    <div className="px-4"><Input readOnly={editingRowIndex !== index} value={line.party} data-row-index={index} onChange={(e) => updateLine(index, "party", e.target.value)} className="border-none bg-transparent h-8 text-sm remarks-input px-0 focus:ring-0" placeholder="Remarks" /></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 bg-muted/5 flex items-center justify-between border-t">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleAddRow(1)} className="h-8 text-xs font-semibold"><Plus className="h-3 w-3 mr-1" /> Add Row</Button>
                <Button variant="outline" size="sm" onClick={() => handleAddRow(5)} className="h-8 text-xs font-semibold"><Plus className="h-3 w-3 mr-1" /> Add Multiple (5)</Button>
              </div>
              <div className="grid grid-cols-[120px_120px_140px] gap-4 mr-4 text-right">
                <div><div className="text-[10px] font-semibold uppercase text-muted-foreground mb-1">Total Debit</div><div className="font-mono font-bold text-sm">${totals.debit.toLocaleString(undefined, {minimumFractionDigits: 2})}</div></div>
                <div><div className="text-[10px] font-semibold uppercase text-muted-foreground mb-1">Total Credit</div><div className="font-mono font-bold text-sm">${totals.credit.toLocaleString(undefined, {minimumFractionDigits: 2})}</div></div>
                <div><div className="text-[10px] font-semibold uppercase text-muted-foreground mb-1">Difference</div><div className={cn("font-mono font-bold text-sm", difference < 0.01 ? "text-success" : "text-destructive")}>${difference.toLocaleString(undefined, {minimumFractionDigits: 2})}</div></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={cn("border-none shadow-sm bg-card/50 backdrop-blur-sm", !formData.entry_type && "opacity-50 pointer-events-none grayscale")}>
          <CardHeader className="border-b bg-muted/30 px-6 py-4"><CardTitle className="text-base font-semibold flex items-center gap-2"><Paperclip className="h-4 w-4" /> Attachments</CardTitle></CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-4">
                <div onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 cursor-pointer hover:bg-muted/5 bg-muted/5 group">
                  <input type="file" multiple className="hidden" ref={fileInputRef} /><Upload className="h-8 w-8 text-primary mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-xs font-medium">Click to upload or drag and drop</p><p className="text-[10px] text-muted-foreground mt-1">PDF, JPG, PNG up to 2MB</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2"><Label className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">Narration <span className="text-destructive">*</span></Label>
                  <Input placeholder="Brief description..." className="h-11 bg-background/50" value={formData.narration} onChange={(e) => setFormData(p => ({...p, narration: e.target.value}))}/>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => handleSave(false)}>Save & New</Button>
                  <Button onClick={() => handleSave(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[100px] main-save-btn"><Save className="h-4 w-4 mr-2" /> Save</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
