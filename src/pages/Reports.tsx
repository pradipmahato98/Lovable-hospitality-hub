import { useState, useMemo } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Download, TrendingUp, Users, BedDouble, DollarSign, Filter,
  ArrowUpRight, ArrowDownRight, Loader2
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, Legend, CartesianGrid
} from "recharts";
import { toast } from "sonner";
import { useReportStats } from "@/hooks/useReportStats";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearchParams } from "react-router-dom";
import { formatCurrency } from "@/lib/utils";
import { DailyManagementReport } from "@/components/reports/DailyManagementReport";
import { useManagement } from "@/hooks/useManagement";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { exportToPDF } from "@/lib/reportExport";
import { format, parseISO } from "date-fns";

const Reports = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeReportTab = searchParams.get("tab") || "overview";
  const { data: stats, isLoading } = useReportStats();
  const { data: managementData, isLoading: isManagementLoading } = useManagement();

  const handleTabChange = (value: string) => {
    setSearchParams(prev => {
      prev.set("tab", value);
      return prev;
    });
  };

  const reportTypes = [
    { icon: TrendingUp, title: "Revenue Report", description: "Detailed financial analysis", value: stats ? formatCurrency(stats.totalReservationRevenue) : "—" },
    { icon: BedDouble, title: "Occupancy Report", description: "Room utilization metrics", value: stats ? `${stats.occupancyRate}%` : "—" },
    { icon: Users, title: "Reservations", description: "Total bookings tracked", value: stats ? String(stats.reservationCount) : "—" },
    { icon: DollarSign, title: "POS Revenue", description: "Restaurant & service sales", value: stats ? formatCurrency(stats.totalPOSRevenue) : "—" },
  ];

  const monthlyData = stats?.monthlyData || [];
  const revenueBySource = stats?.revenueBySource || [];

  return (
    <MainLayout title="Reports" subtitle="Analytics and business intelligence">
      <Tabs value={activeReportTab} onValueChange={handleTabChange} className="space-y-8">
        <div className="flex justify-between items-center">
          <TabsList className="bg-secondary/50 p-1 flex-wrap h-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="dmr">DMR Executive</TabsTrigger>
            <TabsTrigger value="daily">Daily Stats</TabsTrigger>
            <TabsTrigger value="monthly">Monthly Summary</TabsTrigger>
            <TabsTrigger value="financial">Financial Summary</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button variant="outline" size="sm"><Filter className="h-4 w-4 mr-2" /> Filter Range</Button>
            <Button size="sm"><Download className="h-4 w-4 mr-2" /> Export All</Button>
          </div>
        </div>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {reportTypes.map((report) => (
              <Card key={report.title} variant="elevated">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <report.icon className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{report.title}</h3>
                  <p className="text-2xl font-bold text-primary">
                    {isLoading ? <Skeleton className="h-8 w-20" /> : report.value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{report.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Reservations & Revenue by Month</CardTitle>
                <CardDescription>Booking volume and revenue trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  {isLoading ? <Skeleton className="h-full w-full" /> : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                        <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                        <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Legend />
                        <Line yAxisId="left" type="monotone" dataKey="reservations" stroke="hsl(142, 71%, 45%)" name="Reservations" strokeWidth={3} />
                        <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="hsl(38, 92%, 55%)" name="Revenue ($)" strokeWidth={3} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Distribution</CardTitle>
                <CardDescription>Contribution by source</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center">
                <div className="h-[350px] w-full">
                  {isLoading ? <Skeleton className="h-full w-full" /> : revenueBySource.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">No revenue data yet</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={revenueBySource} innerRadius={80} outerRadius={120} paddingAngle={5} dataKey="amount">
                          {revenueBySource.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                        <Legend verticalAlign="bottom" />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* DMR Executive Report */}
        <TabsContent value="dmr" className="space-y-6">
          <DailyManagementReport data={managementData} isLoading={isManagementLoading} />
        </TabsContent>

        {/* Daily Report */}
        <TabsContent value="daily" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">ADR</CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-3xl font-bold font-display">
                  {isLoading ? <Skeleton className="h-9 w-24" /> : formatCurrency(stats?.adr || 0)}
                </span>
              </CardContent>
            </Card>
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Occupancy</CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-3xl font-bold font-display">
                  {isLoading ? <Skeleton className="h-9 w-24" /> : `${stats?.occupancyRate || 0}%`}
                </span>
              </CardContent>
            </Card>
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Total POS Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-3xl font-bold font-display">
                  {isLoading ? <Skeleton className="h-9 w-24" /> : formatCurrency(stats?.totalPOSRevenue || 0)}
                </span>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Monthly */}
        <TabsContent value="monthly" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Monthly Revenue Trend</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[400px]">
                {isLoading ? <Skeleton className="h-full w-full" /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData}>
                      <defs>
                        <linearGradient id="colorMonthly" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorMonthly)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financial Summary */}
        <TabsContent value="financial" className="space-y-6">
          <FinancialSummaryReport />
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
};

const ReportsPage = () => (
  <ErrorBoundary>
    <Reports />
  </ErrorBoundary>
);

export default ReportsPage;
