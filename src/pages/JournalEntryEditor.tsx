import { useState, useMemo, useEffect } from "react";
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
} from "lucide-react";
import { useAccounts, useCreateJournalEntry, useJournalEntry, useUpdateJournalEntry } from "@/hooks/useFinance";
import { useBusinessDate } from "@/hooks/useSettings";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

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
  const createJournalEntry = useCreateJournalEntry();
  const updateJournalEntry = useUpdateJournalEntry();
  const { data: businessDate } = useBusinessDate();

  const [isDirty, setIsDirty] = useState(false);
  const [formData, setFormData] = useState({
    entry_type: "Journal Entry",
    series: "ACC-JV-.YYYY.-",
    company: "Unico Plastics Inc.",
    posting_date: new Date().toISOString().split("T")[0],
    finance_book: "",
    from_template: "",
    reference_number: "",
    lines: [
      { account_id: "", party_type: "", party: "", debit: 0, credit: 0 },
      { account_id: "", party_type: "", party: "", debit: 0, credit: 0 },
    ] as JournalLineItem[],
  });

  // Sync posting date with business date
  useEffect(() => {
    if (businessDate && !id && !isDirty) {
      setFormData(prev => ({ ...prev, posting_date: businessDate }));
    }
  }, [businessDate, id, isDirty]);

  // Load existing entry if editing
  useEffect(() => {
    if (id && entryData) {
      setFormData({
        entry_type: entryData.voucher_type || "Journal Entry",
        series: entryData.series || "ACC-JV-.YYYY.-",
        company: "Unico Plastics Inc.", // Mocked for now
        posting_date: entryData.date,
        finance_book: entryData.finance_book || "",
        from_template: entryData.from_template || "",
        reference_number: entryData.reference || "",
        lines: entryData.lines?.map(l => ({
          account_id: l.account_id,
          party_type: l.party_type || "",
          party: l.party_id || "",
          debit: l.debit,
          credit: l.credit
        })) || [
          { account_id: "", party_type: "", party: "", debit: 0, credit: 0 },
          { account_id: "", party_type: "", party: "", debit: 0, credit: 0 },
        ],
      });
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

  const updateLine = (index: number, field: keyof JournalLineItem, value: any) => {
    const newLines = [...formData.lines];
    newLines[index] = { ...newLines[index], [field]: value };

    // Auto-clear credit if debit is entered, and vice versa
    if (field === "debit" && value > 0) newLines[index].credit = 0;
    if (field === "credit" && value > 0) newLines[index].debit = 0;

    setFormData((prev) => ({ ...prev, lines: newLines }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (!isBalanced) {
      toast.error("Debit and Credit totals must be equal and greater than zero");
      return;
    }

    const payload = {
      date: formData.posting_date,
      description: `Journal Entry - ${formData.reference_number || 'No Ref'}`,
      reference: formData.reference_number,
      voucher_type: formData.entry_type,
      series: formData.series,
      finance_book: formData.finance_book,
      from_template: formData.from_template,
      lines: formData.lines
        .filter(l => l.account_id && (l.debit > 0 || l.credit > 0))
        .map(l => ({
          account_id: l.account_id,
          debit: l.debit,
          credit: l.credit,
          description: null,
          party_type: l.party_type,
          party_id: l.party
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
          {isDirty && (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 gap-1 px-3 py-1">
              <AlertCircle className="h-3 w-3" /> Not Saved
            </Badge>
          )}
          <Button variant="outline" onClick={() => navigate("/finance")}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={() => navigate(`/finance/journal/new?type=${type === 'Quick' ? 'Standard' : 'Quick'}`)}>
            {type === 'Quick' ? 'Standard Mode' : 'Quick Entry'}
          </Button>
          <Button onClick={handleSave} disabled={createJournalEntry.isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Save className="h-4 w-4 mr-2" />
            {createJournalEntry.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      }
    >
      <div className="max-w-7xl mx-auto space-y-6 pb-20">
        <Card className={cn(
          "border-none shadow-sm bg-card/50 backdrop-blur-sm transition-all duration-300",
          type === "Quick" && "max-h-0 opacity-0 overflow-hidden py-0 my-0 border-0"
        )}>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Entry Type <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.entry_type}
                    onValueChange={(v) => setFormData(p => ({...p, entry_type: v}))}
                  >
                    <SelectTrigger className="bg-background/50 border-muted-foreground/20 h-11">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Journal Entry">Journal Entry</SelectItem>
                      <SelectItem value="Contra Entry">Contra Entry</SelectItem>
                      <SelectItem value="Excise Entry">Excise Entry</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Series <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.series}
                    onValueChange={(v) => setFormData(p => ({...p, series: v}))}
                  >
                    <SelectTrigger className="bg-background/50 border-muted-foreground/20 h-11">
                      <SelectValue placeholder="Select series" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACC-JV-.YYYY.-">ACC-JV-.YYYY.-</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Finance Book
                  </Label>
                  <Input
                    placeholder=""
                    className="bg-background/50 border-muted-foreground/20 h-11"
                    value={formData.finance_book}
                    onChange={(e) => setFormData(p => ({...p, finance_book: e.target.value}))}
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    From Template
                  </Label>
                  <Input
                    placeholder=""
                    className="bg-background/50 border-muted-foreground/20 h-11"
                    value={formData.from_template}
                    onChange={(e) => setFormData(p => ({...p, from_template: e.target.value}))}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Company <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.company}
                    onValueChange={(v) => setFormData(p => ({...p, company: v}))}
                  >
                    <SelectTrigger className="bg-background/50 border-muted-foreground/20 h-11">
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Unico Plastics Inc.">Unico Plastics Inc.</SelectItem>
                      <SelectItem value="Global Hospitality Group">Global Hospitality Group</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Posting Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={formData.posting_date}
                    onChange={(e) => setFormData(p => ({...p, posting_date: e.target.value}))}
                    className="bg-background/50 border-muted-foreground/20 h-11 font-mono"
                  />
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
            <Table>
              <TableHeader className="bg-muted/20">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="w-12 text-center">
                    <input type="checkbox" className="rounded border-muted-foreground/30" />
                  </TableHead>
                  <TableHead className="w-16">No.</TableHead>
                  <TableHead className="min-w-[250px]">Account</TableHead>
                  <TableHead>Party Type</TableHead>
                  <TableHead>Party</TableHead>
                  <TableHead className="text-right w-40">Debit</TableHead>
                  <TableHead className="text-right w-40">Credit</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formData.lines.map((line, index) => (
                  <TableRow key={index} className="group border-muted-foreground/10 hover:bg-muted/10 transition-colors">
                    <TableCell className="text-center">
                      <input type="checkbox" className="rounded border-muted-foreground/30" />
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground">{index + 1}</TableCell>
                    <TableCell>
                      <Select
                        value={line.account_id}
                        onValueChange={(v) => updateLine(index, "account_id", v)}
                      >
                        <SelectTrigger className="border-none bg-transparent hover:bg-background/50 transition-colors focus:ring-0 px-0 h-8 font-semibold">
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
                    </TableCell>
                    <TableCell>
                      <Input
                        placeholder="Party Type"
                        value={line.party_type}
                        onChange={(e) => updateLine(index, "party_type", e.target.value)}
                        className="border-none bg-transparent hover:bg-background/50 transition-colors focus:ring-0 px-0 h-8 placeholder:text-muted-foreground/30"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        placeholder="Party"
                        value={line.party}
                        onChange={(e) => updateLine(index, "party", e.target.value)}
                        className="border-none bg-transparent hover:bg-background/50 transition-colors focus:ring-0 px-0 h-8 placeholder:text-muted-foreground/30"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={line.debit || ""}
                        onChange={(e) => updateLine(index, "debit", parseFloat(e.target.value) || 0)}
                        className="text-right border-none bg-transparent hover:bg-background/50 transition-colors focus:ring-0 h-8 font-mono font-bold"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={line.credit || ""}
                        onChange={(e) => updateLine(index, "credit", parseFloat(e.target.value) || 0)}
                        className="text-right border-none bg-transparent hover:bg-background/50 transition-colors focus:ring-0 h-8 font-mono font-bold"
                      />
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemoveRow(index)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="p-4 bg-muted/5 flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleAddRow(1)} className="h-8 text-xs font-semibold">
                <Plus className="h-3 w-3 mr-1" /> Add Row
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleAddRow(5)} className="h-8 text-xs font-semibold">
                <Plus className="h-3 w-3 mr-1" /> Add Multiple (5)
              </Button>
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
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/20 rounded-lg p-8 hover:border-primary/50 transition-colors cursor-pointer group">
                  <div className="h-12 w-12 rounded-full bg-primary/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-sm font-medium">Click to upload or drag and drop</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG up to 10MB</p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Attached Files</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 rounded-md bg-muted/30 border border-muted-foreground/10 group">
                      <div className="flex items-center gap-3">
                        <FileIcon className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">invoice_vendor_293.pdf</span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Reference Number
                  </Label>
                  <Input
                    placeholder="Invoice #, etc."
                    className="bg-background/50 border-muted-foreground/20 h-11"
                    value={formData.reference_number}
                    onChange={(e) => setFormData(p => ({...p, reference_number: e.target.value}))}
                  />
                </div>
              </div>

              <div className="flex flex-col justify-end space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-muted-foreground/10">
                  <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Debit</span>
                  <span className="text-xl font-mono font-bold">${totals.debit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-muted-foreground/10">
                  <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Credit</span>
                  <span className="text-xl font-mono font-bold">${totals.credit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Difference</span>
                  <span className={cn(
                    "text-xl font-mono font-bold",
                    Math.abs(totals.debit - totals.credit) < 0.01 ? "text-success" : "text-destructive"
                  )}>
                    ${Math.abs(totals.debit - totals.credit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
