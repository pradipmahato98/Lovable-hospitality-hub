import { MainLayout } from "@/components/layout/MainLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { RecentBookings } from "@/components/dashboard/RecentBookings";
import { RoomStatusGrid } from "@/components/dashboard/RoomStatusGrid";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { BedDouble, Users, TrendingUp, CalendarCheck } from "lucide-react";

const Index = () => {
  return (
    <MainLayout title="Dashboard" subtitle="Welcome back, John. Here's your property overview.">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Occupancy Rate"
          value="87%"
          change="+4.5% from last week"
          changeType="positive"
          icon={BedDouble}
          delay={0}
        />
        <MetricCard
          title="Total Guests"
          value="156"
          change="+12 new arrivals today"
          changeType="positive"
          icon={Users}
          delay={50}
        />
        <MetricCard
          title="Today's Revenue"
          value="$24,580"
          change="+18.2% vs yesterday"
          changeType="positive"
          icon={TrendingUp}
          delay={100}
        />
        <MetricCard
          title="Pending Bookings"
          value="23"
          change="5 require attention"
          changeType="neutral"
          icon={CalendarCheck}
          delay={150}
        />
      </div>

      {/* Charts & Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <RevenueChart />
        <QuickActions />
      </div>

      {/* Bookings & Room Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentBookings />
        <RoomStatusGrid />
      </div>
    </MainLayout>
  );
};

export default Index;
