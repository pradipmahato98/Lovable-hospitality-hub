import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Layout, MessageSquare, List, ShieldCheck, Zap, Info } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useUIPreferences, useUpdateUIPreferences } from "@/hooks/useSettings";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { toast } from "sonner";

export const UIStandardizationCard = () => {
  const { data: uiPrefs } = useUIPreferences();
  const updateUI = useUpdateUIPreferences();

  const togglePersistence = (enabled: boolean) => {
    if (uiPrefs) {
      updateUI.mutate({ ...uiPrefs, persistent_popups: enabled });
    }
  };

  return (
    <Card variant="elevated">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>UI Standardization & Persistence</CardTitle>
            <CardDescription>
              Verify and test the system-wide persistent popup behavior.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-lg border">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <Label htmlFor="persistence-toggle" className="text-xs font-bold uppercase tracking-wider">
              Global Persistence
            </Label>
            <Switch
              id="persistence-toggle"
              checked={uiPrefs?.persistent_popups ?? true}
              onCheckedChange={togglePersistence}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
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
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive font-medium">Delete Selection</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="pt-6 border-t">
          <div className="flex items-center gap-2 font-bold text-sm mb-4">
            <Zap className="h-4 w-4 text-amber-500" />
            <span>Additional Global Standardizations</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Info className="h-4 w-4 text-blue-500" />
                <span>Standardized Tooltips</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Tooltips now use a high-contrast Digital Blue theme with improved elevation and refined typography.
              </p>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      Hover for Tooltip
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Standardized Digital Blue Tooltip</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <MessageSquare className="h-4 w-4 text-success" />
                <span>Standardized Toasts</span>
              </div>
              <p className="text-xs text-muted-foreground">
                System notifications (toasts) are unified with semantic colors and matching iconography.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => toast.success("Operation completed successfully")}>
                  Success Toast
                </Button>
                <Button variant="outline" size="sm" onClick={() => toast.error("An error occurred during process")}>
                  Error Toast
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
