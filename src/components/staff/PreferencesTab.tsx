import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Moon, Sun, Bell, Mail, Sparkles } from "lucide-react";
import { useTheme } from "next-themes";
import { useUIPreferences, useUpdateUIPreferences } from "@/hooks/useSettings";

export const PreferencesTab = () => {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { data: uiPrefs, isLoading: loadingPrefs } = useUIPreferences();
  const updateUiPrefs = useUpdateUIPreferences();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Preferences</CardTitle>
        <CardDescription>Customize your experience within the ERP.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            {mounted && resolvedTheme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            <div>
              <p className="font-medium">Dark Mode</p>
              <p className="text-sm text-muted-foreground">Toggle between light and dark theme.</p>
            </div>
          </div>
          <Switch
            disabled={!mounted}
            checked={mounted && resolvedTheme === "dark"}
            onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
          />
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

        <div className="pt-4 border-t">
          <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider">Global UI Features</h3>
          <div className="flex items-center justify-between p-4 border border-primary/20 bg-primary/5 rounded-lg">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">iOS Materials</p>
                <p className="text-sm text-muted-foreground">Enable glassmorphism and backdrop blur effects across the ERP.</p>
              </div>
            </div>
            <Switch
              disabled={loadingPrefs || !uiPrefs}
              checked={uiPrefs?.ios_materials || false}
              onCheckedChange={(checked) => {
                if (uiPrefs) {
                  updateUiPrefs.mutate({ ...uiPrefs, ios_materials: checked });
                }
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
