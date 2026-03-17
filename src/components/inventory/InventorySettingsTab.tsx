import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Settings2, Database, Calculator, Wallet, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function InventorySettingsTab() {
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    costingMethod: "weighted_average",
    assetAccount: "1200",
    expenseAccount: "5100",
    wastageAccount: "5200",
    autoReplenish: true,
    requireApproval: true,
    batchTracking: false
  });

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Inventory settings updated");
    }, 1000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h3 className="text-lg font-medium">Inventory Global Settings</h3>
        <p className="text-sm text-muted-foreground">Configure costing methods, accounting integration, and automation rules</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Costing & Valuation */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2 mb-2 font-semibold">
              <Calculator className="h-4 w-4 text-primary" /> Costing Method
            </div>
            <div className="space-y-2">
              <Label>Valuation Standard</Label>
              <Select value={settings.costingMethod} onValueChange={(v) => setSettings({...settings, costingMethod: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fifo">FIFO (First In First Out)</SelectItem>
                  <SelectItem value="lifo">LIFO (Last In First Out)</SelectItem>
                  <SelectItem value="weighted_average">Weighted Average</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">Determines how COGS is calculated for reports and POS deduction.</p>
            </div>
          </CardContent>
        </Card>

        {/* Finance Integration */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2 mb-2 font-semibold">
              <Wallet className="h-4 w-4 text-primary" /> GL Accounts
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Inventory Asset</Label>
                <Input size={30} value={settings.assetAccount} onChange={(e) => setSettings({...settings, assetAccount: e.target.value})} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Consumption</Label>
                <Input size={30} value={settings.expenseAccount} onChange={(e) => setSettings({...settings, expenseAccount: e.target.value})} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Automation Controls */}
        <Card className="md:col-span-2">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-6 font-semibold">
              <Settings2 className="h-4 w-4 text-primary" /> Workflow Controls
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-Requisitions</Label>
                  <p className="text-xs text-muted-foreground">Generate requests on low stock</p>
                </div>
                <Switch checked={settings.autoReplenish} onCheckedChange={(v) => setSettings({...settings, autoReplenish: v})} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Approval Required</Label>
                  <p className="text-xs text-muted-foreground">Approval for all stock issues</p>
                </div>
                <Switch checked={settings.requireApproval} onCheckedChange={(v) => setSettings({...settings, requireApproval: v})} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Batch Tracking</Label>
                  <p className="text-xs text-muted-foreground">Enforce batch & expiry logging</p>
                </div>
                <Switch checked={settings.batchTracking} onCheckedChange={(v) => setSettings({...settings, batchTracking: v})} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} disabled={isSaving} variant="blue" className="w-full md:w-auto">
          {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
          Save Configuration
        </Button>
      </div>
    </div>
  );
}
