import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Moon, Sun, Bell, Mail } from "lucide-react";
import { useTheme } from "next-themes";

export const PreferencesTab = () => {
  const { setTheme, resolvedTheme } = useTheme();

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Preferences</CardTitle>
        <CardDescription>Customize your experience within the ERP.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            {resolvedTheme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            <div>
              <p className="font-medium">Dark Mode</p>
              <p className="text-sm text-muted-foreground">Toggle between light and dark theme.</p>
            </div>
          </div>
          <Switch checked={resolvedTheme === "dark"} onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")} />
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5" />
            <div>
              <p className="font-medium">Push Notifications</p>
              <p className="text-sm text-muted-foreground">Receive browser alerts for important updates.</p>
            </div>
          </div>
          <Switch defaultChecked />
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5" />
            <div>
              <p className="font-medium">Email Digests</p>
              <p className="text-sm text-muted-foreground">Weekly summary of activities and reports.</p>
            </div>
          </div>
          <Switch />
        </div>
      </CardContent>
    </Card>
  );
};
