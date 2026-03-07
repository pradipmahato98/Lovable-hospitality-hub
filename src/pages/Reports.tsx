import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Download,
  FileSpreadsheet,
  TrendingUp,
  Users,
  BedDouble,
  DollarSign,
  Calendar,
  Filter,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  CartesianGrid
} from "recharts";
import { exportToPDF, exportToExcel } from "@/lib/reportExport";
import { toast } from "sonner";
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";

const occupancyData = [
  { month: "Jan", rate: 72, revpar: 105 },
  { month: "Feb", rate: 68, revpar: 98 },
  { month: "Mar", rate: 85, revpar: 125 },
  { month: "Apr", rate: 88, revpar: 132 },
  { month: "May", rate: 82, revpar: 118 },
  { month: "Jun", rate: 91, revpar: 145 },
  { month: "Jul", rate: 95, revpar: 155 },
  { month: "Aug", rate: 98, revpar: 168 },
  { month: "Sep", rate: 89, revpar: 142 },
  { month: "Oct", rate: 78, revpar: 115 },
  { month: "Nov", rate: 82, revpar: 122 },
  { month: "Dec", rate: 92, revpar: 152 },
];

const revenueBySource = [
  { source: "Room Bookings", amount: 85000, color: "hsl(38, 92%, 55%)" },
  { source: "Restaurant", amount: 32000, color: "hsl(142, 71%, 45%)" },
  { source: "Spa & Wellness", amount: 18000, color: "hsl(222, 84%, 50%)" },
  { source: "Events", amount: 24000, color: "hsl(280, 70%, 50%)" },
  { source: "Other Services", amount: 8000, color: "hsl(0, 72%, 51%)" },
];

const reportTypes = [
  { icon: TrendingUp, title: "Revenue Report", description: "Detailed financial analysis", lastGenerated: "Dec 19, 2024" },
  { icon: BedDouble, title: "Occupancy Report", description: "Room utilization metrics", lastGenerated: "Dec 19, 2024" },
  { icon: Users, title: "Guest Analytics", description: "Demographics and behavior", lastGenerated: "Dec 18, 2024" },
  { icon: DollarSign, title: "Expense Report", description: "Operational cost breakdown", lastGenerated: "Dec 15, 2024" },
];

const Reports = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeReportTab = searchParams.get("tab") || "overview";

  const setActiveReportTab = (tab: string) => {
    setSearchParams({ tab });
  };

  const handleExportPDF = (reportTitle: string) => {
    toast.success(`${reportTitle} exported as PDF`);
  };

  const handleExportExcel = (reportTitle: string) => {
    toast.success(`${reportTitle} exported as Excel`);
  };

  return (
    <MainLayout title="Reports" subtitle="Analytics and business intelligence">

      <Tabs value={activeReportTab} className="space-y-8" onValueChange={setActiveReportTab}>
        <div className="flex justify-between items-center">
          <TabsList className="bg-secondary/50 p-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="daily">Daily Report</TabsTrigger>
            <TabsTrigger value="weekend">Weekend Analysis</TabsTrigger>
            <TabsTrigger value="monthly">Monthly Summary</TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" /> Filter Range
            </Button>
            <Button size="sm">
              <Download className="h-4 w-4 mr-2" /> Export All
            </Button>
          </div>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {reportTypes.map((report, index) => (
              <Card key={report.title} variant="elevated" className="group">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <report.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleExportPDF(report.title)}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{report.title}</h3>
                  <p className="text-xs text-muted-foreground">Last Generated: {report.lastGenerated}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue vs Occupancy</CardTitle>
                <CardDescription>Correlation between room rates and filling status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={occupancyData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                      <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                      <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="rate" stroke="hsl(142, 71%, 45%)" name="Occupancy %" strokeWidth={3} />
                      <Line yAxisId="right" type="monotone" dataKey="revpar" stroke="hsl(38, 92%, 55%)" name="RevPAR ($)" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Distribution</CardTitle>
                <CardDescription>Contribution by department</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center">
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={revenueBySource}
                        innerRadius={80}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="amount"
                      >
                        {revenueBySource.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                      <Legend verticalAlign="bottom" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Daily Report Tab */}
        <TabsContent value="daily" className="space-y-6 animate-in slide-in-from-left-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Daily ADR</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold font-display">$156.40</span>
                  <span className="text-xs text-success flex items-center"><ArrowUpRight className="h-3 w-3" /> 4.2%</span>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Daily Occupancy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold font-display">92.5%</span>
                  <span className="text-xs text-success flex items-center"><ArrowUpRight className="h-3 w-3" /> 1.8%</span>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold font-display">$12,450.00</span>
                  <span className="text-xs text-destructive flex items-center"><ArrowDownRight className="h-3 w-3" /> 2.1%</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Daily Transaction Flow</CardTitle>
              <CardDescription>Volume of transactions by hour for today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { hour: '8am', val: 45 }, { hour: '10am', val: 82 }, { hour: '12pm', val: 120 },
                    { hour: '2pm', val: 95 }, { hour: '4pm', val: 150 }, { hour: '6pm', val: 210 },
                    { hour: '8pm', val: 180 }, { hour: '10pm', val: 60 }
                  ]}>
                    <XAxis dataKey="hour" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="val" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Weekend Tab */}
        <TabsContent value="weekend" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Weekend vs Weekday Performance</CardTitle>
              <CardDescription>Comparative analysis for current month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="font-semibold text-center">Occupancy Rate</h4>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[{ name: 'Weekday', val: 78 }, { name: 'Weekend', val: 96 }]}>
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="val">
                          <Cell fill="hsl(var(--muted))" />
                          <Cell fill="hsl(var(--primary))" />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-semibold text-center">Avg. Room Revenue</h4>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[{ name: 'Weekday', val: 4200 }, { name: 'Weekend', val: 6800 }]}>
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="val">
                          <Cell fill="hsl(var(--muted))" />
                          <Cell fill="hsl(var(--primary))" />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monthly Tab */}
        <TabsContent value="monthly" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Yearly Performance Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={occupancyData}>
                    <defs>
                      <linearGradient id="colorMonthly" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="revpar" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorMonthly)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </MainLayout>
  );
};

export default Reports;
