import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ShieldCheck,
  Activity,
  CalendarDays,
  Settings2,
  Download,
  History,
  RefreshCw,
  Lock,
  Eye
} from "lucide-react";
import { useBusinessDate } from "@/hooks/useSettings";

interface ServiceBootstrapProps {
  title: string;
  category: string;
  description: string;
  isReadOnly?: boolean;
  activeRole?: string;
}

export function ServiceBootstrap({
  title,
  category,
  description,
  isReadOnly = false,
  activeRole = "FA"
}: ServiceBootstrapProps) {
  const { data: businessDate } = useBusinessDate();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </div>
              <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                <ShieldCheck className="h-3 w-3 mr-1" /> Verified
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Service Name</Label>
                <Input defaultValue={title} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input defaultValue={category} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Last Audit</Label>
                <div className="flex items-center text-sm text-muted-foreground pt-2">
                  <CalendarDays className="h-4 w-4 mr-2" />
                  {businessDate || "Today"}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex items-center text-sm text-success font-medium pt-2">
                  <Activity className="h-4 w-4 mr-2" />
                  Live & Operational
                </div>
              </div>
            </div>

            {isReadOnly && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex items-start gap-3">
                <Lock className="h-5 w-5 text-amber-500 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-amber-500">Read-Only Access</h4>
                  <p className="text-xs text-muted-foreground">Your current role ({activeRole}) only has viewing privileges for this module. Modification actions are disabled.</p>
                </div>
              </div>
            )}

            <div className="space-y-4 pt-4 border-t">
              <h4 className="text-sm font-semibold">Active Rules & Parameters</h4>
              <div className="grid grid-cols-1 gap-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border">
                    <span className="text-sm">Compliance Rule #{i}00{i}</span>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
          <div className="p-6 pt-0 flex justify-end gap-2">
            <Button variant="outline" size="sm">Download Audit Log</Button>
            <Button size="sm" className="gap-2" disabled={isReadOnly}>
              <Settings2 className="h-4 w-4" />
              Update Rules
            </Button>
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground font-medium">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Button variant="outline" className="w-full justify-start gap-2 h-11">
                <Download className="h-4 w-4" /> Export Configuration
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2 h-11">
                <History className="h-4 w-4" /> View History
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2 h-11 text-destructive hover:text-destructive">
                <RefreshCw className="h-4 w-4" /> Reset Module
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/10">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Module Intelligence</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed">
                This module is currently processing real-time financial data for {title}.
                All changes are recorded in the system audit log and compliant with local financial regulations.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
