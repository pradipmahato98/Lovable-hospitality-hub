import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowRight,
  Calendar,
  Filter,
  Zap,
  ChefHat
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { POSNav } from "@/components/pos/POSNav";
import { usePOSTransactions, usePOSTables, POSTransaction } from "@/hooks/usePOS";
import { useHRStats } from "@/hooks/useHR";
import { format, startOfDay, subDays, isWithinInterval, isToday, parseISO, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
  LineChart,
  Line
} from "recharts";

const COLORS = ["#D4AF37", "#1E293B", "#4ADE80", "#F87171", "#60A5FA", "#A78BFA"];

const POSDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [dateFilter, setDateFilter] = useState({
    startDate: format(subDays(new Date(), 30), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd")
  });

  const { data: transactions = [], isLoading: loadingTx } = usePOSTransactions({
    startDate: dateFilter.startDate,
    endDate: dateFilter.endDate
  });
  const { data: tables = [], isLoading: loadingTables } = usePOSTables();
  const hrStats = useHRStats();

  const stats = useMemo(() => {
    const txs = Array.isArray(transactions) ? transactions : [];

    // 1. Today's Sales
    const todaySales = txs
      .filter(t => isToday(new Date(t.created_at)))
      .reduce((sum, t) => sum + (t.total || 0), 0);

    // 2. Total Transactions (in current filter)
    const totalTransactions = txs.length;

    // 3. Active Tables
    const activeTablesCount = tables.filter(t => t.status !== 'available').length;

    // 4. Staff on Shift
    const staffOnShift = hrStats.clockedInToday;

    // Hourly Quantity Ordered Based on Hours
    const hourlyMap: Record<number, number> = {};
    txs.forEach(t => {
      const hour = new Date(t.created_at).getHours();
      hourlyMap[hour] = (hourlyMap[hour] || 0) + (t.items_count || 0);
    });
    const hourlyData = Array.from({ length: 15 }, (_, i) => {
      const h = i + 6; // 6 AM to 8 PM
      return { hour: h, quantity: hourlyMap[h] || 0 };
    });

    // Categories % Distribution
    const categoryMap: Record<string, number> = {};
    txs.forEach(t => {
      t.items?.forEach((item: any) => {
        const cat = item.category || "General";
        categoryMap[cat] = (categoryMap[cat] || 0) + (item.item_price * item.quantity);
      });
    });
    const categoryData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Top 5 Products
    const productMap: Record<string, number> = {};
    txs.forEach(t => {
      t.items?.forEach((item: any) => {
        productMap[item.item_name] = (productMap[item.item_name] || 0) + (item.item_price * item.quantity);
      });
    });
    const productData = Object.entries(productMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Order on Weekdays
    const weekdayMap: Record<string, { orders: number; revenue: number }> = {
      "Sunday": { orders: 0, revenue: 0 },
      "Monday": { orders: 0, revenue: 0 },
      "Tuesday": { orders: 0, revenue: 0 },
      "Wednesday": { orders: 0, revenue: 0 },
      "Thursday": { orders: 0, revenue: 0 },
      "Friday": { orders: 0, revenue: 0 },
      "Saturday": { orders: 0, revenue: 0 },
    };
    txs.forEach(t => {
      const day = format(new Date(t.created_at), "EEEE");
      if (weekdayMap[day]) {
        weekdayMap[day].orders += 1;
        weekdayMap[day].revenue += t.total;
      }
    });
    const weekdayData = Object.entries(weekdayMap).map(([name, data]) => ({
      name,
      orders: data.orders,
      revenue: data.revenue
    }));

    return {
      todaySales,
      totalTransactions,
      activeTablesCount,
      staffOnShift,
      hourlyData,
      categoryData,
      productData,
      weekdayData
    };
  }, [transactions]);

  return (
    <MainLayout title="POS Analytics Dashboard" subtitle="Performance insights and sales distribution">
      <div className="space-y-6">

        {/* Top Navigation Row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-card/50 backdrop-blur-sm p-3 rounded-xl border border-border/40 shadow-sm sticky top-0 z-20">
          <POSNav activeTab="dashboard" />

          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <div className="flex items-center gap-2 bg-secondary/50 px-3 py-1.5 rounded-lg border border-border/50">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={dateFilter.startDate}
                onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
                className="h-7 w-32 border-none bg-transparent focus-visible:ring-0 p-0 text-xs"
              />
              <span className="text-muted-foreground">-</span>
              <Input
                type="date"
                value={dateFilter.endDate}
                onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
                className="h-7 w-32 border-none bg-transparent focus-visible:ring-0 p-0 text-xs"
              />
            </div>
            <Button variant="outline" size="sm" className="h-9 gap-2">
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
            </Button>
          </div>
        </div>

        {/* Top 4 Metrics cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-[#E5D1B8] border-none shadow-sm text-slate-900">
            <CardContent className="p-6">
              <div className="flex flex-col items-center justify-center text-center space-y-1">
                <h3 className="text-2xl font-bold tabular-nums">
                  ${stats.todaySales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
                <p className="text-sm font-medium opacity-80 uppercase tracking-wider">Today's Sales</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#D1D5DB] border-none shadow-sm text-slate-900">
            <CardContent className="p-6">
              <div className="flex flex-col items-center justify-center text-center space-y-1">
                <h3 className="text-2xl font-bold tabular-nums">
                  {stats.totalTransactions.toLocaleString()}
                </h3>
                <p className="text-sm font-medium opacity-80 uppercase tracking-wider">Total Transactions</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#D1D5DB] border-none shadow-sm text-slate-900">
            <CardContent className="p-6">
              <div className="flex flex-col items-center justify-center text-center space-y-1">
                <h3 className="text-2xl font-bold tabular-nums">
                  {stats.activeTablesCount}
                </h3>
                <p className="text-sm font-medium opacity-80 uppercase tracking-wider">Active Tables</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#D1D5DB] border-none shadow-sm text-slate-900">
            <CardContent className="p-6">
              <div className="flex flex-col items-center justify-center text-center space-y-1">
                <h3 className="text-2xl font-bold tabular-nums">
                  {stats.staffOnShift}
                </h3>
                <p className="text-sm font-medium opacity-80 uppercase tracking-wider">Staff on Shift</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 perspective-1000">
          {/* Quantity Ordered Based on Hours */}
          <Card className="bg-[#F3E8DA] border-border/20 shadow-xl overflow-hidden rotate-x-2 transform-gpu">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-center text-slate-800">Quantity Ordered Based on Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D1D5DB" />
                    <XAxis dataKey="hour" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#fff", border: "1px solid #ddd", borderRadius: "8px", fontSize: "12px" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="quantity"
                      stroke="#4B2C20"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "#4B2C20" }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Categories % Distribution */}
          <Card className="bg-[#F3E8DA] border-border/20 shadow-xl overflow-hidden rotate-x-2 transform-gpu">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-center text-slate-800">Categories % Distribution Based on Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.categoryData.length > 0 ? stats.categoryData : [{ name: "No Sales", value: 1 }]}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={40}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                    >
                      {(stats.categoryData.length > 0 ? stats.categoryData : [{ name: "No Data", value: 1 }]).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: "10px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Size Distribution */}
          <Card className="bg-[#F3E8DA] border-border/20 shadow-xl overflow-hidden rotate-x-2 transform-gpu">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-center text-slate-800">% Order Source Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Dine-in", value: 65 },
                        { name: "Takeaway", value: 25 },
                        { name: "Delivery", value: 10 }
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                    >
                      <Cell fill="#3B82F6" />
                      <Cell fill="#F97316" />
                      <Cell fill="#10B981" />
                    </Pie>
                    <Tooltip />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: "10px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Sales by Payment Method */}
          <Card className="bg-[#F3E8DA] border-border/20 shadow-xl overflow-hidden rotate-x-2 transform-gpu">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-center text-slate-800">Sales by Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={(() => {
                    const methods: Record<string, number> = {};
                    transactions.forEach(t => {
                      methods[t.payment_method] = (methods[t.payment_method] || 0) + t.total;
                    });
                    return Object.entries(methods).map(([name, value]) => ({ name, value }));
                  })()}>
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#6F4E37" />
                          <stop offset="50%" stopColor="#8B5E3C" />
                          <stop offset="100%" stopColor="#6F4E37" />
                        </linearGradient>
                      </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis fontSize={10} axisLine={false} tickLine={false} />
                    <Tooltip />
                      <Bar dataKey="value" fill="url(#barGradient)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Top 5 Products Based on Sales */}
          <Card className="bg-[#F3E8DA] border-border/20 shadow-xl overflow-hidden rotate-x-2 transform-gpu">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-center text-slate-800">Top 5 Products Based on Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.productData} layout="vertical">
                      <defs>
                        <linearGradient id="productGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2D1B14" />
                          <stop offset="50%" stopColor="#4B2C20" />
                          <stop offset="100%" stopColor="#2D1B14" />
                        </linearGradient>
                      </defs>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" width={80} fontSize={10} axisLine={false} tickLine={false} />
                    <Tooltip />
                      <Bar dataKey="value" fill="url(#productGradient)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Order on Weekdays */}
          <Card className="bg-[#F3E8DA] border-border/20 shadow-xl overflow-hidden rotate-x-2 transform-gpu">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-center text-slate-800">Order on Weekdays</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.weekdayData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" fontSize={9} axisLine={false} tickLine={false} />
                    <YAxis fontSize={10} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="orders" fill="#334155" stackId="a" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="revenue" fill="#D4AF37" stackId="b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Operational Overview Footer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Live Table Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {tables.map(table => (
                  <div
                    key={table.id}
                    className={`aspect-square rounded-lg flex items-center justify-center text-[10px] font-bold border ${
                      table.status === 'available'
                        ? 'bg-success/20 border-success/40 text-success'
                        : 'bg-amber-500/20 border-amber-500/40 text-amber-600'
                    }`}
                  >
                    T{table.table_number}
                  </div>
                ))}
              </div>
              <Button variant="link" className="mt-4 p-0 h-auto text-xs" asChild>
                <Link to="/pos/terminal">Go to Live Terminal <ArrowRight className="h-3 w-3 ml-1" /></Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-orange-500/20 bg-orange-500/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ChefHat className="h-5 w-5 text-orange-500" />
                Kitchen Efficiency
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-medium">Avg. Prep Time</span>
                  <span className="font-bold">14.5 mins</span>
                </div>
                <div className="h-2 w-full bg-orange-200 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 w-[70%]" />
                </div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Optimal Range: 12-18 mins</p>
              </div>
              <Button variant="link" className="mt-4 p-0 h-auto text-xs text-orange-500 hover:text-orange-600" asChild>
                <Link to="/pos/kitchen">Open Kitchen Display <ArrowRight className="h-3 w-3 ml-1" /></Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default POSDashboard;
