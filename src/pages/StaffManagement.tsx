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
import { useSearchParams, useNavigate } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { StaffDirectoryTab } from "@/components/staff/StaffDirectoryTab";
import { PersonalDetailsTab } from "@/components/staff/PersonalDetailsTab";
import { PreferencesTab } from "@/components/staff/PreferencesTab";
import { AlertsTab } from "@/components/staff/AlertsTab";
import { SecurityTab } from "@/components/staff/SecurityTab";
import { LogsReportTab } from "@/components/staff/LogsReportTab";

const StaffManagement = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAdmin, isLoading: loadingAdmin } = useIsAdmin();
  const { isManager, isLoading: loadingManager } = useIsManager();

  const activeTab = searchParams.get("tab") || (isAdmin || isManager ? "directory" : "details");

  // Handle legacy sub-tab parameters if present
  const tabsValue = activeTab === "about" ? (searchParams.get("sub") || "details") : activeTab;

  const handleTabChange = (value: string) => {
    navigate(`/staff?tab=${value}`, { replace: true });
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
      <Tabs value={tabsValue} onValueChange={handleTabChange} className="w-full">
        <div className="flex flex-col md:flex-row gap-6 md:gap-10">
          <aside className="w-full md:w-64 flex-shrink-0">
            <TabsList className="flex md:flex-col h-auto w-full bg-card/50 border border-border/50 p-2 gap-1 overflow-x-auto md:overflow-visible justify-start md:items-stretch rounded-xl scrollbar-hide">
              {canSeeRestricted && (
                <TabsTrigger value="directory" className="justify-start gap-3 px-4 py-3 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg">
                  <Users className="h-4 w-4" />
                  <span className="whitespace-nowrap">Staff Directory</span>
                </TabsTrigger>
              )}

              <TabsTrigger value="details" className="justify-start gap-3 px-4 py-3 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg">
                <UserCircle className="h-4 w-4" />
                <span className="whitespace-nowrap">User Details</span>
              </TabsTrigger>

              <TabsTrigger value="preferences" className="justify-start gap-3 px-4 py-3 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg">
                <Settings className="h-4 w-4" />
                <span className="whitespace-nowrap">Preferences</span>
              </TabsTrigger>

              <TabsTrigger value="alerts" className="justify-start gap-3 px-4 py-3 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg">
                <Bell className="h-4 w-4" />
                <span className="whitespace-nowrap">Alerts</span>
              </TabsTrigger>

              <TabsTrigger value="security" className="justify-start gap-3 px-4 py-3 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg">
                <ShieldCheck className="h-4 w-4" />
                <span className="whitespace-nowrap">Security</span>
              </TabsTrigger>

              {canSeeRestricted && (
                <TabsTrigger value="logs" className="justify-start gap-3 px-4 py-3 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg">
                  <FileText className="h-4 w-4" />
                  <span className="whitespace-nowrap">Logs Report</span>
                </TabsTrigger>
              )}
            </TabsList>
          </aside>

          <main className="flex-1 min-w-0">
            <TabsContent value="directory" className="mt-0">
              {canSeeRestricted && <StaffDirectoryTab />}
            </TabsContent>
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
            <TabsContent value="logs" className="mt-0">
              {canSeeRestricted && <LogsReportTab />}
            </TabsContent>
          </main>
        </div>
      </Tabs>
    </MainLayout>
  );
};

export default StaffManagement;
