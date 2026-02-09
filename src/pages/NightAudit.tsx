import { useState } from "react";
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
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";

type AuditStep = 'validation' | 'posting' | 'closing' | 'summary';

export default function NightAudit() {
  const { businessDate, isDateLoading, usePendingArrivals, useStayOvers, postCharges, closeDay } = useNightAudit();
  const [currentStep, setCurrentStep] = useState<AuditStep>('validation');
  const [auditProgress, setAuditProgress] = useState(0);

  const { data: arrivals = [], isLoading: arrivalsLoading } = usePendingArrivals(businessDate || "");
  const { data: stayOvers = [], isLoading: stayOversLoading } = useStayOvers(businessDate || "");

  const [postedStats, setPostedStats] = useState<{ posted_count: number; total_revenue: number } | null>(null);

  const handleStartAudit = () => {
    setCurrentStep('validation');
    setAuditProgress(25);
  };

  const handlePostCharges = async () => {
    if (!businessDate) return;
    setCurrentStep('posting');
    setAuditProgress(50);

    try {
      const result = await postCharges.mutateAsync(businessDate);
      setPostedStats(result);
      setAuditProgress(75);
    } catch (error) {
      console.error(error);
    }
  };

  const handleFinalizeClose = async () => {
    if (!businessDate || !postedStats) return;
    setCurrentStep('closing');

    await closeDay.mutateAsync({
      currentDate: businessDate,
      log: {
        total_charges_posted: postedStats.posted_count,
        total_room_revenue: postedStats.total_revenue,
        occupancy_rate: stayOvers.length > 0 ? (stayOvers.length / 50) * 100 : 0 // Assuming 50 rooms total for demo
      }
    });

    setAuditProgress(100);
    setCurrentStep('summary');
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
                <p className="text-xs opacity-50">Last Audit: Dec 19, 2024</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audit Wizard */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center mb-4">
              <CardTitle>Audit Wizard</CardTitle>
              <span className="text-sm font-medium text-muted-foreground">Step {
                currentStep === 'validation' ? '1' :
                currentStep === 'posting' ? '2' :
                currentStep === 'closing' ? '3' : '4'
              } of 4</span>
            </div>
            <Progress value={auditProgress} className="h-2" />
          </CardHeader>
          <CardContent className="space-y-6">

            {/* Step 1: Validation */}
            {currentStep === 'validation' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-start gap-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-amber-600">Pending Actions Required</h4>
                    <p className="text-sm text-amber-700">The following arrivals have not been checked in. You should either check them in, mark as No-Show, or cancel them before proceeding.</p>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Guest</TableHead>
                      <TableHead>Reservation #</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {arrivals.map((res) => (
                      <TableRow key={res.id}>
                        <TableCell className="font-medium">
                          {res.guests?.first_name} {res.guests?.last_name}
                        </TableCell>
                        <TableCell className="font-mono">{res.reservation_code}</TableCell>
                        <TableCell><Badge variant="outline">{res.status}</Badge></TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">Manage</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {arrivals.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-success opacity-50" />
                          No pending arrivals for today.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button variant="outline" disabled>Back</Button>
                  <Button
                    className="gap-2"
                    onClick={handlePostCharges}
                    disabled={arrivals.length > 0}
                  >
                    Proceed to Posting <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Posting */}
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
                      <Button variant="outline" onClick={() => setCurrentStep('validation')}>Back</Button>
                      <Button className="gap-2" onClick={handleFinalizeClose}>
                        Proceed to Close Day <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {/* Step 3: Closing */}
            {currentStep === 'closing' && (
              <div className="space-y-8 py-12 text-center animate-in fade-in">
                <Loader2 className="h-16 w-16 mx-auto animate-spin text-primary" />
                <div>
                  <h3 className="text-2xl font-bold">Finalizing End of Day</h3>
                  <p className="text-muted-foreground">Updating business date and archiving logs...</p>
                </div>
              </div>
            )}

            {/* Step 4: Summary */}
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
                    <Button onClick={() => window.print()}>Print Audit Report</Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <DollarSign className="h-4 w-4" /> Financials
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1">
                        <p className="text-2xl font-bold">${postedStats?.total_revenue.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">Room Revenue</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Users className="h-4 w-4" /> Occupancy
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1">
                        <p className="text-2xl font-bold">{stayOvers.length}</p>
                        <p className="text-xs text-muted-foreground">Rooms Occupied</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Loader2 className="h-4 w-4" /> Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1">
                        <p className="text-2xl font-bold">Success</p>
                        <p className="text-xs text-muted-foreground">Audit completed</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Welcome / Init Step */}
            {currentStep === 'validation' && auditProgress === 0 && (
              <div className="py-12 text-center space-y-6">
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

          </CardContent>
        </Card>

        {/* Help & Documentation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> Why run Night Audit?
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
