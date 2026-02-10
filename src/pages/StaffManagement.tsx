import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  UserCircle,
  Settings,
  Bell,
  ShieldCheck,
  FileText,
  Loader2
} from "lucide-react";
import { useIsAdmin, useIsManager } from "@/hooks/useUserRole";
import { useSearchParams } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { StaffDirectoryTab } from "@/components/staff/StaffDirectoryTab";
import { PersonalDetailsTab } from "@/components/staff/PersonalDetailsTab";
import { PreferencesTab } from "@/components/staff/PreferencesTab";
import { AlertsTab } from "@/components/staff/AlertsTab";
import { SecurityTab } from "@/components/staff/SecurityTab";
import { LogsReportTab } from "@/components/staff/LogsReportTab";

const StaffManagement = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAdmin, isLoading: loadingAdmin } = useIsAdmin();
  const { isManager, isLoading: loadingManager } = useIsManager();

  const activeTab = searchParams.get("tab") || (isAdmin || isManager ? "directory" : "about");
  const activeSubTab = searchParams.get("sub") || "details";

  const tabsValue = activeTab === "about" ? activeSubTab : activeTab;

  const handleTabChange = (value: string) => {
    if (["details", "preferences", "alert", "security"].includes(value)) {
      setSearchParams({ tab: "about", sub: value });
    } else {
      setSearchParams({ tab: value });
    }
  };

  if (loadingAdmin || loadingManager) {
    return (
      <MainLayout title="Staff Management" subtitle="Loading...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  const canSeeRestricted = isAdmin || isManager;

  return (
    <MainLayout title="Staff Management" subtitle="Manage employees and your professional profile">
      <Tabs value={tabsValue} onValueChange={handleTabChange} className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-card/50 p-4 rounded-xl border border-border/50">
          {canSeeRestricted && (
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold ml-1">Administration</Label>
              <TabsList className="bg-background/50 h-9">
                <TabsTrigger value="directory" className="gap-2 text-xs">
                  <Users className="h-3.5 w-3.5" />
                  Staff Directory
                </TabsTrigger>
                <TabsTrigger value="logs" className="gap-2 text-xs">
                  <FileText className="h-3.5 w-3.5" />
                  Logs Report
                </TabsTrigger>
              </TabsList>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold ml-1">User About (Profile Settings)</Label>
            <TabsList className="bg-background/50 h-9">
              <TabsTrigger value="details" className="gap-2 text-xs">
                <UserCircle className="h-3.5 w-3.5" />
                Details
              </TabsTrigger>
              <TabsTrigger value="preferences" className="gap-2 text-xs">
                <Settings className="h-3.5 w-3.5" />
                Preferences
              </TabsTrigger>
              <TabsTrigger value="alert" className="gap-2 text-xs">
                <Bell className="h-3.5 w-3.5" />
                Alert
              </TabsTrigger>
              <TabsTrigger value="security" className="gap-2 text-xs">
                <ShieldCheck className="h-3.5 w-3.5" />
                Security
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <div className="mt-6">
          <TabsContent value="directory" className="mt-0">
            {canSeeRestricted && <StaffDirectoryTab />}
          </TabsContent>
          <TabsContent value="logs" className="mt-0">
            {canSeeRestricted && <LogsReportTab />}
          </TabsContent>
          <TabsContent value="details" className="mt-0">
            <PersonalDetailsTab />
          </TabsContent>
          <TabsContent value="preferences" className="mt-0">
            <PreferencesTab />
          </TabsContent>
          <TabsContent value="alert" className="mt-0">
            <AlertsTab />
          </TabsContent>
          <TabsContent value="security" className="mt-0">
            <SecurityTab />
          </TabsContent>
        </div>
      </Tabs>
    </MainLayout>
  );
};

export default StaffManagement;
