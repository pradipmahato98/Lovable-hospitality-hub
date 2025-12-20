import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Hotel, Bell, Shield, Globe, Palette, Users } from "lucide-react";

const Settings = () => {
  return (
    <MainLayout title="Settings" subtitle="Manage your property and system preferences">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Navigation */}
        <div className="space-y-2">
          {[
            { icon: Hotel, label: "Property Details", active: true },
            { icon: Bell, label: "Notifications" },
            { icon: Shield, label: "Security" },
            { icon: Globe, label: "Integrations" },
            { icon: Palette, label: "Appearance" },
            { icon: Users, label: "Team Members" },
          ].map((item) => (
            <Button
              key={item.label}
              variant={item.active ? "secondary" : "ghost"}
              className="w-full justify-start gap-3"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Button>
          ))}
        </div>

        {/* Right Column - Settings Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Property Details */}
          <Card variant="elevated" className="animate-fade-in">
            <CardHeader>
              <CardTitle>Property Details</CardTitle>
              <CardDescription>Update your hotel information and branding</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
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
              <div className="grid grid-cols-3 gap-4">
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

          {/* Notifications */}
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

          {/* Danger Zone */}
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

          {/* Save Button */}
          <div className="flex justify-end">
            <Button variant="gold" size="lg">
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Settings;
