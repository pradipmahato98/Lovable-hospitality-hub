import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Shield, Lock, Eye, Pencil, Trash2, FileText, Loader2,
  ChevronDown, Check, Settings2
} from "lucide-react";
import { useSettings, useUpdateSettings } from "@/hooks/useSettings";
import { navItems, operationsNavItems, adminNavItems } from "@/config/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ModulePermission {
  view: boolean;
  write: boolean;
  delete: boolean;
  report: boolean;
  enabled: boolean;
}

export interface UserRolesSettingsData {
  modules: Record<string, ModulePermission>;
  global_enabled: boolean;
}

const allModules = [...navItems, ...operationsNavItems, ...adminNavItems];

const defaultPermissions: UserRolesSettingsData = {
  global_enabled: true,
  modules: allModules.reduce((acc, item) => {
    acc[item.label] = {
      view: true,
      write: true,
      delete: true,
      report: true,
      enabled: true,
    };
    return acc;
  }, {} as Record<string, ModulePermission>),
};

export function UserRolesSettings() {
  const { data: settings, isLoading } = useSettings<UserRolesSettingsData>("user_roles_permissions", defaultPermissions);
  const updateSettings = useUpdateSettings<UserRolesSettingsData>("user_roles_permissions");

  const handleGlobalToggle = (enabled: boolean) => {
    if (!settings) return;
    const newModules = { ...settings.modules };
    Object.keys(newModules).forEach(key => {
      newModules[key] = { ...newModules[key], enabled };
    });
    updateSettings.mutate({ ...settings, global_enabled: enabled, modules: newModules });
  };

  const handleModuleToggle = (moduleLabel: string, enabled: boolean) => {
    if (!settings) return;
    const newModules = { ...settings.modules };
    newModules[moduleLabel] = { ...newModules[moduleLabel], enabled };
    updateSettings.mutate({ ...settings, modules: newModules });
  };

  const handlePermissionToggle = (moduleLabel: string, permission: keyof Omit<ModulePermission, 'enabled'>, value: boolean) => {
    if (!settings) return;
    const newModules = { ...settings.modules };
    newModules[moduleLabel] = { ...newModules[moduleLabel], [permission]: value };
    updateSettings.mutate({ ...settings, modules: newModules });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-display flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" /> User & Roles Permissions
          </h2>
          <p className="text-muted-foreground text-sm">
            Manage module-level access and permissions for users.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-muted/50 px-4 py-2 rounded-lg border border-border/60">
          <Label htmlFor="global-toggle" className="text-sm font-semibold cursor-pointer">Enable All Modules</Label>
          <Switch
            id="global-toggle"
            checked={settings?.global_enabled}
            onCheckedChange={handleGlobalToggle}
          />
        </div>
      </div>

      <Card variant="elevated">
        <CardHeader className="border-b bg-muted/20">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-primary" />
            <div>
              <CardTitle className="text-sm font-bold uppercase tracking-wider">Module Access Matrix</CardTitle>
              <CardDescription className="text-[10px]">Configure View, Write, Delete, and Report permissions per module.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-[300px] text-[11px] font-bold">Module Name</TableHead>
                <TableHead className="text-center text-[11px] font-bold">Global Status</TableHead>
                <TableHead className="text-right text-[11px] font-bold px-6">Detailed Permissions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allModules.map((module) => {
                const perms = settings?.modules[module.label] || { view: true, write: true, delete: true, report: true, enabled: true };
                const activeCount = [perms.view, perms.write, perms.delete, perms.report].filter(Boolean).length;

                return (
                  <TableRow key={module.label} className="hover:bg-muted/10 transition-colors">
                    <TableCell className="font-medium text-xs">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-md bg-primary/5 text-primary">
                          <module.icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-bold">{module.label}</p>
                          <p className="text-[10px] text-muted-foreground font-normal">{module.path}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <Switch
                          checked={perms.enabled}
                          onCheckedChange={(v) => handleModuleToggle(module.label, v)}
                        />
                        <span className={cn(
                          "text-[9px] font-bold uppercase tracking-tight",
                          perms.enabled ? "text-success" : "text-muted-foreground"
                        )}>
                          {perms.enabled ? "Enabled" : "Disabled"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right px-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!perms.enabled}
                            className={cn(
                              "h-8 gap-2 text-xs font-semibold",
                              activeCount > 0 ? "border-primary/30 bg-primary/5 text-primary" : "text-muted-foreground"
                            )}
                          >
                            <Settings2 className="h-3.5 w-3.5" />
                            {activeCount} Permissions
                            <ChevronDown className="h-3 w-3 opacity-50" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Access for {module.label}
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuCheckboxItem
                            checked={perms.view}
                            onCheckedChange={(v) => handlePermissionToggle(module.label, 'view', v)}
                            className="text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                              View Access
                            </div>
                          </DropdownMenuCheckboxItem>
                          <DropdownMenuCheckboxItem
                            checked={perms.write}
                            onCheckedChange={(v) => handlePermissionToggle(module.label, 'write', v)}
                            className="text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                              Write/Edit Access
                            </div>
                          </DropdownMenuCheckboxItem>
                          <DropdownMenuCheckboxItem
                            checked={perms.delete}
                            onCheckedChange={(v) => handlePermissionToggle(module.label, 'delete', v)}
                            className="text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                              Delete Access
                            </div>
                          </DropdownMenuCheckboxItem>
                          <DropdownMenuCheckboxItem
                            checked={perms.report}
                            onCheckedChange={(v) => handlePermissionToggle(module.label, 'report', v)}
                            className="text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                              Report Access
                            </div>
                          </DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
