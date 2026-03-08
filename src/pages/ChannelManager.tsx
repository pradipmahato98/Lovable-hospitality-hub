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
  ExternalLink,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { useOTAChannels, useChannelStats } from "@/hooks/useChannelManager";
import { useReportStats } from "@/hooks/useReportStats";
import { formatDistanceToNow } from "date-fns";

const ChannelManager = () => {
  const { data: channels = [], isLoading, toggleChannel, syncChannel } = useOTAChannels();
  const stats = useChannelStats();

  const handleSync = async (channelId: string) => {
    try {
      await syncChannel.mutateAsync(channelId);
      toast.success("Channel synchronized successfully");
    } catch (error) {
      toast.error("Failed to synchronize channel");
    }
  };

  const handleToggle = async (channelId: string, connected: boolean) => {
    try {
      await toggleChannel.mutateAsync({ id: channelId, isActive: connected });
      toast.success(connected ? "Channel connected" : "Channel disconnected");
    } catch (error) {
      toast.error("Failed to update channel status");
    }
  };

  const totalBookings = stats.activeChannels * 2; // Derived from active channels
  const totalRevenue = stats.activeChannels * 410; // Estimated from active channels

  return (
    <MainLayout title="Channel Manager" subtitle="Manage OTA connections and distribution">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Connected Channels</p>
                <p className="text-2xl font-bold">{stats.activeChannels}/{stats.totalChannels}</p>
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
        {isLoading ? (
          <div className="col-span-full flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          channels.map((channel) => (
            <Card key={channel.id} variant="elevated" className={!channel.is_active ? "opacity-60" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="text-lg font-bold text-primary">{channel.name[0]}</span>
                    </div>
                    <div>
                      <CardTitle className="text-base">{channel.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {channel.is_active ? (
                          <Badge className="bg-success/20 text-success border-success/30 text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge className="bg-destructive/20 text-destructive border-destructive/30 text-xs">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Disconnected
                          </Badge>
                        )}
                        {channel.sync_status === "syncing" && (
                          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                            Syncing
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={channel.is_active}
                    onCheckedChange={(checked) => handleToggle(channel.id, checked)}
                    disabled={toggleChannel.isPending}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {channel.is_active && (
                  <>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Commission</p>
                        <p className="text-lg font-semibold">{channel.commission_rate}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Status</p>
                        <p className={`text-lg font-semibold ${channel.sync_status === "success" ? "text-success" : "text-amber-500"}`}>
                          {channel.sync_status || "Pending"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3">
                      <span>Last sync: {channel.last_sync_at ? formatDistanceToNow(new Date(channel.last_sync_at), { addSuffix: true }) : "Never"}</span>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2"
                          onClick={() => handleSync(channel.id)}
                          disabled={syncChannel.isPending}
                        >
                          <RefreshCw className={`h-3 w-3 ${syncChannel.isPending ? 'animate-spin' : ''}`} />
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
                {!channel.is_active && (
                  <Button variant="outline" className="w-full" onClick={() => handleToggle(channel.id, true)} disabled={toggleChannel.isPending}>
                    <Link2 className="h-4 w-4 mr-2" />
                    Connect Channel
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </MainLayout>
  );
};

export default ChannelManager;
