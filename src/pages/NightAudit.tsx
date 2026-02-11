import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useNightAudit } from "@/hooks/useNightAudit";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  CheckCircle2,
  AlertCircle,
  Moon,
  ArrowRight,
  Loader2,
  Play,
  Calendar,
  DollarSign,
  Users,
  LogOut,
  ChevronRight,
  TrendingUp,
  Receipt,
  FileText,
  Bed,
  Utensils
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

type AuditStep = 'welcome' | 'validation' | 'noshow' | 'revenue' | 'posting' | 'closing' | 'summary';

export default function NightAudit() {
  const {
    businessDate,
    isDateLoading,
    usePendingArrivals,
    useStayOvers,
    useDueOuts,
    useRoomStatusSummary,
    usePosSummary,
    postCharges,
    markAsNoShow,
    closeDay
  } = useNightAudit();

  const [currentStep, setCurrentStep] = useState<AuditStep>('welcome');
  const [auditProgress, setAuditProgress] = useState(0);

  const { data: arrivals = [], isLoading: arrivalsLoading } = usePendingArrivals(businessDate || "");
  const { data: stayOvers = [], isLoading: stayOversLoading } = useStayOvers(businessDate || "");
  const { data: dueOuts = [], isLoading: dueOutsLoading } = useDueOuts(businessDate || "");
  const { data: roomSummary } = useRoomStatusSummary();
  const { data: posSummary } = usePosSummary(businessDate || "");

  const [postedStats, setPostedStats] = useState<{ posted_count: number; total_revenue: number } | null>(null);

  const posTotal = useMemo(() => {
    if (!posSummary) return 0;
    return Object.values(posSummary).reduce((acc: number, data: any) => acc + data.total, 0);
  }, [posSummary]);

  const totalRooms = useMemo(() => {
    if (!roomSummary) return 0;
    return Object.values(roomSummary).reduce((acc: number, count) => acc + count, 0);
  }, [roomSummary]);

  const occupancyRate = useMemo(() => {
    if (!totalRooms) return 0;
    return (stayOvers.length / totalRooms) * 100;
  }, [stayOvers.length, totalRooms]);

  const steps: AuditStep[] = ['welcome', 'validation', 'noshow', 'revenue', 'posting', 'closing', 'summary'];
  const stepIndex = steps.indexOf(currentStep);
  const totalSteps = steps.length - 2; // Excluding welcome and closing/summary from the count for the progress bar if needed, but let's just use simple indexing

  const handleNext = () => {
    const nextIdx = stepIndex + 1;
    if (nextIdx < steps.length) {
      setCurrentStep(steps[nextIdx]);
      setAuditProgress((nextIdx / (steps.length - 1)) * 100);
    }
  };

  const handleBack = () => {
    const prevIdx = stepIndex - 1;
    if (prevIdx >= 0) {
      setCurrentStep(steps[prevIdx]);
      setAuditProgress((prevIdx / (steps.length - 1)) * 100);
    }
  };

  const handleStartAudit = () => {
    setCurrentStep('validation');
    setAuditProgress(15);
  };

  const handlePostCharges = async () => {
    if (!businessDate) return;
    try {
      const result = await postCharges.mutateAsync(businessDate);
      setPostedStats(result);
      handleNext();
    } catch (error) {
      console.error(error);
      toast.error("Failed to post room charges");
    }
  };

  const handleFinalizeClose = async () => {
    if (!businessDate || !postedStats) return;
    setCurrentStep('closing');

    try {
      await closeDay.mutateAsync({
        currentDate: businessDate,
        log: {
          total_charges_posted: postedStats.posted_count,
          total_room_revenue: postedStats.total_revenue,
          occupancy_rate: occupancyRate
        }
      });
      setAuditProgress(100);
      setCurrentStep('summary');
    } catch (error) {
      console.error(error);
      toast.error("Failed to finalize night audit");
      setCurrentStep('posting'); // Go back to posting step on error
    }
  };

  if (isDateLoading) return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin" /></div>;

  return (
    <MainLayout title="Night Audit" subtitle="End-of-day processing and automated billing">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Status */}
        <Card className="bg-gradient-to-r from-slate-900 to-slate-800 text-white border-none shadow-xl">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/20 rounded-full">
                  <Moon className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="text-sm opacity-70">Current Business Date</p>
                  <h2 className="text-3xl font-bold font-display">
                    {businessDate ? format(parseISO(businessDate), "EEEE, MMMM do, yyyy") : "---"}
                  </h2>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="outline" className="text-white border-white/20 mb-2">System Status: Ready</Badge>
                <p className="text-xs opacity-50">Operational Day: {businessDate}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audit Wizard */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center mb-4">
              <CardTitle>Audit Wizard</CardTitle>
              <span className="text-sm font-medium text-muted-foreground">Step {stepIndex} of {steps.length - 2}</span>
            </div>
            <Progress value={auditProgress} className="h-2" />
          </CardHeader>
          <CardContent className="space-y-6 min-h-[400px]">

            {/* Step: Welcome */}
            {currentStep === 'welcome' && (
              <div className="py-12 text-center space-y-6 animate-in fade-in">
                <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Play className="h-10 w-10 text-primary" />
                </div>
                <div className="max-w-md mx-auto">
                  <h3 className="text-2xl font-bold">Ready to Begin?</h3>
                  <p className="text-muted-foreground mt-2">
                    The Night Audit process will validate all guest transactions, post daily room rates,
                    and advance the hotel's business date.
                  </p>
                </div>
                <Button size="lg" className="px-12" onClick={handleStartAudit}>
                  Start Night Audit
                </Button>
              </div>
            )}

            {/* Step: Validation (Arrivals & Due-Outs) */}
            {currentStep === 'validation' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card variant="outline" className={cn(arrivals.length > 0 ? "border-amber-500/50" : "border-success/50")}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Users className="h-4 w-4" /> Pending Arrivals
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{arrivals.length}</p>
                      <p className="text-xs text-muted-foreground">Guests yet to check in</p>
                    </CardContent>
                  </Card>
                  <Card variant="outline" className={cn(dueOuts.length > 0 ? "border-amber-500/50" : "border-success/50")}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <LogOut className="h-4 w-4" /> Pending Departures
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{dueOuts.length}</p>
                      <p className="text-xs text-muted-foreground">Guests yet to check out</p>
                    </CardContent>
                  </Card>
                </div>

                {(arrivals.length > 0 || dueOuts.length > 0) ? (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold text-amber-600">Pending Actions Required</p>
                      <p className="text-amber-700">You have {arrivals.length} pending arrivals and {dueOuts.length} pending departures. Please resolve these before proceeding.</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-success/5 border border-success/20 rounded-lg">
                    <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-3" />
                    <h4 className="font-bold text-success">All Clear!</h4>
                    <p className="text-sm text-muted-foreground">All arrivals and departures for today have been processed.</p>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button variant="outline" onClick={handleBack}>Back</Button>
                  <Button
                    className="gap-2"
                    onClick={handleNext}
                    disabled={arrivals.length > 0 || dueOuts.length > 0}
                  >
                    Next: No-Show Processing <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step: No-Show Processing */}
            {currentStep === 'noshow' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="text-center py-6">
                  <h3 className="text-lg font-bold">No-Show Management</h3>
                  <p className="text-sm text-muted-foreground">Guests who did not arrive will be marked as No-Show.</p>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Guest</TableHead>
                      <TableHead>Reservation</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {arrivals.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                          <div className="space-y-2">
                            <CheckCircle2 className="h-8 w-8 mx-auto text-success opacity-50" />
                            <p>No pending arrivals to process as No-Show.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      arrivals.map((arrival) => (
                        <TableRow key={arrival.id}>
                          <TableCell className="font-medium">
                            {arrival.guests?.first_name} {arrival.guests?.last_name}
                          </TableCell>
                          <TableCell>{arrival.id.slice(0, 8)}...</TableCell>
                          <TableCell>
                            <Badge variant="outline">{arrival.status}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={markAsNoShow.isPending}
                              onClick={async () => {
                                try {
                                  await markAsNoShow.mutateAsync(arrival.id);
                                  toast.success("Guest marked as No-Show");
                                } catch (e) {
                                  toast.error("Failed to update status");
                                }
                              }}
                            >
                              {markAsNoShow.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Mark No-Show"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button variant="outline" onClick={handleBack}>Back</Button>
                  <Button className="gap-2" onClick={handleNext}>
                    Next: Revenue Audit <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step: Revenue Audit */}
            {currentStep === 'revenue' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Bed className="h-4 w-4" /> Room Revenue
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-3xl font-bold font-mono">${(stayOvers.reduce((acc, s) => acc + (s.rooms?.price_per_night || 0), 0)).toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">{stayOvers.length} stay-overs found</p>
                        </div>
                        <Badge variant="secondary" className="bg-success/10 text-success">Matched</Badge>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Utensils className="h-4 w-4" /> POS Revenue
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-3xl font-bold font-mono">${posTotal.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">All POS outlets consolidated</p>
                        </div>
                        <Badge variant="secondary" className="bg-success/10 text-success">Balanced</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="bg-secondary/20 p-6 rounded-xl border border-border">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold">Consolidated Daily Revenue</h4>
                    <span className="text-2xl font-display font-bold text-primary">
                      ${(posTotal + stayOvers.reduce((acc, s) => acc + (s.rooms?.price_per_night || 0), 0)).toLocaleString()}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm opacity-70">
                      <span>Occupancy Rate</span>
                      <span>{occupancyRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between text-sm opacity-70">
                      <span>Average Daily Rate (ADR)</span>
                      <span>${stayOvers.length > 0 ? (stayOvers.reduce((acc, s) => acc + (s.rooms?.price_per_night || 0), 0) / stayOvers.length).toFixed(2) : '0.00'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button variant="outline" onClick={handleBack}>Back</Button>
                  <Button className="gap-2" onClick={handlePostCharges}>
                    Proceed to Posting <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step: Posting */}
            {currentStep === 'posting' && (
              <div className="space-y-6 py-8 text-center animate-in fade-in zoom-in-95">
                {postCharges.isPending ? (
                  <div className="space-y-4">
                    <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
                    <div>
                      <h3 className="text-lg font-bold">Posting Room Charges...</h3>
                      <p className="text-muted-foreground">This may take a moment while we update guest folios.</p>
                    </div>
                  </div>
                ) : postedStats ? (
                  <div className="space-y-6">
                    <div className="p-6 bg-success/10 rounded-full w-24 h-24 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="h-12 w-12 text-success" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">Posting Completed</h3>
                      <p className="text-muted-foreground">Daily room rates have been applied to all active stayovers.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                      <Card className="bg-secondary/20">
                        <CardContent className="pt-6">
                          <p className="text-sm text-muted-foreground uppercase">Posted</p>
                          <p className="text-2xl font-bold">{postedStats.posted_count}</p>
                          <p className="text-xs text-muted-foreground">Folio Items</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-secondary/20">
                        <CardContent className="pt-6">
                          <p className="text-sm text-muted-foreground uppercase">Revenue</p>
                          <p className="text-2xl font-bold">${postedStats.total_revenue.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">Room Charges</p>
                        </CardContent>
                      </Card>
                    </div>
                    <div className="flex justify-end gap-3 pt-6 border-t">
                      <Button variant="outline" onClick={handleBack}>Back</Button>
                      <Button className="gap-2" onClick={handleFinalizeClose}>
                        Proceed to Close Day <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                   <div className="space-y-4">
                    <h3 className="text-lg font-bold">Ready to Post</h3>
                    <p className="text-muted-foreground">Click below to post room charges for {stayOvers.length} stay-overs.</p>
                    <Button onClick={handlePostCharges}>Run Posting Now</Button>
                  </div>
                )}
              </div>
            )}

            {/* Step: Closing */}
            {currentStep === 'closing' && (
              <div className="space-y-8 py-12 text-center animate-in fade-in">
                <Loader2 className="h-16 w-16 mx-auto animate-spin text-primary" />
                <div>
                  <h3 className="text-2xl font-bold">Finalizing End of Day</h3>
                  <p className="text-muted-foreground">Updating business date and archiving logs...</p>
                </div>
              </div>
            )}

            {/* Step: Summary */}
            {currentStep === 'summary' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-top-4">
                <div className="p-8 bg-success/5 border border-success/20 rounded-xl text-center space-y-4">
                  <div className="h-20 w-20 rounded-full bg-success/20 flex items-center justify-center mx-auto">
                    <Calendar className="h-10 w-10 text-success" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-success">Business Day Closed</h3>
                    <p className="text-muted-foreground">
                      The system date has been successfully advanced to <strong>{businessDate}</strong>.
                    </p>
                  </div>
                  <div className="flex justify-center gap-4">
                    <Button variant="outline" onClick={() => window.location.reload()}>Return to Dashboard</Button>
                    <Button onClick={() => window.print()} className="gap-2">
                      <FileText className="h-4 w-4" /> Print Final Audit Report
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                        <DollarSign className="h-3 w-3" /> Room Rev
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xl font-bold">${postedStats?.total_revenue.toFixed(2)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                        <Receipt className="h-3 w-3" /> POS Rev
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xl font-bold">${posTotal.toFixed(2)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                        <Users className="h-3 w-3" /> Occupancy
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xl font-bold">{stayOvers.length}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3" /> Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xl font-bold">Success</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Audit Distribution</CardTitle>
                    <CardDescription>Daily reports generated and queued for management</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {['Daily Revenue Report (DRR)', "Manager's Daily Report", 'Front Office Summary', 'Occupancy & Statistics'].map((report, i) => (
                      <div key={i} className="flex justify-between items-center p-2 rounded bg-secondary/20 text-sm">
                        <span>{report}</span>
                        <Badge variant="outline" className="bg-success/10 text-success border-success/20">READY</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}

          </CardContent>
        </Card>

        {/* Help & Documentation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> Night Audit Procedure
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <ul className="list-disc list-inside space-y-2">
                <li>Automates posting of room & tax charges.</li>
                <li>Identifies discrepancies in guest accounts.</li>
                <li>Ensures accurate financial reporting by day.</li>
                <li>Moves system to the next calendar business day.</li>
              </ul>
            </CardContent>
          </Card>
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> Best Practices
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <ul className="list-disc list-inside space-y-2">
                <li>Check in all expected arrivals first.</li>
                <li>Settle and close all guest accounts checking out.</li>
                <li>Balance all POS outlets (Restaurant, Bar).</li>
                <li>Run between 12:00 AM and 4:00 AM.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
