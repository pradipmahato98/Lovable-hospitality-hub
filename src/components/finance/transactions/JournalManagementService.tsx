import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Search, Check } from "lucide-react";
import {
  useJournalEntries, usePostJournalEntry, useAccounts,
} from "@/hooks/useFinance";
import { toast } from "sonner";
import { NepaliDateSearch } from "@/components/shared/NepaliDateInput";
import { formatISOasBS } from "@/lib/nepaliDate";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface JournalManagementServiceProps {
  isReadOnly?: boolean;
}

export function JournalManagementService({ isReadOnly }: JournalManagementServiceProps) {
  const navigate = useNavigate();
  const [dateFilter, setDateFilter] = useState<{ from: string; to: string } | null>(null);
  const [searchText, setSearchText] = useState("");

  const { data: journalEntries, isLoading } = useJournalEntries();
  const { data: accounts } = useAccounts();
  const postJournalEntry = usePostJournalEntry();

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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">Journal Register</CardTitle>
              <p className="text-muted-foreground text-xs mt-0.5">All journal, receipt, payment & contra vouchers</p>
            </div>
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
              {!isReadOnly && (
                <Button size="sm" className="h-9 gap-1.5 text-xs" onClick={() => navigate("/finance/journal/new")}>
                  <Plus className="h-3.5 w-3.5" /> New Entry
                </Button>
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
                          <Badge variant="outline" className={cn("text-[10px]", entry.is_posted ? "bg-success/20 text-success" : "bg-warning/20 text-warning")}>
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
    </div>
  );
}
