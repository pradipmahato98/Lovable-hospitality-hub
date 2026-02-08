import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Database,
  Cloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Copy,
  ExternalLink,
  Zap
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BucketStatus {
  id: string;
  exists: boolean;
  public: boolean;
}

export const MCPConfigPanel = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{
    buckets: BucketStatus[];
    realtimeEnabled: boolean;
    projectId: string;
  }>({
    buckets: [],
    realtimeEnabled: false,
    projectId: import.meta.env.VITE_SUPABASE_PROJECT_ID || "unknown",
  });

  const checkStatus = async () => {
    setIsLoading(true);
    try {
      // 1. Check Buckets
      const requiredBuckets = ['avatars', 'property-images', 'lost-found-images'];
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

      if (bucketsError) throw bucketsError;

      const bucketStatus = requiredBuckets.map(id => {
        const found = buckets?.find(b => b.id === id);
        return {
          id,
          exists: !!found,
          public: found?.public ?? false
        };
      });

      // 2. Check Realtime (We can't directly check the publication easily,
      // so we check if we can subscribe to a common table)
      const testChannel = supabase.channel('mcp-status-check');
      let realtimeOk = false;

      try {
        const subscription = testChannel
          .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {})
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') realtimeOk = true;
          });

        // Wait a bit for subscription
        await new Promise(resolve => setTimeout(resolve, 1000));
        await supabase.removeChannel(testChannel);
      } catch (e) {
        realtimeOk = false;
      }

      setStatus(prev => ({
        ...prev,
        buckets: bucketStatus,
        realtimeEnabled: realtimeOk,
      }));

    } catch (error) {
      console.error("Status check failed:", error);
      toast.error("Failed to fetch system status");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleConfigureBuckets = async () => {
    setIsLoading(true);
    try {
      for (const bucketId of ['avatars', 'property-images', 'lost-found-images']) {
        const { error } = await supabase.storage.createBucket(bucketId, {
          public: true,
        });
        if (error && error.message !== 'Bucket already exists') {
          throw error;
        }
      }
      toast.success("Storage buckets configured");
      await checkStatus();
    } catch (error) {
      toast.error("Failed to configure buckets: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const mcpConfigJson = JSON.stringify({
    name: "LuxeStay ERP Supabase MCP",
    version: "1.0.0",
    supabase: {
      project_id: status.projectId,
      realtime: true,
      storage: status.buckets.map(b => b.id)
    }
  }, null, 2);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Status */}
        <Card variant="elevated">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  MCP Readiness
                </CardTitle>
                <CardDescription>Supabase project configuration status</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={checkStatus} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Realtime Status */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
              <div className="flex items-center gap-3">
                <Zap className={`h-5 w-5 ${status.realtimeEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
                <div>
                  <p className="font-medium text-sm">Realtime Sync</p>
                  <p className="text-xs text-muted-foreground">Postgres CDC status</p>
                </div>
              </div>
              <Badge variant="outline" className={status.realtimeEnabled ? "bg-success/20 text-success border-success/30" : "bg-amber-500/20 text-amber-400 border-amber-500/30"}>
                {status.realtimeEnabled ? "Enabled" : "Not Detected"}
              </Badge>
            </div>

            {/* Buckets Status */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase px-1">Storage Buckets</p>
              {status.buckets.map(bucket => (
                <div key={bucket.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-3">
                    <Cloud className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-medium">{bucket.id}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {bucket.exists ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    )}
                    <span className="text-xs">{bucket.exists ? "Configured" : "Missing"}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <Button
                className="w-full"
                onClick={handleConfigureBuckets}
                disabled={isLoading || status.buckets.every(b => b.exists)}
              >
                {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
                Auto-Configure Resources
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Credentials & Details */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Project Details
            </CardTitle>
            <CardDescription>Required for external MCP host</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Supabase Project ID</Label>
              <div className="flex gap-2">
                <code className="flex-1 p-2 bg-muted rounded text-xs font-mono truncate">{status.projectId}</code>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => copyToClipboard(status.projectId, "Project ID")}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>API URL</Label>
              <div className="flex gap-2">
                <code className="flex-1 p-2 bg-muted rounded text-xs font-mono truncate">{import.meta.env.VITE_SUPABASE_URL}</code>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => copyToClipboard(import.meta.env.VITE_SUPABASE_URL, "API URL")}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs flex gap-3">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p>
                To enable full write access for the MCP host, you must also provide your <strong>Service Role Key</strong>.
                Keep this key secret and only share it with trusted MCP providers.
              </p>
            </div>

            <div className="pt-2">
              <Button variant="outline" className="w-full gap-2" asChild>
                <a href={`https://supabase.com/dashboard/project/${status.projectId}/settings/api`} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Supabase API Settings
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MCP.json Preview */}
      <Card variant="elevated">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>mcp.json Preview</CardTitle>
              <CardDescription>Configuration for compatible agents</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(mcpConfigJson, "mcp.json")}>
              <Copy className="h-4 w-4 mr-2" />
              Copy JSON
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <pre className="p-4 bg-muted rounded-lg text-xs font-mono overflow-auto max-h-48">
            {mcpConfigJson}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
};
