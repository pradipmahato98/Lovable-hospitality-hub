import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Unlock, Calendar, CheckCircle2, History, ShieldAlert, AlertTriangle } from "lucide-react";
import { useBusinessDate, useUpdateBusinessDate } from "@/hooks/useSettings";
import { useFinancialPeriods, useLockPeriod } from "@/hooks/useFinanceAdvanced";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export function FinancialPeriodCloseService() {
  const { data: businessDate } = useBusinessDate();
  const { data: periods, isLoading } = useFinancialPeriods();
  const updateBusinessDate = useUpdateBusinessDate();
  const lockPeriod = useLockPeriod();

  const [isDayCloseOpen, setIsDayCloseOpen] = useState(false);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);

  const handleDayClose = async () => {
    if (!businessDate) return;
    const currentDate = new Date(businessDate);
    currentDate.setDate(currentDate.getDate() + 1);
    const nextDate = currentDate.toISOString().split("T")[0];

    try {
      await updateBusinessDate.mutateAsync(nextDate);
      toast.success(`Business day closed. New date: ${nextDate}`);
      setIsDayCloseOpen(false);
    } catch (error) {
      toast.error("Failed to close business day");
    }
  };

  const handleLockPeriod = async (id: string) => {
    try {
      await lockPeriod.mutateAsync(id);
      setSelectedPeriodId(null);
    } catch (error) {
      toast.error("Failed to lock period");
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
               <History className="h-5 w-5 text-primary" /> Financial Period Master
            </CardTitle>
            <CardDescription>Control accounting periods and enforce hard data locks.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
               <TableHeader>
                  <TableRow>
                     <TableHead>Period Name</TableHead>
                     <TableHead>Fiscal Year</TableHead>
                     <TableHead>Duration</TableHead>
                     <TableHead>Status</TableHead>
                     <TableHead className="text-right">Action</TableHead>
                  </TableRow>
               </TableHeader>
               <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8">Loading periods...</TableCell></TableRow>
                  ) : periods?.map(period => (
                    <TableRow key={period.id}>
                       <TableCell className="font-bold">{period.period_name}</TableCell>
                       <TableCell className="text-xs font-mono">{period.fiscal_year}</TableCell>
                       <TableCell className="text-[10px] text-muted-foreground">
                          {period.start_date} to {period.end_date}
                       </TableCell>
                       <TableCell>
                          <Badge variant="outline" className={cn(
                             period.status === 'open' ? "bg-success/10 text-success border-success/20" :
                             "bg-destructive/10 text-destructive border-destructive/20"
                          )}>
                             {period.status.toUpperCase()}
                          </Badge>
                       </TableCell>
                       <TableCell className="text-right">
                          {period.status === 'open' ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => setSelectedPeriodId(period.id)}
                            >
                               <Lock className="h-3.5 w-3.5 mr-1" /> Lock
                            </Button>
                          ) : (
                            <Button variant="ghost" size="sm" className="h-8 text-muted-foreground" disabled>
                               <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Closed
                            </Button>
                          )}
                       </TableCell>
                    </TableRow>
                  ))}
               </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-destructive/5 border-destructive/10">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                 <ShieldAlert className="h-4 w-4 text-destructive" /> Period Lock Logic
              </CardTitle>
            </CardHeader>
            <CardContent>
               <p className="text-xs text-muted-foreground leading-relaxed">
                  Locked periods prevent all modifications (INSERT/UPDATE/DELETE) to journal entries within that date range.
                  <span className="font-bold block mt-2 text-destructive">PostgreSQL triggers are active.</span>
               </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
               <CardTitle className="text-sm">Active Business Date</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="p-4 bg-primary/5 rounded-lg border text-center">
                  <p className="text-3xl font-bold font-display text-primary">{businessDate || "..."}</p>
               </div>
               <Button onClick={() => setIsDayCloseOpen(true)} variant="outline" className="w-full gap-2 border-destructive/20 text-destructive hover:bg-destructive hover:text-white">
                  <Lock className="h-4 w-4" /> Advance Business Day
               </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Day Close Dialog */}
      <Dialog open={isDayCloseOpen} onOpenChange={setIsDayCloseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalize Business Day?</DialogTitle>
            <DialogDescription className="space-y-2">
              <p>This will advance the business date to the next calendar day.</p>
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded text-amber-800 text-xs">
                 <AlertTriangle className="h-4 w-4 shrink-0" />
                 <span>Warning: All unposted draft journals for {businessDate} will be automatically moved to the next period.</span>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsDayCloseOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDayClose}>Advance Date</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Period Lock Confirmation */}
      <Dialog open={!!selectedPeriodId} onOpenChange={(open) => !open && setSelectedPeriodId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Hard Lock</DialogTitle>
            <DialogDescription>
              Locking this period will permanently disable further postings. Only the Financial Controller can reopen a locked period.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setSelectedPeriodId(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => selectedPeriodId && handleLockPeriod(selectedPeriodId)}
              disabled={lockPeriod.isPending}
            >
              {lockPeriod.isPending ? "Locking..." : "Confirm Lock"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
