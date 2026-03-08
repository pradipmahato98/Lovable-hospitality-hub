import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, Eye, Pencil, Printer, Trash2, MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import {
  useJournalEntries, usePostJournalEntry, useAccounts,
} from "@/hooks/useFinance";
import { toast } from "sonner";
import { NepaliDateSearch } from "@/components/shared/NepaliDateInput";
import { formatISOasBS } from "@/lib/nepaliDate";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface JournalManagementServiceProps {
  isReadOnly?: boolean;
}

export function JournalManagementService({ isReadOnly }: JournalManagementServiceProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dateFilter, setDateFilter] = useState<{ from: string; to: string } | null>(null);
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pageSizeInput, setPageSizeInput] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

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

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / pageSize));
  const paginatedEntries = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEntries.slice(start, start + pageSize);
  }, [filteredEntries, currentPage, pageSize]);

  // Reset page on filter change
  useMemo(() => { setCurrentPage(1); }, [searchText, dateFilter, pageSize]);

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("journal_entries").delete().eq("id", deleteId);
    if (error) { toast.error("Delete failed"); }
    else { toast.success("Entry deleted"); queryClient.invalidateQueries({ queryKey: ["journal-entries"] }); }
    setDeleteId(null);
  };

  const handlePageSizeManual = () => {
    const val = parseInt(pageSizeInput);
    if (val > 0 && val <= 500) { setPageSize(val); setPageSizeInput(""); }
  };

  const formatPostedInfo = (entry: any) => {
    if (!entry.is_posted) return null;
    const by = entry.created_by ? entry.created_by.substring(0, 8) + "…" : "System";
    const dt = entry.updated_at || entry.created_at;
    if (!dt) return by;
    const d = new Date(dt);
    const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    return (
      <div className="text-[10px] leading-tight">
        <div className="font-medium text-foreground">{by}</div>
        <div className="text-muted-foreground">{time}</div>
        <div className="text-muted-foreground">{date}</div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <Card>
        {/* Row 1: Title left, + New Entry right */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div>
            <h3 className="text-base font-semibold text-foreground">Journal Register</h3>
            <p className="text-muted-foreground text-xs mt-0.5">All journal, receipt, payment & contra vouchers</p>
          </div>
          {!isReadOnly && (
            <Button size="sm" className="h-9 gap-1.5 text-xs" onClick={() => navigate("/finance/journal/new")}>
              <Plus className="h-3.5 w-3.5" /> New Entry
            </Button>
          )}
        </div>

        {/* Row 2: Search, From, To, Search btn, Clear */}
        <div className="flex items-end gap-2 px-5 pb-3 flex-wrap">
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
            <Button variant="ghost" size="sm" className="h-9 text-xs" onClick={() => setDateFilter(null)}>
              Clear Filter
            </Button>
          )}
        </div>

        {/* Table */}
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
                    <TableHead className="w-[80px]">Action</TableHead>
                    <TableHead>Voucher #</TableHead>
                    <TableHead>Date (AD)</TableHead>
                    <TableHead>मिति (BS)</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                    <TableHead>Posted By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedEntries.map(entry => {
                    const d = entry.lines?.reduce((s: number, l: any) => s + (l.debit || 0), 0) || 0;
                    const c = entry.lines?.reduce((s: number, l: any) => s + (l.credit || 0), 0) || 0;
                    return (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreHorizontal className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-32">
                              <DropdownMenuItem className="text-xs gap-2">
                                <Eye className="h-3 w-3" /> View
                              </DropdownMenuItem>
                              {!entry.is_posted && !isReadOnly && (
                                <DropdownMenuItem className="text-xs gap-2">
                                  <Pencil className="h-3 w-3" /> Edit
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem className="text-xs gap-2">
                                <Printer className="h-3 w-3" /> Print
                              </DropdownMenuItem>
                              {!entry.is_posted && !isReadOnly && (
                                <DropdownMenuItem
                                  className="text-xs gap-2 text-destructive focus:text-destructive"
                                  onClick={() => setDeleteId(entry.id)}
                                >
                                  <Trash2 className="h-3 w-3" /> Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-primary">{entry.reference || entry.entry_number}</TableCell>
                        <TableCell className="text-xs">{entry.date}</TableCell>
                        <TableCell className="text-xs text-primary font-medium">{formatISOasBS(entry.date, "long")}</TableCell>
                        <TableCell className="text-xs max-w-[200px] truncate">{entry.description}</TableCell>
                        <TableCell className="text-right font-mono text-xs">{d.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-mono text-xs">{c.toFixed(2)}</TableCell>
                        <TableCell>
                          {entry.is_posted ? (
                            formatPostedInfo(entry)
                          ) : (
                            <Badge variant="outline" className="text-[10px] bg-warning/20 text-warning">Draft</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Footer: Pagination */}
          {filteredEntries.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Show</span>
                <Select value={String(pageSize)} onValueChange={v => setPageSize(Number(v))}>
                  <SelectTrigger className="h-7 w-[60px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 20, 30, 40, 50].map(n => (
                      <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span>or</span>
                <Input
                  placeholder="#"
                  value={pageSizeInput}
                  onChange={e => setPageSizeInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handlePageSizeManual()}
                  className="h-7 w-[50px] text-xs text-center"
                />
                <span>entries</span>
                <span className="ml-2">
                  ({(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredEntries.length)} of {filteredEntries.length})
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline" size="icon" className="h-7 w-7"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <span className="text-xs px-2 text-muted-foreground">
                  Page {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline" size="icon" className="h-7 w-7"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Journal Entry?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. The entry and all its lines will be permanently deleted.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
