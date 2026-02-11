import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  DollarSign,
  BarChart3,
  TrendingUp,
  Lock,
  Unlock,
  Receipt,
  Utensils,
  Bed,
  Sparkles,
  ChevronRight,
  Printer,
  CheckCircle2,
  AlertCircle,
  History,
  Calculator
} from "lucide-react";
import { toast } from "sonner";
import { useNightAudit } from "@/hooks/useNightAudit";
import { format, parseISO } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function DayClose() {
  const {
    businessDate,
    usePosSummary,
    useRoomStatusSummary,
    useDayCloseLogs,
    recordDayClose
  } = useNightAudit();

  const { data: posSummary, isLoading: loadingPos } = usePosSummary(businessDate || "");
  const { data: roomStatus, isLoading: loadingRooms } = useRoomStatusSummary();
  const { data: logs, isLoading: loadingLogs } = useDayCloseLogs();

  const [cashCount, setCashCount] = useState<string>("0");
  const [cardBatchTotal, setCardBatchTotal] = useState<string>("0");
  const [isProcessing, setIsProcessing] = useState(false);

  // Calculate totals from POS Summary
  const posTotals = useMemo(() => {
    if (!posSummary) return { cash: 0, card: 0, total: 0 };

    let cash = 0;
    let card = 0;

    Object.entries(posSummary).forEach(([method, data]: [string, any]) => {
      const m = method.toLowerCase();
      if (m.includes('cash')) cash += data.total;
      else if (m.includes('card') || m.includes('stripe') || m.includes('khalti') || m.includes('esewa')) card += data.total;
    });

    return { cash, card, total: cash + card };
  }, [posSummary]);

  const cashDiscrepancy = Number(cashCount) - posTotals.cash;
  const cardDiscrepancy = Number(cardBatchTotal) - posTotals.card;

  const handleCloseDay = async () => {
    if (!businessDate) return;

    setIsProcessing(true);
    try {
      await recordDayClose.mutateAsync({
        business_date: businessDate,
        total_revenue: posTotals.total,
        dept_summaries: {
          pos: posSummary,
          cash_reconciliation: {
            system: posTotals.cash,
            actual: Number(cashCount),
            discrepancy: cashDiscrepancy
          },
          card_reconciliation: {
            system: posTotals.card,
            actual: Number(cardBatchTotal),
            discrepancy: cardDiscrepancy
          }
        }
      });
      toast.success("Day has been successfully balanced and closed for accounting.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to record day close.");
    } finally {
      setIsProcessing(false);
    }
  };

  const isAlreadyClosed = logs?.some(log => log.business_date === businessDate);

  return (
    <MainLayout title="Day Close" subtitle="Financial balancing and department reconciliation">
      <div className="space-y-6">

        {/* Status Card */}
        <Card className={cn("border-l-4 transition-all", isAlreadyClosed ? "border-l-success" : "border-l-amber-500")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2">
                {isAlreadyClosed ? <Lock className="h-5 w-5 text-success" /> : <Unlock className="h-5 w-5 text-amber-500" />}
                Accounting Status: {isAlreadyClosed ? "Closed" : "Open"}
              </CardTitle>
              <CardDescription>
                Business Date: {businessDate ? format(parseISO(businessDate), "PP") : "---"}
              </CardDescription>
            </div>
            {isAlreadyClosed ? (
              <Button variant="outline" onClick={() => window.print()} className="gap-2">
                <Printer className="h-4 w-4" /> Print Daily Summary
              </Button>
            ) : (
              <Button
                onClick={handleCloseDay}
                className="gap-2 bg-amber-600 hover:bg-amber-700"
                disabled={isProcessing}
              >
                <Lock className="h-4 w-4" /> {isProcessing ? "Processing..." : "Finalize & Balance Day"}
              </Button>
            )}
          </CardHeader>
        </Card>

        {!isAlreadyClosed && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cashier Closure */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  Cashier Closure (Physical Count)
                </CardTitle>
                <CardDescription>Enter actual cash and card totals for reconciliation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cash-count">Actual Cash Total</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="cash-count"
                        type="number"
                        value={cashCount}
                        onChange={(e) => setCashCount(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="card-total">Actual Card Total</Label>
                    <div className="relative">
                      <Receipt className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="card-total"
                        type="number"
                        value={cardBatchTotal}
                        onChange={(e) => setCardBatchTotal(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-secondary/20 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Cash Discrepancy:</span>
                    <span className={cn("font-bold", cashDiscrepancy === 0 ? "text-success" : "text-destructive")}>
                      ${cashDiscrepancy.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Card Discrepancy:</span>
                    <span className={cn("font-bold", cardDiscrepancy === 0 ? "text-success" : "text-destructive")}>
                      ${cardDiscrepancy.toFixed(2)}
                    </span>
                  </div>
                </div>

                { (cashDiscrepancy !== 0 || cardDiscrepancy !== 0) && (
                  <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Discrepancy Detected</AlertTitle>
                    <AlertDescription>
                      System totals do not match your physical counts. Please verify before finalizing.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Room Status Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bed className="h-5 w-5 text-primary" />
                  Room Status Verification
                </CardTitle>
                <CardDescription>Current state of room inventory</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {loadingRooms ? (
                    <div className="col-span-2 text-center py-4 opacity-50">Loading status...</div>
                  ) : roomStatus ? (
                    Object.entries(roomStatus).map(([status, count]) => (
                      <div key={status} className="p-3 rounded-lg border bg-background flex justify-between items-center">
                        <span className="capitalize text-sm font-medium">{status.replace('_', ' ')}</span>
                        <Badge variant="secondary" className="font-bold">{count as number}</Badge>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 text-center py-4 opacity-50">No status data</div>
                  )}
                </div>

                {roomStatus?.dirty > 0 && (
                  <Alert className="mt-4 bg-amber-500/10 border-amber-500/20 text-amber-600">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      {roomStatus.dirty} rooms are still marked as Dirty. Ensure housekeeping has updated all statuses.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Revenue Summary */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Transaction Reconciliation (System Totals)
              </CardTitle>
              <CardDescription>Revenue breakdown by payment method for today</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment Method</TableHead>
                    <TableHead className="text-right">Transactions</TableHead>
                    <TableHead className="text-right">Total Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingPos ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 opacity-50">Loading POS data...</TableCell>
                    </TableRow>
                  ) : posSummary && Object.keys(posSummary).length > 0 ? (
                    Object.entries(posSummary).map(([method, data]: [string, any]) => (
                      <TableRow key={method}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-secondary/50">
                              <Receipt className="h-4 w-4 text-primary" />
                            </div>
                            <span className="font-medium capitalize">{method}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{data.count}</TableCell>
                        <TableCell className="text-right font-mono font-bold">${data.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 opacity-50">No transactions recorded for this business date.</TableCell>
                    </TableRow>
                  )}
                  <TableRow className="bg-secondary/30 font-bold">
                    <TableCell colSpan={2} className="text-right uppercase text-xs tracking-wider opacity-60">Total POS Revenue</TableCell>
                    <TableCell className="text-right text-lg text-primary font-display">${posTotals.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Quick Metrics */}
          <div className="space-y-6">
            <Card variant="elevated">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">ADR (Avg Daily Rate)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">$142.50</p>
                <div className="flex items-center text-xs text-success mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  <span>+5.2% from yesterday</span>
                </div>
              </CardContent>
            </Card>

            <Card variant="glass" className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary">Day-End Checklist</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {[
                    "All POS orders closed/paid",
                    "Cash float counted & locked",
                    "Credit card batches settled",
                    "Handover notes completed"
                  ].map((task, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <div className="h-4 w-4 rounded-full border border-primary/30 flex items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      </div>
                      {task}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Activity Logs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Day Close Activity History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loadingLogs ? (
                <div className="text-center py-8 opacity-50">Loading history...</div>
              ) : logs && logs.length > 0 ? (
                logs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-4 rounded-lg border bg-secondary/20 hover:bg-secondary/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-background flex items-center justify-center border">
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      </div>
                      <div>
                        <p className="font-medium">{format(parseISO(log.business_date), "PP")}</p>
                        <p className="text-xs text-muted-foreground">Recorded at {format(parseISO(log.created_at), "p")}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${log.total_revenue?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                      <Badge variant="outline" className="bg-success/10 text-success border-success/20 capitalize">{log.status}</Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 opacity-50">No previous day close records found.</div>
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    </MainLayout>
  );
}
