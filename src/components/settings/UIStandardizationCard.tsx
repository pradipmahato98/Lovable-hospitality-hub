import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Layout, MessageSquare, List, ShieldCheck } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useUIPreferences, useUpdateUIPreferences } from "@/hooks/useSettings";

export const UIStandardizationCard = () => {
  const { data: prefs } = useUIPreferences();
  const updatePrefs = useUpdateUIPreferences();

  return (
    <Card variant="elevated">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle>UI Standardization & Persistence</CardTitle>
            <CardDescription>
              Verify and test the system-wide persistent popup behavior.
            </CardDescription>
          </div>
          <div className="flex items-center gap-3 bg-muted/30 p-3 rounded-xl border border-border/50">
            <div className="flex flex-col items-end mr-2">
              <Label htmlFor="persistent-popups" className="text-sm font-bold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Persistent Mode
              </Label>
              <span className="text-[10px] text-muted-foreground font-medium">Global Toggle</span>
            </div>
            <Switch
              id="persistent-popups"
              checked={prefs?.persistent_popups ?? true}
              onCheckedChange={(checked) => updatePrefs.mutate({ ...(prefs || {} as any), persistent_popups: checked })}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 font-medium">
              <Layout className="h-4 w-4 text-primary" />
              <span>Dialog Persistence</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Dialogs are set to persistent by default. They ignore outside clicks and Escape key presses, triggering a shake animation instead.
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full">Test Persistent Dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Persistent Dialog</DialogTitle>
                </DialogHeader>
                <div className="p-4 space-y-4">
                  <p className="text-sm">
                    This dialog should NOT close when clicking outside or pressing Escape.
                  </p>
                  <p className="text-sm font-bold text-primary animate-pulse">
                    It should shake instead!
                  </p>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 font-medium">
              <MessageSquare className="h-4 w-4 text-primary" />
              <span>Popover Persistence</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Popovers used for settings and info panels are now standardized to prevent accidental closure during interaction.
            </p>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full">Test Persistent Popover</Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Persistent Information</p>
                  <p className="text-xs text-muted-foreground">
                    This popover will stay open even if you click outside or press Escape.
                  </p>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 font-medium">
              <List className="h-4 w-4 text-primary" />
              <span>Dropdown Persistence</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Dropdown menus for critical actions require explicit selection or a manual close via the "X" button (where applicable).
            </p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" className="w-full">Test Persistent Dropdown</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuItem>Selectable Item 1</DropdownMenuItem>
                <DropdownMenuItem>Selectable Item 2</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive font-medium">Delete Selection</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
