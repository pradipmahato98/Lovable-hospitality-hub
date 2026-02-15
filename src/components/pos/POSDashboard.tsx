import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart,
  ChefHat,
  BarChart3,
  History,
  Plus,
  ArrowRight,
  Utensils,
  DollarSign,
  Clock,
  TrendingUp,
  Activity
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePOSTransactions } from "@/hooks/usePOS";
import { format, subHours } from "date-fns";
import { ThreeDBar } from "./ThreeDBar";

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
      { label: "Active Tables", value: "4/12", icon: Utensils, color: "text-amber-500" },
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
        {/* 3D Analytics Chart */}
        <Card variant="elevated" className="lg:col-span-2 overflow-hidden bg-gradient-to-br from-card to-secondary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Sales Velocity
            </CardTitle>
            <CardDescription>Hourly performance and peak times</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex justify-between items-end h-[180px] px-4 pb-4">
              {hourlyData.map((data) => (
                <ThreeDBar
                  key={data.hour}
                  label={data.hour}
                  value={data.value}
                  maxValue={maxHourlyValue}
                  color={data.value > 1500 ? "hsl(var(--gold))" : "hsl(var(--primary))"}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Access Grid */}
        <div className="grid grid-cols-1 gap-4">
          <Card
            variant="highlight"
            className="cursor-pointer group relative overflow-hidden transform-gpu transition-all duration-500 hover:rotate-x-2 hover:shadow-2xl"
            onClick={() => navigate("/pos/terminal")}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-6 w-6 text-primary" />
                Terminal
              </CardTitle>
              <CardDescription>Open POS for new orders</CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <Button className="w-full gap-2 transform group-hover:translate-x-1 transition-transform">
                New Transaction
                <Plus className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card
            variant="elevated"
            className="cursor-pointer group hover:border-amber-500/50 transition-all duration-300"
            onClick={() => navigate("/pos/kitchen")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChefHat className="h-6 w-6 text-amber-500" />
                Kitchen Display
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full gap-2 group-hover:bg-amber-500/10 group-hover:text-amber-500 transition-colors">
                View KDS
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card
            variant="elevated"
            className="cursor-pointer group hover:border-blue-500/50 transition-all duration-300"
            onClick={() => navigate("/pos/reports")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-blue-500" />
                Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full gap-2 group-hover:bg-blue-500/10 group-hover:text-blue-500 transition-colors">
                View Analytics
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

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
                    <p className="text-xs text-muted-foreground">{format(new Date(t.created_at), "MMM d, HH:mm")}</p>
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
