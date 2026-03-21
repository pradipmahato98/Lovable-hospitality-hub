import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useUIPreferences, useUpdateUIPreferences, UIPreferences } from "@/hooks/useSettings";
import { Loader2, Layout, PanelLeftClose, PanelTop, Monitor } from "lucide-react";

export function UIStandardizationCard() {
  const { data: uiPrefs, isLoading } = useUIPreferences();
  const updateUI = useUpdateUIPreferences();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>UI Standardization</CardTitle>
          <CardDescription>Loading preferences...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const handleStyleChange = (value: string) => {
    if (uiPrefs) {
      updateUI.mutate({
        ...uiPrefs,
        navigation_style: value as UIPreferences["navigation_style"]
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>UI Standardization</CardTitle>
        <CardDescription>
          Customize the navigation system to match your workflow preferences.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Label className="text-base">Navigation Style</Label>
          <RadioGroup
            value={uiPrefs?.navigation_style || "default"}
            onValueChange={handleStyleChange}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div>
              <RadioGroupItem
                value="default"
                id="style-default"
                className="peer sr-only"
              />
              <Label
                htmlFor="style-default"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <Layout className="mb-3 h-6 w-6" />
                <span className="text-sm font-semibold">Default Sidebar</span>
                <span className="text-xs text-muted-foreground text-center mt-1">
                  Standard expandable sidebar (256px)
                </span>
              </Label>
            </div>

            <div>
              <RadioGroupItem
                value="vertical-icon"
                id="style-vertical-icon"
                className="peer sr-only"
              />
              <Label
                htmlFor="style-vertical-icon"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <Monitor className="mb-3 h-6 w-6" />
                <span className="text-sm font-semibold">Vertical Icon-Only</span>
                <span className="text-xs text-muted-foreground text-center mt-1">
                  Compact 70px sidebar showing only icons
                </span>
              </Label>
            </div>

            <div>
              <RadioGroupItem
                value="hidden-hover"
                id="style-hidden-hover"
                className="peer sr-only"
              />
              <Label
                htmlFor="style-hidden-hover"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <PanelLeftClose className="mb-3 h-6 w-6" />
                <span className="text-sm font-semibold">Hidden Hover-Trigger</span>
                <span className="text-xs text-muted-foreground text-center mt-1">
                  Sidebar slides out when hovering left edge
                </span>
              </Label>
            </div>

            <div>
              <RadioGroupItem
                value="horizontal-subheader"
                id="style-horizontal-subheader"
                className="peer sr-only"
              />
              <Label
                htmlFor="style-horizontal-subheader"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <PanelTop className="mb-3 h-6 w-6" />
                <span className="text-sm font-semibold">Horizontal Sub-Header</span>
                <span className="text-xs text-muted-foreground text-center mt-1">
                  Navigation bar below the main header
                </span>
              </Label>
            </div>
          </RadioGroup>
        </div>
      </CardContent>
    </Card>
  );
}
