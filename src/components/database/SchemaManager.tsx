import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, Shield, Lock, Unlock, Key } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export const SchemaManager = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Row Level Security (RLS)
          </CardTitle>
          <CardDescription>Configure access control policies for your tables</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-sidebar-border">
            <div className="space-y-0.5">
              <Label className="text-base">Global RLS Enforcement</Label>
              <p className="text-sm text-muted-foreground">Force all queries to pass through RLS policies</p>
            </div>
            <Switch checked={true} />
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Protected Tables</h4>
            {[ "reservations", "guests", "profiles", "staff_members" ].map(table => (
              <div key={table} className="flex items-center justify-between py-2">
                <span className="font-medium text-sm">{table}</span>
                <Badge className="bg-success/20 text-success border-success/30 gap-1">
                  <Lock className="h-3 w-3" />
                  Enabled
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            End-to-End Encryption
          </CardTitle>
          <CardDescription>Manage encrypted fields and security keys</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 text-primary mb-4">
            <p className="text-sm font-medium">
              E2EE is active. Sensitive data is encrypted on the client before storage.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Encrypted Fields</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between py-2 border-b border-sidebar-border">
                <div>
                  <p className="text-sm font-medium">guests.email</p>
                  <p className="text-xs text-muted-foreground">AES-256-GCM</p>
                </div>
                <Badge variant="outline">Encrypted</Badge>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-sidebar-border">
                <div>
                  <p className="text-sm font-medium">guests.phone</p>
                  <p className="text-xs text-muted-foreground">AES-256-GCM</p>
                </div>
                <Badge variant="outline">Encrypted</Badge>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">staff_members.salary</p>
                  <p className="text-xs text-muted-foreground">AES-256-GCM</p>
                </div>
                <Badge variant="outline">Encrypted</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
