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
import { StaffDirectoryTab } from "@/components/staff/StaffDirectoryTab";
import { PersonalDetailsTab } from "@/components/staff/PersonalDetailsTab";
import { PreferencesTab } from "@/components/staff/PreferencesTab";
import { AlertsTab } from "@/components/staff/AlertsTab";
import { SecurityTab } from "@/components/staff/SecurityTab";
import { LogsReportTab } from "@/components/staff/LogsReportTab";

const StaffManagement = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "directory";

  const { isAdmin, isLoading: loadingAdmin } = useIsAdmin();
  const { isManager, isLoading: loadingManager } = useIsManager();

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
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

  // Define tabs configuration
  const allTabs = [
    { id: "directory", label: "Staff Directory", icon: Users, component: StaffDirectoryTab, restricted: true },
    { id: "details", label: "Details", icon: UserCircle, component: PersonalDetailsTab, restricted: false },
    { id: "preferences", label: "Preferences", icon: Settings, component: PreferencesTab, restricted: false },
    { id: "alerts", label: "Alert", icon: Bell, component: AlertsTab, restricted: false },
    { id: "security", label: "Security", icon: ShieldCheck, component: SecurityTab, restricted: false },
    { id: "logs", label: "Logs Report", icon: FileText, component: LogsReportTab, restricted: true },
  ];

  // Filter tabs based on user role
  const visibleTabs = allTabs.filter(tab => !tab.restricted || (isAdmin || isManager));

  // If current active tab is restricted and user is not admin/manager, fallback to first visible tab
  const finalActiveTab = visibleTabs.find(t => t.id === activeTab) ? activeTab : visibleTabs[0].id;

  return (
    <MainLayout title="Staff Management" subtitle="Manage employees and your professional profile">
      <Tabs value={finalActiveTab} onValueChange={handleTabChange} className="space-y-6">
        <div className="flex overflow-x-auto pb-2 -mx-1 px-1">
          <TabsList className="h-auto p-1 bg-muted/50 border min-w-max">
            {visibleTabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex items-center gap-2 py-2 px-4 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {visibleTabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="mt-0 focus-visible:outline-none focus-visible:ring-0">
            <tab.component />
          </TabsContent>
        ))}
      </Tabs>
    </MainLayout>
  );
};

export default StaffManagement;
