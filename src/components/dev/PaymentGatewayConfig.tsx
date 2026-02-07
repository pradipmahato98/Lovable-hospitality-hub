import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  CreditCard,
  Settings,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  ExternalLink,
  Wallet,
  Building2,
  Smartphone,
} from "lucide-react";
import {
  usePaymentGateways,
  useUpdatePaymentGateway,
  useTogglePaymentGateway,
  PaymentGatewayConfig as GatewayConfig,
} from "@/hooks/usePaymentGateways";

const gatewayIcons: Record<string, React.ReactNode> = {
  esewa: <Wallet className="h-5 w-5 text-primary" />,
  khalti: <Wallet className="h-5 w-5 text-primary" />,
  imepay: <Smartphone className="h-5 w-5 text-destructive" />,
  connectips: <Building2 className="h-5 w-5 text-primary" />,
  fonepay: <CreditCard className="h-5 w-5 text-primary" />,
  prabhupay: <Wallet className="h-5 w-5 text-primary" />,
  nicasia_bank: <Building2 className="h-5 w-5 text-primary" />,
};

const gatewayDocs: Record<string, string> = {
  esewa: "https://developer.esewa.com.np/",
  khalti: "https://docs.khalti.com/",
  imepay: "https://imepay.com.np/merchant",
  connectips: "https://connectips.com/",
  fonepay: "https://fonepay.com/merchant",
  prabhupay: "https://prabhupay.com/",
  nicasia_bank: "https://nicasiabank.com/",
};

export const PaymentGatewayConfigPanel = () => {
  const { data: gatewaysData, isLoading } = usePaymentGateways();
  const updateGateway = useUpdatePaymentGateway();
  const toggleGateway = useTogglePaymentGateway();

  const [selectedGateway, setSelectedGateway] = useState<GatewayConfig | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  const [formData, setFormData] = useState({
    api_key: "",
    secret_key: "",
    merchant_id: "",
    sandbox_mode: true,
    webhook_url: "",
  });

  const handleConfigClick = (gateway: GatewayConfig) => {
    setSelectedGateway(gateway);
    setFormData({
      api_key: gateway.api_key || "",
      secret_key: gateway.secret_key || "",
      merchant_id: gateway.merchant_id || "",
      sandbox_mode: gateway.sandbox_mode ?? true,
      webhook_url: gateway.webhook_url || "",
    });
    setConfigDialogOpen(true);
  };

  const handleSaveConfig = () => {
    if (!selectedGateway) return;

    const isConfigured = !!(formData.api_key || formData.merchant_id);
    
    updateGateway.mutate({
      ...selectedGateway,
      ...formData,
      is_configured: isConfigured,
    });
    setConfigDialogOpen(false);
  };

  const handleToggle = (gatewayId: string, enabled: boolean) => {
    const gateway = gatewaysData?.gateways.find(g => g.id === gatewayId);
    if (gateway && !gateway.is_configured && enabled) {
      // Open config dialog if trying to enable unconfigured gateway
      handleConfigClick(gateway);
      return;
    }
    toggleGateway.mutate({ gatewayId, enabled });
  };

  const toggleSecretVisibility = (field: string) => {
    setShowSecrets(prev => ({ ...prev, [field]: !prev[field] }));
  };

  if (isLoading) {
    return (
      <Card variant="elevated">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const gateways = gatewaysData?.gateways || [];

  return (
    <>
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Nepal Payment Gateways
          </CardTitle>
          <CardDescription>
            Configure payment gateway API keys and settings. API integration pending - configure credentials for future activation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {gateways.map((gateway) => (
            <div
              key={gateway.id}
              className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-background">
                  {gatewayIcons[gateway.id] || <CreditCard className="h-5 w-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{gateway.name}</p>
                    <Badge variant="outline" className="text-xs">
                      {gateway.code}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{gateway.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {gateway.is_configured ? (
                      <Badge className="bg-success/20 text-success border-success/30 text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Configured
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-warning/20 text-warning border-warning/30 text-xs">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Not Configured
                      </Badge>
                    )}
                    {gateway.sandbox_mode && gateway.is_configured && (
                      <Badge variant="outline" className="text-xs">
                        Sandbox
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleConfigClick(gateway)}
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Configure
                </Button>
                <Switch
                  checked={gateway.enabled}
                  onCheckedChange={(enabled) => handleToggle(gateway.id, enabled)}
                  disabled={!gateway.is_configured}
                />
              </div>
            </div>
          ))}

          <div className="p-4 rounded-lg border border-dashed border-border text-center">
            <p className="text-sm text-muted-foreground">
              💡 Payment gateway APIs are pending integration. Configure your credentials now and they will be activated once the APIs are connected.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Dialog */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedGateway && gatewayIcons[selectedGateway.id]}
              Configure {selectedGateway?.name}
            </DialogTitle>
            <DialogDescription>
              Enter your API credentials from the {selectedGateway?.name} merchant portal.
              {selectedGateway && gatewayDocs[selectedGateway.id] && (
                <a
                  href={gatewayDocs[selectedGateway.id]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline ml-1"
                >
                  View documentation <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="merchant_id">Merchant ID / Code</Label>
              <Input
                id="merchant_id"
                value={formData.merchant_id}
                onChange={(e) => setFormData({ ...formData, merchant_id: e.target.value })}
                placeholder="Enter your merchant ID"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="api_key">API Key / Public Key</Label>
              <div className="relative">
                <Input
                  id="api_key"
                  type={showSecrets.api_key ? "text" : "password"}
                  value={formData.api_key}
                  onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                  placeholder="Enter your API key"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => toggleSecretVisibility("api_key")}
                >
                  {showSecrets.api_key ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secret_key">Secret Key / Private Key</Label>
              <div className="relative">
                <Input
                  id="secret_key"
                  type={showSecrets.secret_key ? "text" : "password"}
                  value={formData.secret_key}
                  onChange={(e) => setFormData({ ...formData, secret_key: e.target.value })}
                  placeholder="Enter your secret key"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => toggleSecretVisibility("secret_key")}
                >
                  {showSecrets.secret_key ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="webhook_url">Webhook URL (Optional)</Label>
              <Input
                id="webhook_url"
                value={formData.webhook_url}
                onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
                placeholder="https://your-domain.com/api/webhook"
              />
              <p className="text-xs text-muted-foreground">
                Webhook endpoint for payment notifications
              </p>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
              <div>
                <p className="text-sm font-medium">Sandbox / Test Mode</p>
                <p className="text-xs text-muted-foreground">
                  Use test environment for development
                </p>
              </div>
              <Switch
                checked={formData.sandbox_mode}
                onCheckedChange={(checked) => setFormData({ ...formData, sandbox_mode: checked })}
              />
            </div>

            {!formData.sandbox_mode && (
              <div className="p-3 rounded-lg bg-warning/10 border border-warning/30 text-warning text-sm">
                <AlertCircle className="h-4 w-4 inline mr-2" />
                Production mode is enabled. Real transactions will be processed.
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveConfig} disabled={updateGateway.isPending}>
              {updateGateway.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
