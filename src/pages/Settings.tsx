import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Hotel, 
  Bell, 
  Shield, 
  ClipboardCheck, 
  Loader2, 
  CreditCard, 
  Globe, 
  Tags,
  ShieldAlert,
  Percent
} from "lucide-react";
import { 
  useCheckInSettings, 
  useUpdateCheckInSettings, 
  usePaymentSettings,
  useUpdatePaymentSettings,
  useBookingSourcesSettings,
  useUpdateBookingSourcesSettings,
  useRatePlansSettings,
  useUpdateRatePlansSettings,
  usePropertySettings,
  useUpdatePropertySettings,
  useNotificationSettings,
  useUpdateNotificationSettings,
  CheckInFieldSettings,
  PaymentSettings,
  PropertySettings,
  NotificationSettings,
} from "@/hooks/useSettings";
import { useIsAdmin } from "@/hooks/useUserRole";
import { Navigate } from "react-router-dom";
import { Slider } from "@/components/ui/slider";

type SettingsTab = "checkin" | "payment" | "sources" | "rates" | "property" | "notifications" | "security";

const Settings = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>("checkin");
  const { isAdmin, isLoading: isLoadingRole } = useIsAdmin();
  
  // Check-in settings
  const { data: checkInSettings, isLoading: isLoadingCheckIn } = useCheckInSettings();
  const updateCheckIn = useUpdateCheckInSettings();

  // Payment settings
  const { data: paymentSettings, isLoading: isLoadingPayment } = usePaymentSettings();
  const updatePayment = useUpdatePaymentSettings();

  // Booking sources
  const { data: bookingSources, isLoading: isLoadingSources } = useBookingSourcesSettings();
  const updateSources = useUpdateBookingSourcesSettings();

  // Rate plans
  const { data: ratePlans, isLoading: isLoadingRates } = useRatePlansSettings();
  const updateRates = useUpdateRatePlansSettings();

  // Property settings
  const { data: propertySettings, isLoading: isLoadingProperty } = usePropertySettings();
  const updateProperty = useUpdatePropertySettings();

  // Notification settings
  const { data: notificationSettings, isLoading: isLoadingNotifications } = useNotificationSettings();
  const updateNotifications = useUpdateNotificationSettings();

  // Redirect non-admins
  if (isLoadingRole) {
    return (
      <MainLayout title="Settings" subtitle="Loading...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const handleCheckInSettingChange = (key: keyof CheckInFieldSettings, value: boolean) => {
    if (!checkInSettings) return;
    updateCheckIn.mutate({ ...checkInSettings, [key]: value });
  };

  const handlePaymentSettingChange = (key: keyof PaymentSettings, value: boolean | number) => {
    if (!paymentSettings) return;
    updatePayment.mutate({ ...paymentSettings, [key]: value });
  };

  const handleSourceToggle = (sourceId: string, enabled: boolean) => {
    if (!bookingSources) return;
    const updated = {
      sources: bookingSources.sources.map(s => 
        s.id === sourceId ? { ...s, enabled } : s
      ),
    };
    updateSources.mutate(updated);
  };

  const handleSourceCommission = (sourceId: string, commission: number) => {
    if (!bookingSources) return;
    const updated = {
      sources: bookingSources.sources.map(s => 
        s.id === sourceId ? { ...s, commission_percentage: commission } : s
      ),
    };
    updateSources.mutate(updated);
  };

  const handleRatePlanToggle = (planId: string, enabled: boolean) => {
    if (!ratePlans) return;
    const updated = {
      plans: ratePlans.plans.map(p => 
        p.id === planId ? { ...p, enabled } : p
      ),
    };
    updateRates.mutate(updated);
  };

  const handleRatePlanDiscount = (planId: string, discount: number) => {
    if (!ratePlans) return;
    const updated = {
      plans: ratePlans.plans.map(p => 
        p.id === planId ? { ...p, discount_percentage: discount } : p
      ),
    };
    updateRates.mutate(updated);
  };

  const handlePropertyChange = (key: keyof PropertySettings, value: string) => {
    if (!propertySettings) return;
    updateProperty.mutate({ ...propertySettings, [key]: value });
  };

  const handleNotificationChange = (key: keyof NotificationSettings, value: boolean) => {
    if (!notificationSettings) return;
    updateNotifications.mutate({ ...notificationSettings, [key]: value });
  };

  const tabs = [
    { id: "checkin" as const, icon: ClipboardCheck, label: "Check-in Settings" },
    { id: "payment" as const, icon: CreditCard, label: "Payment Settings" },
    { id: "sources" as const, icon: Globe, label: "Booking Sources" },
    { id: "rates" as const, icon: Tags, label: "Rate Plans" },
    { id: "property" as const, icon: Hotel, label: "Property Details" },
    { id: "notifications" as const, icon: Bell, label: "Notifications" },
    { id: "security" as const, icon: Shield, label: "Security" },
  ];

  const renderLoadingState = () => (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <MainLayout title="Admin Settings" subtitle="Manage system configuration (Admin only)">
      <div className="mb-4 flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
        <ShieldAlert className="h-4 w-4" />
        <span>You are viewing admin-only settings. Changes affect all users.</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column - Navigation */}
        <div className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0">
          {tabs.map((item) => (
            <Button
              key={item.id}
              variant={activeTab === item.id ? "secondary" : "ghost"}
              className="justify-start gap-3 whitespace-nowrap flex-shrink-0"
              onClick={() => setActiveTab(item.id)}
            >
              <item.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{item.label}</span>
            </Button>
          ))}
        </div>

        {/* Right Column - Settings Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Check-in Settings */}
          {activeTab === "checkin" && (
            <Card variant="elevated" className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5" />
                  Check-in Field Requirements
                </CardTitle>
                <CardDescription>
                  Configure which fields are mandatory during guest check-in
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingCheckIn ? renderLoadingState() : (
                  <>
                    <div className="flex items-center justify-between py-3 border-b border-border">
                      <div>
                        <p className="text-sm font-medium text-foreground">ID Document Required</p>
                        <p className="text-xs text-muted-foreground">
                          Require guests to provide identification (passport, driver's license, etc.)
                        </p>
                      </div>
                      <Switch
                        checked={checkInSettings?.id_required ?? true}
                        onCheckedChange={(checked) => handleCheckInSettingChange("id_required", checked)}
                        disabled={updateCheckIn.isPending}
                      />
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-border">
                      <div>
                        <p className="text-sm font-medium text-foreground">Phone Number Required</p>
                        <p className="text-xs text-muted-foreground">
                          Require guests to provide a contact phone number
                        </p>
                      </div>
                      <Switch
                        checked={checkInSettings?.phone_required ?? false}
                        onCheckedChange={(checked) => handleCheckInSettingChange("phone_required", checked)}
                        disabled={updateCheckIn.isPending}
                      />
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">Email Address Required</p>
                        <p className="text-xs text-muted-foreground">
                          Require guests to provide an email address
                        </p>
                      </div>
                      <Switch
                        checked={checkInSettings?.email_required ?? false}
                        onCheckedChange={(checked) => handleCheckInSettingChange("email_required", checked)}
                        disabled={updateCheckIn.isPending}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Payment Settings */}
          {activeTab === "payment" && (
            <Card variant="elevated" className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Settings
                </CardTitle>
                <CardDescription>
                  Configure accepted payment methods and deposit requirements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingPayment ? renderLoadingState() : (
                  <>
                    <div className="flex items-center justify-between py-3 border-b border-border">
                      <div>
                        <p className="text-sm font-medium text-foreground">Cash Payments</p>
                        <p className="text-xs text-muted-foreground">Accept cash payments at front desk</p>
                      </div>
                      <Switch
                        checked={paymentSettings?.cash_enabled ?? true}
                        onCheckedChange={(checked) => handlePaymentSettingChange("cash_enabled", checked)}
                        disabled={updatePayment.isPending}
                      />
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-border">
                      <div>
                        <p className="text-sm font-medium text-foreground">Card Payments</p>
                        <p className="text-xs text-muted-foreground">Accept credit/debit card payments</p>
                      </div>
                      <Switch
                        checked={paymentSettings?.card_enabled ?? true}
                        onCheckedChange={(checked) => handlePaymentSettingChange("card_enabled", checked)}
                        disabled={updatePayment.isPending}
                      />
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-border">
                      <div>
                        <p className="text-sm font-medium text-foreground">Bank Transfer</p>
                        <p className="text-xs text-muted-foreground">Accept bank transfer payments</p>
                      </div>
                      <Switch
                        checked={paymentSettings?.bank_transfer_enabled ?? false}
                        onCheckedChange={(checked) => handlePaymentSettingChange("bank_transfer_enabled", checked)}
                        disabled={updatePayment.isPending}
                      />
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-border">
                      <div>
                        <p className="text-sm font-medium text-foreground">Require Deposit</p>
                        <p className="text-xs text-muted-foreground">Require deposit payment on booking</p>
                      </div>
                      <Switch
                        checked={paymentSettings?.require_deposit ?? false}
                        onCheckedChange={(checked) => handlePaymentSettingChange("require_deposit", checked)}
                        disabled={updatePayment.isPending}
                      />
                    </div>
                    {paymentSettings?.require_deposit && (
                      <div className="py-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-foreground">Deposit Percentage</p>
                          <span className="text-sm font-semibold text-primary">
                            {paymentSettings?.deposit_percentage ?? 20}%
                          </span>
                        </div>
                        <Slider
                          value={[paymentSettings?.deposit_percentage ?? 20]}
                          onValueChange={([value]) => handlePaymentSettingChange("deposit_percentage", value)}
                          min={5}
                          max={100}
                          step={5}
                          disabled={updatePayment.isPending}
                        />
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Booking Sources */}
          {activeTab === "sources" && (
            <Card variant="elevated" className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Booking Sources
                </CardTitle>
                <CardDescription>
                  Manage booking channels and commission rates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingSources ? renderLoadingState() : (
                  <>
                    {bookingSources?.sources.map((source, index) => (
                      <div 
                        key={source.id} 
                        className={`py-3 ${index < bookingSources.sources.length - 1 ? "border-b border-border" : ""}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="text-sm font-medium text-foreground">{source.name}</p>
                          </div>
                          <Switch
                            checked={source.enabled}
                            onCheckedChange={(checked) => handleSourceToggle(source.id, checked)}
                            disabled={updateSources.isPending}
                          />
                        </div>
                        {source.enabled && (
                          <div className="flex items-center gap-3 mt-2 pl-0">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Percent className="h-3 w-3" />
                              <span>Commission:</span>
                            </div>
                            <Input
                              type="number"
                              value={source.commission_percentage}
                              onChange={(e) => handleSourceCommission(source.id, Number(e.target.value))}
                              className="w-20 h-8 text-sm"
                              min={0}
                              max={100}
                              disabled={updateSources.isPending}
                            />
                            <span className="text-xs text-muted-foreground">%</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Rate Plans */}
          {activeTab === "rates" && (
            <Card variant="elevated" className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tags className="h-5 w-5" />
                  Rate Plans
                </CardTitle>
                <CardDescription>
                  Configure pricing plans and discounts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingRates ? renderLoadingState() : (
                  <>
                    {ratePlans?.plans.map((plan, index) => (
                      <div 
                        key={plan.id} 
                        className={`py-3 ${index < ratePlans.plans.length - 1 ? "border-b border-border" : ""}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="text-sm font-medium text-foreground">{plan.name}</p>
                            <p className="text-xs text-muted-foreground">{plan.description}</p>
                          </div>
                          <Switch
                            checked={plan.enabled}
                            onCheckedChange={(checked) => handleRatePlanToggle(plan.id, checked)}
                            disabled={updateRates.isPending}
                          />
                        </div>
                        {plan.enabled && plan.id !== "standard" && (
                          <div className="flex items-center gap-3 mt-2">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Percent className="h-3 w-3" />
                              <span>Discount:</span>
                            </div>
                            <Input
                              type="number"
                              value={plan.discount_percentage}
                              onChange={(e) => handleRatePlanDiscount(plan.id, Number(e.target.value))}
                              className="w-20 h-8 text-sm"
                              min={0}
                              max={100}
                              disabled={updateRates.isPending}
                            />
                            <span className="text-xs text-muted-foreground">%</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Property Details */}
          {activeTab === "property" && (
            <Card variant="elevated" className="animate-fade-in">
              <CardHeader>
                <CardTitle>Property Details</CardTitle>
                <CardDescription>Update your hotel information and branding</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoadingProperty ? renderLoadingState() : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="propertyName">Property Name</Label>
                        <Input 
                          id="propertyName" 
                          value={propertySettings?.name ?? ""} 
                          onChange={(e) => handlePropertyChange("name", e.target.value)}
                          className="bg-secondary" 
                          disabled={updateProperty.isPending}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="propertyCode">Property Code</Label>
                        <Input 
                          id="propertyCode" 
                          value={propertySettings?.code ?? ""} 
                          onChange={(e) => handlePropertyChange("code", e.target.value)}
                          className="bg-secondary" 
                          disabled={updateProperty.isPending}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input 
                        id="address" 
                        value={propertySettings?.address ?? ""} 
                        onChange={(e) => handlePropertyChange("address", e.target.value)}
                        className="bg-secondary" 
                        disabled={updateProperty.isPending}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input 
                          id="city" 
                          value={propertySettings?.city ?? ""} 
                          onChange={(e) => handlePropertyChange("city", e.target.value)}
                          className="bg-secondary" 
                          disabled={updateProperty.isPending}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input 
                          id="state" 
                          value={propertySettings?.state ?? ""} 
                          onChange={(e) => handlePropertyChange("state", e.target.value)}
                          className="bg-secondary" 
                          disabled={updateProperty.isPending}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="zip">ZIP Code</Label>
                        <Input 
                          id="zip" 
                          value={propertySettings?.zip ?? ""} 
                          onChange={(e) => handlePropertyChange("zip", e.target.value)}
                          className="bg-secondary" 
                          disabled={updateProperty.isPending}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input 
                          id="phone" 
                          value={propertySettings?.phone ?? ""} 
                          onChange={(e) => handlePropertyChange("phone", e.target.value)}
                          className="bg-secondary" 
                          disabled={updateProperty.isPending}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input 
                          id="email" 
                          type="email"
                          value={propertySettings?.email ?? ""} 
                          onChange={(e) => handlePropertyChange("email", e.target.value)}
                          className="bg-secondary" 
                          disabled={updateProperty.isPending}
                        />
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Notifications */}
          {activeTab === "notifications" && (
            <Card variant="elevated" className="animate-fade-in">
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Configure how you receive alerts and updates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingNotifications ? renderLoadingState() : (
                  <>
                    <div className="flex items-center justify-between py-3 border-b border-border">
                      <div>
                        <p className="text-sm font-medium text-foreground">New Booking Alerts</p>
                        <p className="text-xs text-muted-foreground">Get notified when a new reservation is made</p>
                      </div>
                      <Switch 
                        checked={notificationSettings?.new_booking_alerts ?? true}
                        onCheckedChange={(checked) => handleNotificationChange("new_booking_alerts", checked)}
                        disabled={updateNotifications.isPending}
                      />
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-border">
                      <div>
                        <p className="text-sm font-medium text-foreground">Check-in Reminders</p>
                        <p className="text-xs text-muted-foreground">Receive reminders for upcoming arrivals</p>
                      </div>
                      <Switch 
                        checked={notificationSettings?.checkin_reminders ?? true}
                        onCheckedChange={(checked) => handleNotificationChange("checkin_reminders", checked)}
                        disabled={updateNotifications.isPending}
                      />
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-border">
                      <div>
                        <p className="text-sm font-medium text-foreground">Low Inventory Alerts</p>
                        <p className="text-xs text-muted-foreground">Alert when supplies are running low</p>
                      </div>
                      <Switch 
                        checked={notificationSettings?.low_inventory_alerts ?? true}
                        onCheckedChange={(checked) => handleNotificationChange("low_inventory_alerts", checked)}
                        disabled={updateNotifications.isPending}
                      />
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-border">
                      <div>
                        <p className="text-sm font-medium text-foreground">Payment Notifications</p>
                        <p className="text-xs text-muted-foreground">Get notified about payment status changes</p>
                      </div>
                      <Switch 
                        checked={notificationSettings?.payment_notifications ?? false}
                        onCheckedChange={(checked) => handleNotificationChange("payment_notifications", checked)}
                        disabled={updateNotifications.isPending}
                      />
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">Daily Summary</p>
                        <p className="text-xs text-muted-foreground">Receive a daily digest of property activity</p>
                      </div>
                      <Switch 
                        checked={notificationSettings?.daily_summary ?? true}
                        onCheckedChange={(checked) => handleNotificationChange("daily_summary", checked)}
                        disabled={updateNotifications.isPending}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Security */}
          {activeTab === "security" && (
            <Card variant="elevated" className="border-destructive/30">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>Irreversible actions for your property</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 rounded-lg bg-destructive/10">
                  <div>
                    <p className="text-sm font-medium text-foreground">Delete Property</p>
                    <p className="text-xs text-muted-foreground">Permanently delete this property and all associated data</p>
                  </div>
                  <Button variant="destructive" size="sm">Delete</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Settings;