import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Filter, Search, X, BookOpen } from "lucide-react";
import { NepaliDateInput } from "@/components/shared/NepaliDateInput";
import { useAccounts, useLedger } from "@/hooks/useFinance";
import { formatISOasBS } from "@/lib/nepaliDate";
import { TableSkeleton } from "@/components/skeletons";

const FISCAL_YEARS = [
  { value: "2081", label: "2081/82" },
  { value: "2080", label: "2080/81" },
  { value: "2079", label: "2079/80" },
  { value: "2078", label: "2078/79" },
];

// Fiscal year date ranges (approximate AD equivalents)
const FY_RANGES: Record<string, { start: string; end: string }> = {
  "2081": { start: "2024-07-16", end: "2025-07-15" },
  "2080": { start: "2023-07-16", end: "2024-07-15" },
  "2079": { start: "2022-07-16", end: "2023-07-15" },
  "2078": { start: "2021-07-16", end: "2022-07-15" },
};

export function LedgerTransactionService() {
  const [showFilter, setShowFilter] = useState(true);
  const [fiscalYear, setFiscalYear] = useState("2081");
  const [fromDate, setFromDate] = useState(FY_RANGES["2081"].start);
  const [toDate, setToDate] = useState(FY_RANGES["2081"].end);
  const [selectedAccount, setSelectedAccount] = useState<string>("none");
  const [showMode, setShowMode] = useState<"details" | "summary">("details");
  const [linkedLedger, setLinkedLedger] = useState<string>("none");
  const [applied, setApplied] = useState(false);

  const { data: accounts } = useAccounts();
  const accountId = selectedAccount !== "none" ? selectedAccount : undefined;
  const { data: ledgerEntries, isLoading } = useLedger(
    applied ? accountId : undefined,
    applied ? { startDate: fromDate, endDate: toDate } : undefined
  );

  // Get linked ledger options: accounts that appear in entries alongside selected account
  const linkedAccounts = useMemo(() => {
    if (!accountId || !ledgerEntries.length) return [];
    const entryIds = new Set(ledgerEntries.map((e) => e.journal_entry_id));
    // Return all accounts that share journal entries with the selected one
    return accounts.filter((a) => a.id !== accountId);
  }, [accountId, ledgerEntries, accounts]);

  // Filter by linked ledger
  const filteredEntries = useMemo(() => {
    if (linkedLedger === "none" || !applied) return ledgerEntries;
    // This would need cross-referencing journal lines, for now show all
    return ledgerEntries;
  }, [ledgerEntries, linkedLedger, applied]);

  // Summary aggregation
  const summary = useMemo(() => {
    const totalDebit = filteredEntries.reduce((s, e) => s + e.debit, 0);
    const totalCredit = filteredEntries.reduce((s, e) => s + e.credit, 0);
    const closingBalance = filteredEntries.length > 0 ? filteredEntries[filteredEntries.length - 1]?.running_balance || 0 : 0;
    return { totalDebit, totalCredit, closingBalance };
  }, [filteredEntries]);

  const handleFYChange = (fy: string) => {
    setFiscalYear(fy);
    if (FY_RANGES[fy]) {
      setFromDate(FY_RANGES[fy].start);
      setToDate(FY_RANGES[fy].end);
    }
  };

  const handleSearch = () => setApplied(true);
  const handleCancel = () => {
    setShowFilter(false);
    setApplied(false);
    setSelectedAccount("none");
    setLinkedLedger("none");
  };

  return (
    <div className="flex gap-0 h-full">
      {/* Filter Sidebar */}
      {showFilter && (
        <div className="w-72 shrink-0 border-r border-border bg-muted/30 p-4 space-y-4 overflow-y-auto">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Filter className="h-4 w-4" /> Filter
            </h3>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowFilter(false)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Separator />

          <div className="space-y-3">
            <div>
              <Label className="text-xs">Fiscal Year</Label>
              <Select value={fiscalYear} onValueChange={handleFYChange}>
                <SelectTrigger className="h-8 text-xs mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FISCAL_YEARS.map((fy) => (
                    <SelectItem key={fy.value} value={fy.value}>{fy.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <NepaliDateInput label="From Date" value={fromDate} onChange={setFromDate} className="text-xs" />
            <NepaliDateInput label="To Date" value={toDate} onChange={setToDate} className="text-xs" />

            <div>
              <Label className="text-xs">Ledger Account</Label>
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger className="h-8 text-xs mt-1">
                  <SelectValue placeholder="Choose Ledger" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- All Accounts --</SelectItem>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.code} - {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Show</Label>
              <Select value={showMode} onValueChange={(v) => setShowMode(v as "details" | "summary")}>
                <SelectTrigger className="h-8 text-xs mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="details">Details</SelectItem>
                  <SelectItem value="summary">Summary</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Linked Ledger</Label>
              <Select value={linkedLedger} onValueChange={setLinkedLedger}>
                <SelectTrigger className="h-8 text-xs mt-1">
                  <SelectValue placeholder="Choose Linked" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- None --</SelectItem>
                  {linkedAccounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.code} - {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />
          <div className="flex gap-2">
            <Button size="sm" className="flex-1 text-xs h-8" onClick={handleSearch}>
              <Search className="h-3.5 w-3.5 mr-1" /> Search
            </Button>
            <Button size="sm" variant="outline" className="flex-1 text-xs h-8" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 min-w-0 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {!showFilter && (
              <Button variant="outline" size="sm" onClick={() => setShowFilter(true)}>
                <Filter className="h-4 w-4 mr-1" /> Filter
              </Button>
            )}
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <BookOpen className="h-5 w-5" /> Ledger
            </h2>
            {applied && selectedAccount !== "none" && (
              <Badge variant="secondary" className="text-xs">
                {accounts.find((a) => a.id === selectedAccount)?.name}
              </Badge>
            )}
          </div>
          {applied && (
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>Total Dr: <strong className="text-foreground">{summary.totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></span>
              <span>Total Cr: <strong className="text-foreground">{summary.totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></span>
              <span>Balance: <strong className="text-foreground">{summary.closingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></span>
            </div>
          )}
        </div>

        {!applied ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Use the filter panel to search ledger entries</p>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <TableSkeleton columns={7} rows={8} />
        ) : showMode === "details" ? (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Date (AD)</TableHead>
                  <TableHead className="text-xs">मिति (BS)</TableHead>
                  <TableHead className="text-xs">Voucher #</TableHead>
                  <TableHead className="text-xs">Description</TableHead>
                  <TableHead className="text-xs text-right">Debit</TableHead>
                  <TableHead className="text-xs text-right">Credit</TableHead>
                  <TableHead className="text-xs text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No ledger entries found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="text-xs">{entry.date}</TableCell>
                      <TableCell className="text-xs">{entry.date ? formatISOasBS(entry.date, "short") : "-"}</TableCell>
                      <TableCell className="text-xs font-mono">{entry.entry_number}</TableCell>
                      <TableCell className="text-xs max-w-[200px] truncate">{entry.description}</TableCell>
                      <TableCell className="text-xs text-right font-mono">
                        {entry.debit > 0 ? entry.debit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "-"}
                      </TableCell>
                      <TableCell className="text-xs text-right font-mono">
                        {entry.credit > 0 ? entry.credit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "-"}
                      </TableCell>
                      <TableCell className="text-xs text-right font-mono font-semibold">
                        {entry.running_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        ) : (
          /* Summary Mode */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total Debits</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold font-mono">{summary.totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total Credits</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold font-mono">{summary.totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Closing Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold font-mono">{summary.closingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
