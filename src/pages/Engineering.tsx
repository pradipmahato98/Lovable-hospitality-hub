import { ErrorBoundary } from "@/components/ErrorBoundary";
import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { 
  Wrench, CalendarClock, Settings, BarChart3
} from "lucide-react";
import { useMaintenanceRequests } from "@/hooks/useMaintenanceRequests";
import { ModuleQuickActions, QuickAction } from "@/components/shared";
import { Bed, DoorOpen, Users, FileText } from "lucide-react";
import { 
  RequestsTab, PreventiveMaintenanceTab, AssetsTab, EngineeringReportsTab 
} from "@/components/engineering";

const Engineering = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "requests";
  const { data: requests = [] } = useMaintenanceRequests();
  const pendingCount = requests.filter(r => r.status === "pending").length;
  const inProgressCount = requests.filter(r => r.status === "in_progress").length;

  const handleTabChange = (value: string) => {
    setSearchParams(prev => {
      prev.set("tab", value);
      return prev;
    });
  };

  const quickActions: QuickAction[] = [
    { icon: Bed, label: "View Rooms", to: "/rooms", color: "text-blue-400" },
    { icon: DoorOpen, label: "Housekeeping", to: "/housekeeping", color: "text-cyan-400" },
    { icon: Users, label: "Assign Staff", to: "/staff", color: "text-purple-400" },
    { icon: FileText, label: "Generate Report", to: "/reports", color: "text-primary" },
  ];

  return (
    <MainLayout fixedHeight title="Engineering" subtitle="Maintenance, preventive schedules, and asset management">
      <div className="flex flex-col h-full overflow-hidden">
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 flex-1 overflow-hidden">
        <div className="xl:col-span-3 flex flex-col overflow-hidden">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col overflow-hidden space-y-6">
            <TabsList>
              <TabsTrigger value="requests" className="gap-2">
                <Wrench className="h-4 w-4" />
                Requests
                {pendingCount > 0 && <Badge variant="secondary" className="ml-1">{pendingCount}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="preventive" className="gap-2">
                <CalendarClock className="h-4 w-4" />
                Preventive Maintenance
              </TabsTrigger>
              <TabsTrigger value="assets" className="gap-2">
                <Settings className="h-4 w-4" />
                Assets
              </TabsTrigger>
              <TabsTrigger value="reports" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Reports
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide">
            <TabsContent value="requests" className="mt-0 focus-visible:outline-none">
              <RequestsTab />
            </TabsContent>

            <TabsContent value="preventive">
              <PreventiveMaintenanceTab />
            </TabsContent>

            <TabsContent value="assets">
              <AssetsTab />
            </TabsContent>

            <TabsContent value="reports" className="mt-0 focus-visible:outline-none">
              <EngineeringReportsTab />
            </TabsContent>
            </div>
          </Tabs>
        </div>
        <div className="space-y-6 p-4 sm:p-6 overflow-y-auto">
          <ModuleQuickActions actions={quickActions} variant="list" />
        </div>
      </div>
      </div>
    </MainLayout>
  );
};

const EngineeringPage = () => (
  <ErrorBoundary>
    <Engineering />
  </ErrorBoundary>
);

export default EngineeringPage;
