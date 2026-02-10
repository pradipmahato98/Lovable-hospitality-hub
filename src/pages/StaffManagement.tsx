import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  UserCircle,
  Settings,
  Bell,
  ShieldCheck,
  FileText,
  Loader2,
  Info
} from "lucide-react";
import { useIsAdmin, useIsManager } from "@/hooks/useUserRole";
import { useSearchParams } from "react-router-dom";
import { StaffDirectoryTab } from "@/components/staff/StaffDirectoryTab";
import { PersonalDetailsTab } from "@/components/staff/PersonalDetailsTab";
import { PreferencesTab } from "@/components/staff/PreferencesTab";
import { AlertsTab } from "@/components/staff/AlertsTab";
import { SecurityTab } from "@/components/staff/SecurityTab";
import { LogsReportTab } from "@/components/staff/LogsReportTab";

const StaffManagement = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "directory";
  const activeSubTab = searchParams.get("sub") || "details";

  const { isAdmin, isLoading: loadingAdmin } = useIsAdmin();
  const { isManager, isLoading: loadingManager } = useIsManager();

  const handleMainTabChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("tab", value);
    if (value !== "about") {
      newParams.delete("sub");
    } else if (!newParams.has("sub")) {
      newParams.set("sub", "details");
    }
    setSearchParams(newParams);
  };

  const handleSubTabChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("tab", "about");
    newParams.set("sub", value);
    setSearchParams(newParams);
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

  // Determine which main tab should be active
  let finalMainTab = activeTab;
  if (!canSeeRestricted && (activeTab === "directory" || activeTab === "logs")) {
    finalMainTab = "about";
  }

  return (
    <MainLayout title="Staff Management" subtitle="Manage employees and your professional profile">
      <Tabs value={finalMainTab} onValueChange={handleMainTabChange} className="space-y-6">
        <div className="flex overflow-x-auto pb-2 -mx-1 px-1">
          <TabsList className="h-auto p-1 bg-muted/50 border min-w-max">
            {canSeeRestricted && (
              <TabsTrigger value="directory" className="flex items-center gap-2 py-2 px-4">
                <Users className="h-4 w-4" />
                Staff Directory
              </TabsTrigger>
            )}
            <TabsTrigger value="about" className="flex items-center gap-2 py-2 px-4">
              <UserCircle className="h-4 w-4" />
              User About
            </TabsTrigger>
            {canSeeRestricted && (
              <TabsTrigger value="logs" className="flex items-center gap-2 py-2 px-4">
                <FileText className="h-4 w-4" />
                Logs Report
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        <TabsContent value="directory" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          <StaffDirectoryTab />
        </TabsContent>

        <TabsContent value="about" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          <Tabs value={activeSubTab} onValueChange={handleSubTabChange} className="space-y-6">
            <div className="bg-muted/30 p-1 rounded-lg border w-fit">
              <TabsList className="bg-transparent h-auto">
                <TabsTrigger value="details" className="gap-2 py-1.5 px-3">
                  <Info className="h-4 w-4" />
                  Details
                </TabsTrigger>
                <TabsTrigger value="preferences" className="gap-2 py-1.5 px-3">
                  <Settings className="h-4 w-4" />
                  Preferences
                </TabsTrigger>
                <TabsTrigger value="alerts" className="gap-2 py-1.5 px-3">
                  <Bell className="h-4 w-4" />
                  Alert
                </TabsTrigger>
                <TabsTrigger value="security" className="gap-2 py-1.5 px-3">
                  <ShieldCheck className="h-4 w-4" />
                  Security
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="details" className="mt-0">
              <PersonalDetailsTab />
            </TabsContent>
            <TabsContent value="preferences" className="mt-0">
              <PreferencesTab />
            </TabsContent>
            <TabsContent value="alerts" className="mt-0">
              <AlertsTab />
            </TabsContent>
            <TabsContent value="security" className="mt-0">
              <SecurityTab />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="logs" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          <LogsReportTab />
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
};

export default StaffManagement;
