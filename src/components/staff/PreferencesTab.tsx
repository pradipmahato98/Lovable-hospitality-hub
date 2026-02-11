import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Moon, Sun, Bell, Mail, Sparkles, Smartphone, Layers } from "lucide-react";
import { useTheme } from "next-themes";
import { useUIPreferences, useUpdateUIPreferences, UIPreferences } from "@/hooks/useSettings";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
        {/* iOS Materials / Interface Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Operating Preferences</h3>

          <div className="flex items-center justify-between p-4 border border-primary/20 bg-primary/5 rounded-lg">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">iOS Materials (Glassmorphism)</p>
                <p className="text-sm text-muted-foreground">Enable modern glass effects and backdrop blur throughout the system.</p>
              </div>
            </div>
            <Switch
              disabled={loadingPrefs}
              checked={uiPrefs?.ios_materials ?? true}
              onCheckedChange={(checked) => {
                updateUiPrefs.mutate({ ...(uiPrefs || {}), ios_materials: checked } as UIPreferences);
              }}
            />
          </div>

          {uiPrefs?.ios_materials !== false && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-scale-in">
              <div className="p-4 border rounded-lg space-y-3 bg-card/50">
                <div className="flex items-center gap-3">
                  <Layers className="h-4 w-4 text-primary" />
                  <p className="text-sm font-medium">Glass Intensity</p>
                </div>
                <Select
                  value={uiPrefs?.glass_intensity || 'medium'}
                  onValueChange={(value: UIPreferences['glass_intensity']) => {
                    updateUiPrefs.mutate({ ...(uiPrefs || {}), glass_intensity: value } as UIPreferences);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select intensity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low (Subtle)</SelectItem>
                    <SelectItem value="medium">Medium (Standard)</SelectItem>
                    <SelectItem value="high">High (Deep Blur)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground">
                  Adjust the blur and transparency level of the glass effect.
                </p>
              </div>

              <div className="p-4 border rounded-lg flex items-center justify-between bg-card/50">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-4 w-4 text-primary" />
                    <p className="text-sm font-medium">Disable on Mobile</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Recommended for better performance on older devices.
                  </p>
                </div>
                <Switch
                  checked={uiPrefs?.disable_on_mobile || false}
                  onCheckedChange={(checked) => {
                    updateUiPrefs.mutate({ ...(uiPrefs || {}), disable_on_mobile: checked } as UIPreferences);
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="border-t pt-6" />

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
            onCheckedChange={(checked) => {
              const newTheme = checked ? "dark" : "light";
              setTheme(newTheme);
              trackActivity("Change Theme", "preferences_update", { theme: newTheme });
            }}
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
      </CardContent>
    </Card>
  );
};
