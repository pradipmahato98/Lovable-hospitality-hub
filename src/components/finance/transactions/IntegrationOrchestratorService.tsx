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
  RefreshCw,
  AlertCircle,
  Clock,
  ArrowRightLeft
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [events, setEvents] = useState<FinancialEvent[]>([
    {
      id: '1',
      source: 'POS',
      type: 'Revenue Posting',
      amount: 450.50,
      timestamp: new Date().toISOString(),
      status: 'synced',
      details: 'Restaurant - Dinner Service #882'
    },
    {
      id: '2',
      source: 'PMS',
      type: 'Folio Settlement',
      amount: 1200.00,
      timestamp: new Date(Date.now() - 500000).toISOString(),
      status: 'synced',
      details: 'Guest Checkout: Room 304'
    },
    {
      id: '3',
      source: 'Inventory',
      type: 'COGS Update',
      amount: 235.00,
      timestamp: new Date(Date.now() - 1200000).toISOString(),
      status: 'pending',
      details: 'Kitchen Supplies Consumption'
    },
    {
      id: '4',
      source: 'Bank',
      type: 'API Sync',
      amount: 0,
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      status: 'synced',
      details: 'Daily Statement Fetch'
    }
  ]);

  // Simulate incoming events
  useEffect(() => {
    const interval = setInterval(() => {
      const sources: FinancialEvent['source'][] = ['PMS', 'POS', 'Inventory', 'HRM'];
      const newEvent: FinancialEvent = {
        id: Math.random().toString(36).substr(2, 9),
        source: sources[Math.floor(Math.random() * sources.length)],
        type: 'Auto-Post Event',
        amount: Math.floor(Math.random() * 500) + 10,
        timestamp: new Date().toISOString(),
        status: 'synced',
        details: 'Automated background synchronization'
      };
      setEvents(prev => [newEvent, ...prev.slice(0, 9)]);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

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
              <Button className="w-full mt-2" variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" /> Run Global Sync
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Financial Event Stream</CardTitle>
                <CardDescription>Live ingestion of transactional data</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                 <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                 <span className="text-[10px] font-bold uppercase text-success">Live</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto max-h-[400px] space-y-4 pr-2">
            {events.map((event) => (
              <div key={event.id} className="relative pl-4 border-l-2 border-primary/20 pb-4 last:pb-0">
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
                    {event.amount > 0 ? `$${event.amount.toFixed(2)}` : '-'}
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
            <h4 className="text-sm font-semibold">Standard Financial Event Ingestion (SFEI)</h4>
            <p className="text-xs text-muted-foreground">
              The orchestrator is currently using SFEI protocol v2.4. Mapping rules are applied automatically to categorize incoming events into the General Ledger.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
