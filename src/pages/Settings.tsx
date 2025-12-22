import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Hotel, Bell, Shield, ClipboardCheck, Loader2 } from "lucide-react";
import { useCheckInSettings, useUpdateCheckInSettings, CheckInFieldSettings } from "@/hooks/useSettings";

type SettingsTab = "property" | "notifications" | "security" | "checkin";

const Settings = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>("checkin");
  const { data: checkInSettings, isLoading: isLoadingSettings } = useCheckInSettings();
  const updateSettings = useUpdateCheckInSettings();

  const handleCheckInSettingChange = (key: keyof CheckInFieldSettings, value: boolean) => {
    if (!checkInSettings) return;
    updateSettings.mutate({
      ...checkInSettings,
      [key]: value,
    });
  };

  const tabs = [
    { id: "property" as const, icon: Hotel, label: "Property Details" },
    { id: "notifications" as const, icon: Bell, label: "Notifications" },
    { id: "security" as const, icon: Shield, label: "Security" },
    { id: "checkin" as const, icon: ClipboardCheck, label: "Check-in Settings" },
  ];

  return (
    <MainLayout title="Settings" subtitle="Manage your property and system preferences">
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
                {isLoadingSettings ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
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
                        disabled={updateSettings.isPending}
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
                        disabled={updateSettings.isPending}
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
                        disabled={updateSettings.isPending}
                      />
                    </div>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="propertyName">Property Name</Label>
                    <Input id="propertyName" defaultValue="LuxeStay Grand Hotel" className="bg-secondary" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="propertyCode">Property Code</Label>
                    <Input id="propertyCode" defaultValue="LSG-001" className="bg-secondary" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" defaultValue="123 Luxury Avenue, Downtown" className="bg-secondary" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" defaultValue="New York" className="bg-secondary" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input id="state" defaultValue="NY" className="bg-secondary" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip">ZIP Code</Label>
                    <Input id="zip" defaultValue="10001" className="bg-secondary" />
                  </div>
                </div>
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
                {[
                  { label: "New Booking Alerts", description: "Get notified when a new reservation is made", defaultChecked: true },
                  { label: "Check-in Reminders", description: "Receive reminders for upcoming arrivals", defaultChecked: true },
                  { label: "Low Inventory Alerts", description: "Alert when supplies are running low", defaultChecked: true },
                  { label: "Payment Notifications", description: "Get notified about payment status changes", defaultChecked: false },
                  { label: "Daily Summary", description: "Receive a daily digest of property activity", defaultChecked: true },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                    <Switch defaultChecked={item.defaultChecked} />
                  </div>
                ))}
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
