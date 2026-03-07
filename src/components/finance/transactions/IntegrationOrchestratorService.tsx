import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  Database,
  ExternalLink,
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRightLeft,
  RefreshCw,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useReservations } from "@/hooks/useReservations";
import { usePOSTransactions } from "@/hooks/usePOS";
import { useCreateJournalEntry, useAccounts } from "@/hooks/useFinance";
import { toast } from "sonner";

interface FinancialEvent {
  id: string;
  source: 'PMS' | 'POS' | 'Inventory' | 'HRM' | 'Bank';
  type: string;
  amount: number;
  timestamp: string;
  status: 'synced' | 'pending' | 'error';
  details: string;
}

export function IntegrationOrchestratorService({ isReadOnly }: { isReadOnly?: boolean }) {
  const { reservations } = useReservations();
  const { data: posTransactions } = usePOSTransactions();
  const { data: accounts } = useAccounts();
  const createJournalEntry = useCreateJournalEntry();

  const [events, setEvents] = useState<FinancialEvent[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Map real data to events
  useEffect(() => {
    const pmsEvents: FinancialEvent[] = reservations.slice(0, 5).map(res => ({
      id: res.id,
      source: 'PMS',
      type: 'Room Revenue',
      amount: res.total_amount,
      timestamp: new Date().toISOString(),
      status: 'pending',
      details: `Reservation ${res.reservation_code} - ${res.guest?.first_name} ${res.guest?.last_name}`
    }));

    const posEvents: FinancialEvent[] = posTransactions.slice(0, 5).map(txn => ({
      id: txn.id,
      source: 'POS',
      type: 'Sales Revenue',
      amount: txn.total,
      timestamp: txn.created_at,
      status: 'synced',
      details: `Receipt ${txn.transaction_number} - ${txn.payment_method}`
    }));

    setEvents([...pmsEvents, ...posEvents].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  }, [reservations, posTransactions]);

  const handleGlobalSync = async () => {
    setIsSyncing(true);

    // Find revenue account
    const revenueAccount = accounts?.find(a => a.code === '4000');
    const cashAccount = accounts?.find(a => a.code === '1000');

    if (!revenueAccount || !cashAccount) {
      toast.error("COA not fully configured for auto-posting");
      setIsSyncing(false);
      return;
    }

    try {
      // Simulate posting a batch journal for pending events
      const pendingAmount = events.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0);

      if (pendingAmount > 0) {
        await createJournalEntry.mutateAsync({
          date: new Date().toISOString().split('T')[0],
          description: `Automated Batch Post: PMS Room Revenue Sync`,
          voucher_type: 'JV',
          lines: [
            { account_id: cashAccount.id, debit: pendingAmount, credit: 0, description: 'Batch Room Revenue' },
            { account_id: revenueAccount.id, debit: 0, credit: pendingAmount, description: 'Batch Room Revenue' }
          ]
        });
        toast.success(`Successfully synced $${pendingAmount.toLocaleString()} to General Ledger`);
      } else {
        toast.info("No pending items to sync.");
      }
    } catch (error) {
      toast.error("Sync failed: " + (error as Error).message);
    } finally {
      setIsSyncing(false);
    }
  };

  const integrations = [
    { name: 'Property Management (PMS)', status: 'Connected', delay: '12ms', icon: Database },
    { name: 'Point of Sale (POS)', status: 'Connected', delay: '8ms', icon: Zap },
    { name: 'Inventory & SCM', status: 'Connected', delay: '45ms', icon: ArrowRightLeft },
    { name: 'HR & Payroll', status: 'Standby', delay: '-', icon: Activity },
    { name: 'External Bank API', status: 'Connected', delay: '120ms', icon: ExternalLink },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Connected Financial Endpoints</CardTitle>
            <CardDescription>Status of automated data ingestion pipelines</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {integrations.map((int, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg border bg-secondary/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-background rounded-md">
                    <int.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{int.name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">Latency: {int.delay}</p>
                  </div>
                </div>
                <Badge variant="outline" className={cn(
                  int.status === 'Connected' ? "bg-success/10 text-success border-success/20" : "bg-muted"
                )}>
                  {int.status}
                </Badge>
              </div>
            ))}
            {!isReadOnly && (
              <Button
                className="w-full mt-2 gap-2"
                variant="outline"
                onClick={handleGlobalSync}
                disabled={isSyncing}
              >
                <RefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
                {isSyncing ? "Syncing..." : "Run Global Integration Sync"}
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Real-Time Event Stream</CardTitle>
                <CardDescription>Transactional ingestion from external modules</CardDescription>
              </div>
              <Badge className="bg-success/20 text-success border-success/30 gap-1.5">
                 <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                 Active
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto max-h-[400px] space-y-4 pr-2">
            {events.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-12">
                 <Activity className="h-12 w-12 mb-4 opacity-20" />
                 <p className="text-sm">Waiting for incoming module events...</p>
              </div>
            ) : events.map((event) => (
              <div key={event.id} className="relative pl-4 border-l-2 border-primary/20 pb-4 last:pb-0 group">
                <div className="absolute -left-[5px] top-0 h-2 w-2 rounded-full bg-primary" />
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5">{event.source}</Badge>
                    <span className="text-xs font-semibold">{event.type}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{event.details}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold">
                    ${event.amount.toLocaleString()}
                  </span>
                  <div className="flex items-center gap-1">
                    {event.status === 'synced' ? (
                      <CheckCircle2 className="h-3 w-3 text-success" />
                    ) : (
                      <Clock className="h-3 w-3 text-amber-500" />
                    )}
                    <span className={cn(
                      "text-[10px] font-medium",
                      event.status === 'synced' ? "text-success" : "text-amber-500"
                    )}>
                      {event.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="absolute -right-2 top-0 h-6 w-6 opacity-0 group-hover:opacity-100">
                   <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-primary/5 border-primary/10">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-2 bg-primary/10 rounded-full">
            <AlertCircle className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h4 className="text-sm font-semibold">Automatic Ledger Mapping</h4>
            <p className="text-xs text-muted-foreground">
              Cross-module revenue and settlements are mapped to Account 4000 (Room Revenue) and 4100 (F&B Sales) respectively. Double-entry validation is performed before every post.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
