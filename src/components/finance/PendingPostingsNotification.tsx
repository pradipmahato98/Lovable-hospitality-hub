import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useJournalEntries, usePostJournalEntry } from "@/hooks/useFinance";
import { AlertCircle, Clock, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

export function PendingPostingsNotification() {
  const { data: journalEntries, isLoading } = useJournalEntries({ isPosted: false });
  const postJournalEntry = usePostJournalEntry();
  const [isOpen, setIsOpen] = useState(false);
  const [hasShownInitially, setHasShownInitially] = useState(false);

  const unpostedEntries = journalEntries.filter((e) => !e.is_posted);

  useEffect(() => {
    if (!isLoading && unpostedEntries.length > 0 && !hasShownInitially) {
      setIsOpen(true);
      setHasShownInitially(true);
    }
  }, [isLoading, unpostedEntries.length, hasShownInitially]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (unpostedEntries.length > 0) {
        setIsOpen(true);
      }
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(intervalId);
  }, [unpostedEntries.length]);

  const handlePostAll = async () => {
    try {
      for (const entry of unpostedEntries) {
        await postJournalEntry.mutateAsync(entry.id);
      }
      toast.success("All pending transactions posted successfully");
      setIsOpen(false);
    } catch (error) {
      toast.error("Failed to post some transactions");
    }
  };

  if (unpostedEntries.length === 0) return null;

  // Group by date
  const groupedByDate = unpostedEntries.reduce((acc: Record<string, typeof unpostedEntries>, entry) => {
    const date = entry.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(entry);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedByDate).sort();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-500">
            <AlertCircle className="h-5 w-5" />
            Pending Transactions Posting
          </DialogTitle>
          <DialogDescription>
            There are {unpostedEntries.length} transactions waiting to be posted to the general ledger.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[300px] mt-4 pr-4">
          <div className="space-y-4">
            {sortedDates.map((date) => (
              <div key={date} className="space-y-2">
                <div className="flex items-center justify-between sticky top-0 bg-background py-1">
                  <Badge variant="outline" className="font-mono">
                    {date}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {groupedByDate[date].length} entries
                  </span>
                </div>
                <div className="space-y-1">
                  {groupedByDate[date].map((entry) => (
                    <div
                      key={entry.id}
                      className="text-sm p-2 rounded-md bg-secondary/50 flex justify-between items-center"
                    >
                      <div className="truncate flex-1 mr-2">
                        <p className="font-medium truncate">{entry.description}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {entry.entry_number}
                        </p>
                      </div>
                      <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                        Pending
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex items-center gap-2 mt-4 p-3 rounded-lg bg-primary/5 text-xs text-primary border border-primary/10">
          <Clock className="h-4 w-4" />
          <span>This reminder will reappear every 10 minutes if transactions remain unposted.</span>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Skip for now
          </Button>
          <Button onClick={handlePostAll} disabled={postJournalEntry.isPending} className="gap-2">
            {postJournalEntry.isPending ? (
              "Posting..."
            ) : (
              <>
                <Check className="h-4 w-4" />
                Post All Transactions
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
