import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Lock, Smartphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const SecurityTab = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Change Password
          </CardTitle>
          <CardDescription>Secure your account with a strong password.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <Input id="current-password" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input id="new-password" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input id="confirm-password" type="password" />
          </div>
          <Button variant="gold">Update Password</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            Two-Factor Authentication (2FA)
          </CardTitle>
          <CardDescription>Add an extra layer of security to your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-dashed">
            <div>
              <p className="font-medium">Authenticator App</p>
              <p className="text-sm text-muted-foreground">Use an app like Google Authenticator to get security codes.</p>
            </div>
            <Button variant="outline">Setup 2FA</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Login Sessions
          </CardTitle>
          <CardDescription>Manage your active sessions across different devices.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b">
              <div>
                <p className="font-medium text-sm">Chrome on Windows</p>
                <p className="text-xs text-muted-foreground">London, UK • Current Session</p>
              </div>
              <Badge variant="outline" className="text-success border-success/30 bg-success/10">Active</Badge>
            </div>
            <div className="flex items-center justify-between py-2 border-b text-muted-foreground">
              <div>
                <p className="font-medium text-sm">Safari on iPhone</p>
                <p className="text-xs">Paris, France • 2 days ago</p>
              </div>
              <Button variant="ghost" size="sm">Revoke</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
