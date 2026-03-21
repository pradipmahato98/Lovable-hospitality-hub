import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Settings,
  MapPin,
  UtensilsCrossed,
  Plus,
  Trash2,
  Save,
  Users
} from "lucide-react";
import { useBanquetSettings, useUpdateBanquetSettings } from "@/hooks/useSettings";
import { toast } from "sonner";

export function BanquetSettingsPanel() {
  const { data: settings, isLoading } = useBanquetSettings();
  const updateSettings = useUpdateBanquetSettings();
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  if (isLoading || !localSettings) {
    return <div className="p-8 text-center text-muted-foreground">Loading settings...</div>;
  }

  const handleSave = () => {
    updateSettings.mutate(localSettings, {
      onSuccess: () => toast.success("Banquet settings saved"),
    });
  };

  const addVenue = () => {
    setLocalSettings({
      ...localSettings,
      venues: [...localSettings.venues, { id: Date.now().toString(), name: "New Venue", capacity: 50 }]
    });
  };

  const removeVenue = (id: string) => {
    setLocalSettings({
      ...localSettings,
      venues: localSettings.venues.filter(v => v.id !== id)
    });
  };

  const addPackage = () => {
    setLocalSettings({
      ...localSettings,
      menu_packages: [...localSettings.menu_packages, { id: Date.now().toString(), name: "New Package", price_per_head: 50 }]
    });
  };

  const removePackage = (id: string) => {
    setLocalSettings({
      ...localSettings,
      menu_packages: localSettings.menu_packages.filter(p => p.id !== id)
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Banquet Configuration</h3>
          <p className="text-sm text-muted-foreground">Manage venues and menu packages</p>
        </div>
        <Button onClick={handleSave} className="gap-2">
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Venue Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Venues
              </CardTitle>
              <Button variant="outline" size="sm" onClick={addVenue} className="h-8 gap-1">
                <Plus className="h-3 w-3" /> Add
              </Button>
            </div>
            <CardDescription>Define available event locations and their max capacity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {localSettings.venues.map((venue, idx) => (
              <div key={venue.id} className="flex items-end gap-3 p-3 rounded-lg border bg-muted/30">
                <div className="flex-1 space-y-2">
                  <Label className="text-xs">Venue Name</Label>
                  <Input
                    value={venue.name}
                    onChange={(e) => {
                      const newVenues = [...localSettings.venues];
                      newVenues[idx].name = e.target.value;
                      setLocalSettings({ ...localSettings, venues: newVenues });
                    }}
                  />
                </div>
                <div className="w-32 space-y-2">
                  <Label className="text-xs">Capacity</Label>
                  <div className="relative">
                    <Users className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                    <Input
                      type="number"
                      className="pl-7"
                      value={venue.capacity}
                      onChange={(e) => {
                        const newVenues = [...localSettings.venues];
                        newVenues[idx].capacity = parseInt(e.target.value) || 0;
                        setLocalSettings({ ...localSettings, venues: newVenues });
                      }}
                    />
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => removeVenue(venue.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Menu Package Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <UtensilsCrossed className="h-5 w-5 text-primary" />
                Menu Packages
              </CardTitle>
              <Button variant="outline" size="sm" onClick={addPackage} className="h-8 gap-1">
                <Plus className="h-3 w-3" /> Add
              </Button>
            </div>
            <CardDescription>Configure catering packages and pricing per guest</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {localSettings.menu_packages.map((pkg, idx) => (
              <div key={pkg.id} className="flex items-end gap-3 p-3 rounded-lg border bg-muted/30">
                <div className="flex-1 space-y-2">
                  <Label className="text-xs">Package Name</Label>
                  <Input
                    value={pkg.name}
                    onChange={(e) => {
                      const newPkgs = [...localSettings.menu_packages];
                      newPkgs[idx].name = e.target.value;
                      setLocalSettings({ ...localSettings, menu_packages: newPkgs });
                    }}
                  />
                </div>
                <div className="w-32 space-y-2">
                  <Label className="text-xs">Price/Head</Label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">$</span>
                    <Input
                      type="number"
                      className="pl-5"
                      value={pkg.price_per_head}
                      onChange={(e) => {
                        const newPkgs = [...localSettings.menu_packages];
                        newPkgs[idx].price_per_head = parseFloat(e.target.value) || 0;
                        setLocalSettings({ ...localSettings, menu_packages: newPkgs });
                      }}
                    />
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => removePackage(pkg.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
