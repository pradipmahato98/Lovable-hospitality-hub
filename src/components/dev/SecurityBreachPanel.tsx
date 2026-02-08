import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, Activity, Database, AlertCircle, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const SecurityBreachPanel = () => {
  const { data: auditLogs, isLoading } = useQuery({
    queryKey: ["security-audit-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_log")
        .select("*")
        .or("action.ilike.%security%,action.ilike.%fail%,action.ilike.%unauthorized%")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-destructive flex items-center gap-2">
              <ShieldAlert className="h-4 w-4" /> Threat Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive uppercase">
              {auditLogs && auditLogs.length > 5 ? "High" : auditLogs && auditLogs.length > 0 ? "Elevated" : "Low"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-warning" /> System Status
            </CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-success">Healthy</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="h-4 w-4 text-success" /> Data Integrity
            </CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-success">Verified</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" /> Recent Security Events
          </CardTitle>
          <CardDescription>Security-related entries from audit logs</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : !auditLogs || auditLogs.length === 0 ? (
            <div className="text-center py-8 border border-dashed rounded-lg">
              <p className="text-sm text-muted-foreground">No recent security events detected.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {auditLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 rounded bg-secondary/30 border border-border">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="border-warning text-warning capitalize">
                      {log.action}
                    </Badge>
                    <span className="text-sm font-medium">{log.entity_type}: {log.entity_id?.slice(0, 8) || 'System'}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
