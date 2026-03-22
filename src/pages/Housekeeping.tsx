import { ErrorBoundary } from "@/components/ErrorBoundary";
import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { 
  Bed, ClipboardList, Package, ClipboardCheck, ShoppingBag, BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIPreferences } from "@/hooks/useSettings";
import { useHousekeepingStats, useLostAndFound } from "@/hooks/useHousekeeping";
import { 
  RoomsTab, TasksTab, InspectionsTab, LostFoundTab, SuppliesTab, HousekeepingReportsTab
} from "@/components/housekeeping";

const Housekeeping = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: uiPrefs } = useUIPreferences();
  const isHorizontalNav = uiPrefs?.navigation_style === "horizontal-subheader";
  const activeTab = searchParams.get("tab") || "rooms";
  const today = new Date().toISOString().split("T")[0];
  const stats = useHousekeepingStats(today);
  const { data: lostItems = [] } = useLostAndFound("stored");
  const storedCount = lostItems.length;

  const handleTabChange = (value: string) => {
    setSearchParams(prev => {
      prev.set("tab", value);
      return prev;
    });
  };

  return (
    <MainLayout title="Housekeeping" subtitle="Room cleaning, tasks, inspections, and lost & found management">
      <div className="flex flex-col space-y-6">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <div
          className={cn(
            "sticky z-10 transition-all duration-300",
            isHorizontalNav ? "top-[112px]" : "top-14"
          )}
        >
        <TabsList className="bg-background/80 backdrop-blur-md border shadow-sm">
          <TabsTrigger value="rooms" className="gap-2">
            <Bed className="h-4 w-4" />
            Rooms
          </TabsTrigger>
          <TabsTrigger value="tasks" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            Tasks
            {stats.pending > 0 && <Badge variant="secondary" className="ml-1">{stats.pending}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="inspections" className="gap-2">
            <ClipboardCheck className="h-4 w-4" />
            Inspections
          </TabsTrigger>
          <TabsTrigger value="lost-found" className="gap-2">
            <Package className="h-4 w-4" />
            Lost & Found
            {storedCount > 0 && <Badge variant="secondary" className="ml-1">{storedCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="supplies" className="gap-2">
            <ShoppingBag className="h-4 w-4" />
            Supplies
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Reports
          </TabsTrigger>
        </TabsList>
        </div>

        <div className="mt-0">
        <TabsContent value="rooms" className="mt-0 focus-visible:outline-none">
          <RoomsTab />
        </TabsContent>

        <TabsContent value="tasks">
          <TasksTab />
        </TabsContent>

        <TabsContent value="inspections">
          <InspectionsTab />
        </TabsContent>

        <TabsContent value="lost-found">
          <LostFoundTab />
        </TabsContent>

        <TabsContent value="supplies">
          <SuppliesTab />
        </TabsContent>

        <TabsContent value="reports" className="mt-0 focus-visible:outline-none">
          <HousekeepingReportsTab />
        </TabsContent>
        </div>
      </Tabs>
      </div>
    </MainLayout>
  );
};

const HousekeepingPage = () => (
  <ErrorBoundary>
    <Housekeeping />
  </ErrorBoundary>
);

export default HousekeepingPage;
