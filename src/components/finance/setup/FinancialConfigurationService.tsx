import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Settings2,
  RefreshCw,
  Workflow,
  FileCheck,
  Globe
} from "lucide-react";

export function FinancialConfigurationService({ isReadOnly }: { isReadOnly?: boolean }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold font-display flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-primary" /> Financial Configuration
        </h2>
        <p className="text-muted-foreground text-sm">Govern system-wide posting behaviors, approval chains, and exchange rate sources.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Workflow className="h-4 w-4 text-primary" /> Global Posting Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm">Auto-Post Guest Folios</Label>
                <p className="text-xs text-muted-foreground">Post folio charges to GL immediately on checkout.</p>
              </div>
              <Switch checked={true} disabled={isReadOnly} />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm">Enforce Reference #</Label>
                <p className="text-xs text-muted-foreground">Require reference numbers for all manual journals.</p>
              </div>
              <Switch checked={true} disabled={isReadOnly} />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm">Allow Reversing Entries</Label>
                <p className="text-xs text-muted-foreground">Enable one-click reversal for posted entries.</p>
              </div>
              <Switch checked={false} disabled={isReadOnly} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-primary" /> Approval Thresholds
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 border rounded-lg bg-secondary/10 flex justify-between items-center">
               <span className="text-xs">Single Expense Limit (No Approval)</span>
               <Badge variant="secondary">$500.00</Badge>
            </div>
            <div className="p-3 border rounded-lg bg-secondary/10 flex justify-between items-center">
               <span className="text-xs">Manager Approval Required Above</span>
               <Badge variant="secondary">$5,000.00</Badge>
            </div>
            <Button variant="outline" size="sm" className="w-full text-xs" disabled={isReadOnly}>
              Update Thresholds
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" /> Exchange Rate Sources
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex items-center justify-between p-3 rounded-lg border bg-secondary/30">
                <div className="flex items-center gap-3">
                   <div className="h-8 w-8 rounded bg-background flex items-center justify-center font-bold text-xs">OANDA</div>
                   <span className="text-xs font-medium">OANDA FX Data</span>
                </div>
                <Badge variant="outline" className="text-success border-success/20">Connected</Badge>
             </div>
             <Button variant="outline" size="sm" className="w-full text-xs" disabled={isReadOnly}>
                <RefreshCw className="h-3 w-3 mr-2" /> Force Sync Rates
             </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
