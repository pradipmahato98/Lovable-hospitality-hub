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
import { useSearchParams, useNavigate } from "react-router-dom";
import { StaffDirectoryTab } from "@/components/staff/StaffDirectoryTab";
import { PersonalDetailsTab } from "@/components/staff/PersonalDetailsTab";
import { PreferencesTab } from "@/components/staff/PreferencesTab";
import { AlertsTab } from "@/components/staff/AlertsTab";
import { SecurityTab } from "@/components/staff/SecurityTab";
import { LogsReportTab } from "@/components/staff/LogsReportTab";
import { SchedulesTab } from "@/components/staff/SchedulesTab";
import { AttendanceTab } from "@/components/staff/AttendanceTab";
import { cn } from "@/lib/utils";
import { CalendarDays, Clock as ClockIcon } from "lucide-react";

const StaffManagement = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAdmin, isLoading: loadingAdmin } = useIsAdmin();
  const { isManager, isLoading: loadingManager } = useIsManager();

  const activeTab = searchParams.get("tab") || (isAdmin || isManager ? "directory" : "about");
  const subTab = searchParams.get("sub") || "details";

  const handleTabChange = (value: string) => {
    if (value === "about") {
      navigate(`/staff?tab=about&sub=${subTab}`, { replace: true });
    } else {
      navigate(`/staff?tab=${value}`, { replace: true });
    }
  };

  const handleSubTabChange = (value: string) => {
    navigate(`/staff?tab=about&sub=${value}`, { replace: true });
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
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <div className="flex flex-col md:flex-row gap-6 md:gap-10">
          <aside className="w-full md:w-64 flex-shrink-0">
            <TabsList className="flex md:flex-col h-auto w-full bg-card/50 border border-border/50 p-2 gap-1 overflow-x-auto md:overflow-visible justify-start md:items-stretch rounded-xl scrollbar-hide">
              {canSeeRestricted && (
                <TabsTrigger value="directory" className="justify-start gap-3 px-4 py-3 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg">
                  <Users className="h-4 w-4" />
                  <span className="whitespace-nowrap">Staff Directory</span>
                </TabsTrigger>
              )}

              <TabsTrigger value="about" className="justify-start gap-3 px-4 py-3 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg">
                <Info className="h-4 w-4" />
                <span className="whitespace-nowrap">About Staff</span>
              </TabsTrigger>

              <TabsTrigger value="schedules" className="justify-start gap-3 px-4 py-3 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg">
                <CalendarDays className="h-4 w-4" />
                <span className="whitespace-nowrap">Schedules</span>
              </TabsTrigger>

              <TabsTrigger value="attendance" className="justify-start gap-3 px-4 py-3 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg">
                <ClockIcon className="h-4 w-4" />
                <span className="whitespace-nowrap">Attendance</span>
              </TabsTrigger>

              <TabsTrigger value="logs" className="justify-start gap-3 px-4 py-3 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg">
                <FileText className="h-4 w-4" />
                <span className="whitespace-nowrap">Logs Report</span>
              </TabsTrigger>
            </TabsList>
          </aside>

          <main className="flex-1 min-w-0">
            <TabsContent value="directory" className="mt-0">
              {canSeeRestricted && <StaffDirectoryTab />}
            </TabsContent>

            <TabsContent value="about" className="mt-0">
              <Tabs value={subTab} onValueChange={handleSubTabChange} className="w-full">
                <div className="mb-6 overflow-x-auto pb-1">
                  <TabsList className="bg-muted/50 p-1 h-auto inline-flex">
                    <TabsTrigger value="details" className="gap-2 px-4 py-2">
                      <UserCircle className="h-4 w-4" />
                      Details
                    </TabsTrigger>
                    <TabsTrigger value="preferences" className="gap-2 px-4 py-2">
                      <Settings className="h-4 w-4" />
                      Preferences
                    </TabsTrigger>
                    <TabsTrigger value="alerts" className="gap-2 px-4 py-2">
                      <Bell className="h-4 w-4" />
                      Alerts
                    </TabsTrigger>
                    <TabsTrigger value="security" className="gap-2 px-4 py-2">
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

            <TabsContent value="logs" className="mt-0">
              <LogsReportTab />
            </TabsContent>
          </main>
        </div>
      </Tabs>
    </MainLayout>
  );
};

export default StaffManagement;
