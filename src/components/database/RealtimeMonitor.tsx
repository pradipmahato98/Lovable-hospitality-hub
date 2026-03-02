import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  Clock,
  Activity,
  Circle,
  Database,
  Users,
  ShieldAlert
} from "lucide-react";

interface RealtimeEvent {
  id: string;
  type: "INSERT" | "UPDATE" | "DELETE" | "AUTH" | "RLS";
  table?: string;
  details: string;
  timestamp: string;
}

const INITIAL_EVENTS: RealtimeEvent[] = [
  { id: "1", type: "UPDATE", table: "reservations", details: "Reservation #8291 updated (status: checked-in)", timestamp: "Just now" },
  { id: "2", type: "INSERT", table: "guests", details: "New guest: Sarah Jenkins", timestamp: "1 min ago" },
  { id: "3", type: "AUTH", details: "User admin@luxestay.com signed in", timestamp: "2 mins ago" },
  { id: "4", type: "RLS", table: "profiles", details: "Blocked unauthorized access attempt to profile ID: 12", timestamp: "5 mins ago" },
];

import { api } from "@/lib/api-bridge";

export const RealtimeMonitor = () => {
  const [events, setEvents] = useState<RealtimeEvent[]>(INITIAL_EVENTS);
  const [activeConnections, setActiveConnections] = useState(12);

  useEffect(() => {
    // Connect to real-time channel via bridge
    const channel = api.channel('system_events')
      .on('postgres_changes', { event: '*', schema: 'public' }, (payload: any) => {
        const newEvent: RealtimeEvent = {
          id: Math.random().toString(),
          type: payload.eventType,
          table: payload.table,
          details: `${payload.eventType} on ${payload.table}: ${JSON.stringify(payload.new || payload.old).substring(0, 50)}...`,
          timestamp: "Just now"
        };
        setEvents(prev => [newEvent, ...prev.slice(0, 14)]);
      })
      .subscribe();

    return () => {
      api.removeChannel(channel);
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="elevated">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-warning animate-pulse" />
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase">Status</p>
                <p className="text-xl font-bold text-success">Connected</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card variant="elevated">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase">Active Nodes</p>
                <p className="text-xl font-bold">{activeConnections}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card variant="elevated">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase">Latency</p>
                <p className="text-xl font-bold">14ms</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card variant="elevated">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase">Messages/sec</p>
                <p className="text-xl font-bold">124</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-warning" />
            Live Event Stream
          </CardTitle>
          <CardDescription>Real-time database and application events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="flex items-start gap-4 p-3 rounded-lg border border-sidebar-border bg-secondary/20 hover:bg-secondary/30 transition-colors">
                <div className="mt-1">
                  {event.type === 'INSERT' && <Circle className="h-3 w-3 text-success fill-success" />}
                  {event.type === 'UPDATE' && <Circle className="h-3 w-3 text-warning fill-warning" />}
                  {event.type === 'DELETE' && <Circle className="h-3 w-3 text-destructive fill-destructive" />}
                  {event.type === 'AUTH' && <Users className="h-4 w-4 text-primary" />}
                  {event.type === 'RLS' && <ShieldAlert className="h-4 w-4 text-destructive" />}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] font-mono px-1">
                        {event.type}
                      </Badge>
                      {event.table && (
                        <span className="text-xs font-bold text-primary">{event.table}</span>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground">{event.timestamp}</span>
                  </div>
                  <p className="text-sm font-medium">{event.details}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
