import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Check, Send, ShieldCheck, Edit2, Activity } from "lucide-react";
import {
  useJournalEntries,
  usePostJournalEntry
} from "@/hooks/useFinance";
import { toast } from "sonner";
import { useBusinessDate } from "@/hooks/useSettings";

interface JournalManagementServiceProps {
  isReadOnly?: boolean;
}

export function JournalManagementService({ isReadOnly }: JournalManagementServiceProps) {
  const navigate = useNavigate();
  const { data: journalEntries, isLoading } = useJournalEntries();
  const postJournalEntry = usePostJournalEntry();
  const { data: businessDate } = useBusinessDate();

  const handlePostEntry = async (entryId: string) => {
    try {
      await postJournalEntry.mutateAsync(entryId);
      toast.success("Journal entry posted to ledger");
    } catch (error) {
      toast.error("Failed to post journal entry");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-display">Journal Management</h2>
          <p className="text-muted-foreground text-sm">Create and manage manual, recurring, and reversing journals.</p>
        </div>
        {!isReadOnly && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/finance/journal/new?type=quick")} className="gap-2">
              <Send className="h-4 w-4" />
              Quick Post
            </Button>
            <Button onClick={() => navigate("/finance/journal/new")} className="gap-2">
              <Plus className="h-4 w-4" />
              New Journal Entry
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Journal Register</CardTitle>
              <CardDescription>Recent entries for business date {businessDate || "Today"}</CardDescription>
            </div>
            <Badge variant="outline" className="bg-success/10 text-success border-success/20">
              <ShieldCheck className="h-3 w-3 mr-1" /> Audit Ready
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading journal entries...</div>
          ) : journalEntries.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No journal entries yet</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Voucher Type</TableHead>
                  <TableHead>Voucher No.</TableHead>
                  <TableHead>Transaction Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Entry By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {journalEntries.map((entry) => {
                  const totalDebit = entry.lines?.reduce((sum: number, l: any) => sum + (l.debit || 0), 0) || 0;
                  const creatorName = entry.created_by_profile
                    ? `${entry.created_by_profile.first_name || ""} ${entry.created_by_profile.last_name || ""}`.trim()
                    : "System";
                  const createdDate = new Date(entry.created_at).toLocaleString([], {
                    year: 'numeric',
                    month: 'numeric',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <div className="flex gap-2">
                          {!entry.is_posted && !isReadOnly && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/finance/journal/${entry.id}`)}
                              >
                                <Edit2 className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePostEntry(entry.id)}
                                disabled={postJournalEntry.isPending}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Post
                              </Button>
                            </>
                          )}
                          {entry.is_posted && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/finance/journal/${entry.id}`)}
                            >
                              <Activity className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
