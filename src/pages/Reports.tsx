import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, TrendingUp, Users, BedDouble, DollarSign } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";

const occupancyData = [
  { month: "Jan", rate: 72 },
  { month: "Feb", rate: 68 },
  { month: "Mar", rate: 85 },
  { month: "Apr", rate: 88 },
  { month: "May", rate: 82 },
  { month: "Jun", rate: 91 },
  { month: "Jul", rate: 95 },
  { month: "Aug", rate: 98 },
  { month: "Sep", rate: 89 },
  { month: "Oct", rate: 78 },
  { month: "Nov", rate: 82 },
  { month: "Dec", rate: 92 },
];

const revenueBySource = [
  { source: "Room Bookings", amount: 85000 },
  { source: "Restaurant", amount: 32000 },
  { source: "Spa & Wellness", amount: 18000 },
  { source: "Events", amount: 24000 },
  { source: "Other Services", amount: 8000 },
];

const guestDemographics = [
  { name: "Business", value: 45, color: "hsl(38, 92%, 55%)" },
  { name: "Leisure", value: 35, color: "hsl(142, 71%, 45%)" },
  { name: "Events", value: 15, color: "hsl(222, 84%, 50%)" },
  { name: "Long Stay", value: 5, color: "hsl(280, 70%, 50%)" },
];

const reportTypes = [
  { icon: TrendingUp, title: "Revenue Report", description: "Detailed financial analysis", lastGenerated: "Dec 19, 2024" },
  { icon: BedDouble, title: "Occupancy Report", description: "Room utilization metrics", lastGenerated: "Dec 19, 2024" },
  { icon: Users, title: "Guest Analytics", description: "Demographics and behavior", lastGenerated: "Dec 18, 2024" },
  { icon: DollarSign, title: "Expense Report", description: "Operational cost breakdown", lastGenerated: "Dec 15, 2024" },
];

const Reports = () => {
  return (
    <MainLayout title="Reports" subtitle="Analytics and business intelligence">
      {/* Quick Report Generation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {reportTypes.map((report, index) => (
          <Card
            key={report.title}
            variant="elevated"
            className="animate-slide-up cursor-pointer hover:shadow-glow transition-all group"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <report.icon className="h-5 w-5 text-primary" />
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
              <h3 className="font-semibold text-foreground mb-1">{report.title}</h3>
              <p className="text-xs text-muted-foreground mb-2">{report.description}</p>
              <p className="text-xs text-muted-foreground">Last: {report.lastGenerated}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Occupancy Trend */}
        <Card variant="elevated" className="animate-fade-in">
          <CardHeader>
            <CardTitle>Occupancy Rate Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={occupancyData}>
                  <defs>
                    <linearGradient id="occupancyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "hsl(222, 15%, 55%)", fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(222, 15%, 55%)", fontSize: 12 }} tickFormatter={(value) => `${value}%`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(222, 40%, 10%)",
                      border: "1px solid hsl(222, 25%, 18%)",
                      borderRadius: "8px",
                      color: "hsl(45, 20%, 95%)",
                    }}
                    formatter={(value: number) => [`${value}%`, "Occupancy"]}
                  />
                  <Area type="monotone" dataKey="rate" stroke="hsl(142, 71%, 45%)" strokeWidth={2} fill="url(#occupancyGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Revenue by Source */}
        <Card variant="elevated" className="animate-fade-in">
          <CardHeader>
            <CardTitle>Revenue by Source</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueBySource} layout="vertical">
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "hsl(222, 15%, 55%)", fontSize: 12 }} tickFormatter={(value) => `$${value / 1000}k`} />
                  <YAxis type="category" dataKey="source" axisLine={false} tickLine={false} tick={{ fill: "hsl(222, 15%, 55%)", fontSize: 12 }} width={100} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(222, 40%, 10%)",
                      border: "1px solid hsl(222, 25%, 18%)",
                      borderRadius: "8px",
                      color: "hsl(45, 20%, 95%)",
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]}
                  />
                  <Bar dataKey="amount" fill="hsl(38, 92%, 55%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Guest Demographics */}
      <Card variant="elevated" className="animate-fade-in">
        <CardHeader>
          <CardTitle>Guest Demographics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-8">
            <div className="h-[200px] w-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={guestDemographics}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {guestDemographics.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-4">
              {guestDemographics.map((item) => (
                <div key={item.name} className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.name}</p>
                    <p className="text-lg font-bold" style={{ color: item.color }}>{item.value}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  );
};

export default Reports;
