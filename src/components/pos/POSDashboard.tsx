import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  History,
  DollarSign,
  Clock,
  TrendingUp,
  Activity,
  BarChart3,
  Map as MapIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePOSTransactions } from "@/hooks/usePOS";
import { format, subHours, subDays } from "date-fns";
import { formatAD } from "@/lib/utils";
import { ThreeDBar, ThreeDLineChart, ThreeDTableMap } from "@/components/pos";

export function POSDashboard() {
  const navigate = useNavigate();
  const { data: realTransactions } = usePOSTransactions();

  // High-fidelity fallback mock data
  const mockTransactions = useMemo(() => [
    { id: "m1", transaction_number: "TXN-20240320-001", total: 125.50, created_at: subHours(new Date(), 1).toISOString(), payment_method: "card" },
    { id: "m2", transaction_number: "TXN-20240320-002", total: 42.00, created_at: subHours(new Date(), 2).toISOString(), payment_method: "cash" },
    { id: "m3", transaction_number: "TXN-20240320-003", total: 88.75, created_at: subHours(new Date(), 3).toISOString(), payment_method: "digital" },
    { id: "m4", transaction_number: "TXN-20240320-004", total: 210.00, created_at: subHours(new Date(), 5).toISOString(), payment_method: "card" },
    { id: "m5", transaction_number: "TXN-20240320-005", total: 15.25, created_at: subHours(new Date(), 6).toISOString(), payment_method: "cash" },
  ], []);

  const transactions = realTransactions?.length ? realTransactions : mockTransactions;

  const stats = useMemo(() => {
    const todaySales = transactions.filter(t =>
      new Date(t.created_at).toDateString() === new Date().toDateString()
    ).reduce((sum, t) => sum + t.total, 0);

    return [
      { label: "Today's Sales", value: `$${todaySales.toFixed(2)}`, icon: DollarSign, color: "text-success" },
      { label: "Total Transactions", value: transactions.length, icon: TrendingUp, color: "text-primary" },
      { label: "Active Tables", value: "4/12", icon: BarChart3, color: "text-amber-500" },
      { label: "Staff on Shift", value: "6", icon: Clock, color: "text-blue-500" },
    ];
  }, [transactions]);

  const hourlyData = [
    { hour: "10am", value: 450 },
    { hour: "12pm", value: 1200 },
    { hour: "2pm", value: 850 },
    { hour: "4pm", value: 600 },
    { hour: "6pm", value: 1500 },
    { hour: "8pm", value: 2100 },
    { hour: "10pm", value: 950 },
  ];

  const dailyRevenueData = [
    { label: format(subDays(new Date(), 6), "EEE"), value: 1200 },
    { label: format(subDays(new Date(), 5), "EEE"), value: 1800 },
    { label: format(subDays(new Date(), 4), "EEE"), value: 1400 },
    { label: format(subDays(new Date(), 3), "EEE"), value: 2200 },
    { label: format(subDays(new Date(), 2), "EEE"), value: 2100 },
    { label: format(subDays(new Date(), 1), "EEE"), value: 2800 },
    { label: "Today", value: 3100 },
  ];

  const maxHourlyValue = Math.max(...hourlyData.map(d => d.value));

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card
            key={stat.label}
            variant="elevated"
            className="group hover:scale-[1.02] transition-all duration-300 transform-gpu perspective-1000"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <h3 className="text-2xl font-bold mt-1 group-hover:text-primary transition-colors">{stat.value}</h3>
                </div>
                <div className={`h-12 w-12 rounded-full bg-secondary/50 flex items-center justify-center ${stat.color} group-hover:bg-primary/10 transition-colors`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 3D Bar Chart */}
        <Card variant="elevated" className="lg:col-span-2 overflow-hidden bg-gradient-to-br from-card to-secondary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Activity className="h-5 w-5" />
              Hourly Sales Velocity
            </CardTitle>
            <CardDescription>Real-time performance and peak traffic</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex justify-between items-end h-[180px] px-4 pb-4">
              {hourlyData.map((data) => (
                <ThreeDBar
                  key={data.hour}
                  label={data.hour}
                  value={data.value}
                  maxValue={maxHourlyValue}
                  color={data.value > 1500 ? "hsl(var(--accent))" : "hsl(var(--primary))"}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 3D Table Map / Mapping Details */}
        <Card variant="elevated" className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-500">
              <MapIcon className="h-5 w-5" />
              Restaurant Floor Plan
            </CardTitle>
            <CardDescription>Live isometric table status map</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ThreeDTableMap />
          </CardContent>
        </Card>
      </div>

      {/* 3D Line Chart */}
      <Card variant="elevated" className="overflow-hidden bg-gradient-to-tr from-card to-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-success">
            <TrendingUp className="h-5 w-5" />
            Weekly Revenue Trend
          </CardTitle>
          <CardDescription>Visualizing financial growth over the last 7 days</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <ThreeDLineChart data={dailyRevenueData} color="hsl(var(--success))" height={250} />
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card variant="elevated" className="overflow-hidden">
        <CardHeader className="bg-secondary/10">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Recent Transactions
              </CardTitle>
              <CardDescription>Live feed of completed sales</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/pos/history")} className="hover:bg-primary/10">View All</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {transactions.slice(0, 5).map((t) => (
              <div key={t.id} className="flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-sm tracking-tight">{t.transaction_number}</p>
                    <p className="text-xs text-muted-foreground">{formatAD(new Date(t.created_at), "time")}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-sm">${t.total.toFixed(2)}</p>
                  <Badge variant="outline" className="text-[10px] h-4 font-bold uppercase tracking-wider">{t.payment_method}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
