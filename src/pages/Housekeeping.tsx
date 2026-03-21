import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { 
  Bed, ClipboardList, Package, ClipboardCheck, ShoppingBag, BarChart3
} from "lucide-react";
import { useHousekeepingStats, useLostAndFound } from "@/hooks/useHousekeeping";
import { 
  RoomsTab, TasksTab, InspectionsTab, LostFoundTab, SuppliesTab, HousekeepingReportsTab, AttendantMode
} from "@/components/housekeeping";
import { Button } from "@/components/ui/button";
import { Smartphone } from "lucide-react";

const Housekeeping = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "rooms";
  const [isMobileMode, setIsMobileMode] = useState(false);
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

  if (isMobileMode) {
    return <AttendantMode />;
  }

  return (
    <MainLayout
      title="Housekeeping"
      subtitle="Room cleaning, tasks, inspections, and lost & found management"
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMobileMode(true)}
          className="gap-2"
        >
          <Smartphone className="h-4 w-4" />
          Attendant Mode
        </Button>
      }
    >
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="w-full gap-1">
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

        <TabsContent value="rooms">
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

        <TabsContent value="reports">
          <HousekeepingReportsTab />
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
};

const HousekeepingPage = () => (
  <ErrorBoundary>
    <Housekeeping />
  </ErrorBoundary>
);

export default HousekeepingPage;
