import { MainLayout } from "@/components/layout/MainLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { RecentBookings } from "@/components/dashboard/RecentBookings";
import { RoomStatusGrid } from "@/components/dashboard/RoomStatusGrid";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { OccupancyBarChart } from "@/components/dashboard/OccupancyBarChart";
import { GuestTrendLineChart } from "@/components/dashboard/GuestTrendLineChart";
import { BedDouble, Users, TrendingUp, CalendarCheck, ShieldAlert, Loader2 } from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useIsAdmin } from "@/hooks/useUserRole";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { todayBS, formatBSDate } from "@/lib/nepaliDate";
import { formatAD } from "@/lib/utils";

const Index = () => {
  const { data: stats, isLoading } = useDashboardStats();
  const { isAdmin } = useIsAdmin();

  if (isLoading) {
    return (
      <MainLayout title="Dashboard" subtitle="Syncing property data...">
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  const bsToday = formatBSDate(todayBS(), "long");

  return (
    <MainLayout title="Dashboard" subtitle={`${format(new Date(), "MMM dd, yyyy")} • ${bsToday} BS`}>
      {/* Security Alert */}
      {isAdmin && stats?.securityAlerts !== undefined && stats.securityAlerts > 0 && (
        <Card className="mb-6 border-destructive/50 bg-destructive/5 animate-pulse">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-destructive flex items-center gap-2">
              <ShieldAlert className="h-4 w-4" />
              SECURITY ADVISORY
            </CardTitle>
            <Badge variant="destructive">Action Required</Badge>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              Detected <strong>{stats.securityAlerts}</strong> security-related events in the last 24 hours.
              Please review the audit logs in the Admin Console.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-6">
        <MetricCard
          title="Occupancy Rate"
          value={stats?.occupancyRate || "0%"}
          change="+2.1% from yesterday"
          changeType="positive"
          icon={BedDouble}
          delay={0}
          link="/front-desk"
        />
        <MetricCard
          title="Total Guests"
          value={stats?.totalGuests || 0}
          change="Registered profiles"
          changeType="neutral"
          icon={Users}
          delay={50}
          link="/guests"
        />
        <MetricCard
          title="Today's Revenue"
          value={stats?.todayRevenue || "$0"}
          change="New revenue streams"
          changeType="positive"
          icon={TrendingUp}
          delay={100}
          link="/finance"
        />
        <MetricCard
          title="Pending Bookings"
          value={stats?.pendingBookings || 0}
          change="Require confirmation"
          changeType="neutral"
          icon={CalendarCheck}
          delay={150}
          link="/reservations"
        />
      </div>

      {/* Revenue Chart (full width) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-5 mb-6">
        <RevenueChart />
        <QuickActions />
      </div>

      {/* Bar + Line Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 mb-6">
        <OccupancyBarChart />
        <GuestTrendLineChart />
      </div>

      {/* Bookings & Room Status */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-5">
        <RecentBookings />
        <RoomStatusGrid />
      </div>
    </MainLayout>
  );
};

export default Index;
