import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Globe, 
  Link2, 
  RefreshCw, 
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Calendar,
  DollarSign,
  Settings,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";

interface Channel {
  id: string;
  name: string;
  logo: string;
  connected: boolean;
  lastSync: string;
  bookingsToday: number;
  revenue: number;
  status: "active" | "error" | "syncing";
}

const mockChannels: Channel[] = [
  { id: "1", name: "Booking.com", logo: "B", connected: true, lastSync: "5 min ago", bookingsToday: 3, revenue: 1250, status: "active" },
  { id: "2", name: "Expedia", logo: "E", connected: true, lastSync: "10 min ago", bookingsToday: 2, revenue: 890, status: "active" },
  { id: "3", name: "Airbnb", logo: "A", connected: true, lastSync: "2 min ago", bookingsToday: 1, revenue: 320, status: "syncing" },
  { id: "4", name: "Hotels.com", logo: "H", connected: false, lastSync: "-", bookingsToday: 0, revenue: 0, status: "error" },
  { id: "5", name: "Agoda", logo: "Ag", connected: false, lastSync: "-", bookingsToday: 0, revenue: 0, status: "error" },
  { id: "6", name: "TripAdvisor", logo: "T", connected: true, lastSync: "15 min ago", bookingsToday: 1, revenue: 450, status: "active" },
];

const ChannelManager = () => {
  const [channels, setChannels] = useState(mockChannels);
  const [syncing, setSyncing] = useState<string | null>(null);

  const handleSync = (channelId: string) => {
    setSyncing(channelId);
    setTimeout(() => {
      setSyncing(null);
      toast.success("Channel synchronized successfully");
    }, 2000);
  };

  const handleToggle = (channelId: string, connected: boolean) => {
    setChannels(prev => prev.map(ch => 
      ch.id === channelId ? { ...ch, connected } : ch
    ));
    toast.success(connected ? "Channel connected" : "Channel disconnected");
  };

  const totalBookings = channels.reduce((sum, ch) => sum + ch.bookingsToday, 0);
  const totalRevenue = channels.reduce((sum, ch) => sum + ch.revenue, 0);
  const connectedCount = channels.filter(ch => ch.connected).length;

  return (
    <MainLayout title="Channel Manager" subtitle="Manage OTA connections and distribution">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Connected Channels</p>
                <p className="text-2xl font-bold">{connectedCount}/{channels.length}</p>
              </div>
              <Link2 className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today's Bookings</p>
                <p className="text-2xl font-bold">{totalBookings}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today's Revenue</p>
                <p className="text-2xl font-bold">${totalRevenue.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Sync Time</p>
                <p className="text-2xl font-bold">8 min</p>
              </div>
              <RefreshCw className="h-8 w-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Channels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {channels.map((channel) => (
          <Card key={channel.id} variant="elevated" className={!channel.connected ? "opacity-60" : ""}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-primary">{channel.logo}</span>
                  </div>
                  <div>
                    <CardTitle className="text-base">{channel.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      {channel.status === "active" && (
                        <Badge className="bg-success/20 text-success border-success/30 text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      )}
                      {channel.status === "syncing" && (
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                          Syncing
                        </Badge>
                      )}
                      {channel.status === "error" && (
                        <Badge className="bg-destructive/20 text-destructive border-destructive/30 text-xs">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Disconnected
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <Switch 
                  checked={channel.connected}
                  onCheckedChange={(checked) => handleToggle(channel.id, checked)}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {channel.connected && (
                <>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Today's Bookings</p>
                      <p className="text-lg font-semibold">{channel.bookingsToday}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Revenue</p>
                      <p className="text-lg font-semibold text-success">${channel.revenue}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3">
                    <span>Last sync: {channel.lastSync}</span>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 px-2"
                        onClick={() => handleSync(channel.id)}
                        disabled={syncing === channel.id}
                      >
                        <RefreshCw className={`h-3 w-3 ${syncing === channel.id ? 'animate-spin' : ''}`} />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 px-2">
                        <Settings className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 px-2">
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
              {!channel.connected && (
                <Button variant="outline" className="w-full" onClick={() => handleToggle(channel.id, true)}>
                  <Link2 className="h-4 w-4 mr-2" />
                  Connect Channel
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </MainLayout>
  );
};

export default ChannelManager;
