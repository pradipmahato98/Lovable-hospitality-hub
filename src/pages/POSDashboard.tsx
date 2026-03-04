import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowRight,
  Calendar,
  Filter,
  Zap,
  ChefHat,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  CreditCard,
  History
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { POSNav } from "@/components/pos/POSNav";
import { usePOSTransactions, usePOSTables } from "@/hooks/usePOS";
import { useHRStats } from "@/hooks/useHR";
import { format, isToday, subDays } from "date-fns";
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
  LineChart,
  Line
} from "recharts";

const COLORS = ["#8B5E3C", "#2D1B14", "#D4AF37", "#4B2C20", "#A67B5B", "#E5D1B8"];

const POSDashboard = () => {
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
      if (!t.created_at) return;
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
    const categoryData = Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Top 5 Products
    const productMap: Record<string, number> = {};
    txs.forEach(t => {
      t.items?.forEach((item: any) => {
        const name = item.item_name || "General Item";
        productMap[name] = (productMap[name] || 0) + (item.item_price * item.quantity);
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
      if (!t.created_at) return;
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

    // Recent Transactions
    const recentTx = [...txs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);

    return {
      todaySales,
      totalTransactions,
      activeTablesCount,
      staffOnShift,
      hourlyData,
      categoryData,
      productData,
      weekdayData,
      recentTx
    };
  }, [transactions, tables, hrStats]);

  return (
    <MainLayout title="POS Analytics Dashboard" subtitle="Performance insights and sales distribution">
      <div className="space-y-6">

        {/* Top Navigation Row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-card/70 backdrop-blur-md p-3 rounded-xl border border-border shadow-md sticky top-0 z-20">
          <POSNav activeTab="dashboard" />

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-secondary/80 px-3 py-1.5 rounded-lg border border-border shadow-inner">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={dateFilter.startDate}
                onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
                className="h-7 w-32 border-none bg-transparent focus-visible:ring-0 p-0 text-xs font-semibold"
              />
              <span className="text-muted-foreground">-</span>
              <Input
                type="date"
                value={dateFilter.endDate}
                onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
                className="h-7 w-32 border-none bg-transparent focus-visible:ring-0 p-0 text-xs font-semibold"
              />
            </div>
            <Button variant="outline" size="sm" className="h-9 gap-2 shadow-sm">
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
            </Button>
          </div>
        </div>

        {/* Top 4 Metrics cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-[#E5D1B8] border border-black/5 shadow-xl text-slate-900 overflow-hidden relative group transition-all duration-300 hover:scale-[1.02]">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <TrendingUp className="h-12 w-12" />
            </div>
            <CardContent className="p-6">
              <div className="flex flex-col space-y-1">
                <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Today's Sales</p>
                <h3 className="text-3xl font-black tabular-nums">
                  ${stats.todaySales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
                <div className="flex items-center gap-1 text-[10px] font-bold text-success">
                  <TrendingUp className="h-3 w-3" />
                  <span>+12.5% from yesterday</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#D1D5DB] border border-black/5 shadow-xl text-slate-900 overflow-hidden relative group transition-all duration-300 hover:scale-[1.02]">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <ShoppingBag className="h-12 w-12" />
            </div>
            <CardContent className="p-6">
              <div className="flex flex-col space-y-1">
                <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Total Transactions</p>
                <h3 className="text-3xl font-black tabular-nums">
                  {stats.totalTransactions.toLocaleString()}
                </h3>
                <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600">
                  <TrendingUp className="h-3 w-3" />
                  <span>+4% from last week</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#D1D5DB] border border-black/5 shadow-xl text-slate-900 overflow-hidden relative group transition-all duration-300 hover:scale-[1.02]">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <Zap className="h-12 w-12" />
            </div>
            <CardContent className="p-6">
              <div className="flex flex-col space-y-1">
                <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Active Tables</p>
                <h3 className="text-3xl font-black tabular-nums">
                  {stats.activeTablesCount}
                </h3>
                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-600">
                  <span>Current Occupancy: {((stats.activeTablesCount / (tables.length || 1)) * 100).toFixed(0)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#D1D5DB] border border-black/5 shadow-xl text-slate-900 overflow-hidden relative group transition-all duration-300 hover:scale-[1.02]">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <ChefHat className="h-12 w-12" />
            </div>
            <CardContent className="p-6">
              <div className="flex flex-col space-y-1">
                <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Staff on Shift</p>
                <h3 className="text-3xl font-black tabular-nums">
                  {stats.staffOnShift}
                </h3>
                <div className="flex items-center gap-1 text-[10px] font-bold text-blue-600">
                  <span>All departments active</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 perspective-1000">
          {/* Quantity Ordered Based on Hours */}
          <Card className="bg-[#FDF6ED] border-border/40 shadow-2xl overflow-hidden rotate-x-2 transform-gpu">
            <CardHeader className="pb-2 border-b border-black/5">
              <CardTitle className="text-sm font-black text-center text-slate-800 uppercase tracking-wider">Quantity Ordered By Hour</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.4} />
                    <XAxis dataKey="hour" fontSize={10} tickLine={false} axisLine={false} tick={{fill: '#475569', fontWeight: 600}} />
                    <YAxis fontSize={10} tickLine={false} axisLine={false} tick={{fill: '#475569', fontWeight: 600}} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#fff", border: "2px solid #8B5E3C", borderRadius: "8px", fontSize: "11px", fontWeight: "bold" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="quantity"
                      stroke="#4B2C20"
                      strokeWidth={4}
                      dot={{ r: 5, fill: "#4B2C20", strokeWidth: 2, stroke: "#FDF6ED" }}
                      activeDot={{ r: 7, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Categories % Distribution */}
          <Card className="bg-[#FDF6ED] border-border/40 shadow-2xl overflow-hidden rotate-x-2 transform-gpu">
            <CardHeader className="pb-2 border-b border-black/5">
              <CardTitle className="text-sm font-black text-center text-slate-800 uppercase tracking-wider">Category Revenue Split</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.categoryData.length > 0 ? stats.categoryData : [{ name: "No Sales", value: 1 }]}
                      cx="50%"
                      cy="45%"
                      outerRadius={80}
                      innerRadius={50}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                    >
                      {(stats.categoryData.length > 0 ? stats.categoryData : [{ name: "No Data", value: 1 }]).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend iconType="rect" wrapperStyle={{ fontSize: "10px", fontWeight: "bold", paddingTop: "10px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Order Source Distribution */}
          <Card className="bg-[#FDF6ED] border-border/40 shadow-2xl overflow-hidden rotate-x-2 transform-gpu">
            <CardHeader className="pb-2 border-b border-black/5">
              <CardTitle className="text-sm font-black text-center text-slate-800 uppercase tracking-wider">Order Source Mix</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
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
                      cy="45%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                    >
                      <Cell fill="#1E293B" strokeWidth={0} />
                      <Cell fill="#8B5E3C" strokeWidth={0} />
                      <Cell fill="#D4AF37" strokeWidth={0} />
                    </Pie>
                    <Tooltip />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: "10px", fontWeight: "bold", paddingTop: "10px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Sales by Payment Method */}
          <Card className="bg-[#FDF6ED] border-border/40 shadow-2xl overflow-hidden rotate-x-2 transform-gpu">
            <CardHeader className="pb-2 border-b border-black/5">
              <CardTitle className="text-sm font-black text-center text-slate-800 uppercase tracking-wider">Sales by Payment Method</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={(() => {
                    const methods: Record<string, number> = {};
                    transactions.forEach(t => {
                      const method = t.payment_method || "Other";
                      methods[method] = (methods[method] || 0) + t.total;
                    });
                    return Object.entries(methods).map(([name, value]) => ({ name, value }));
                  })()}>
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#4B2C20" />
                          <stop offset="100%" stopColor="#8B5E3C" />
                        </linearGradient>
                      </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.4} />
                    <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#475569', fontWeight: 600}} />
                    <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#475569', fontWeight: 600}} />
                    <Tooltip />
                      <Bar dataKey="value" fill="url(#barGradient)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Top 5 Products Based on Sales */}
          <Card className="bg-[#FDF6ED] border-border/40 shadow-2xl overflow-hidden rotate-x-2 transform-gpu">
            <CardHeader className="pb-2 border-b border-black/5">
              <CardTitle className="text-sm font-black text-center text-slate-800 uppercase tracking-wider">Best Selling Products</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.productData} layout="vertical">
                      <defs>
                        <linearGradient id="productGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2D1B14" />
                          <stop offset="100%" stopColor="#4B2C20" />
                        </linearGradient>
                      </defs>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#94a3b8" strokeOpacity={0.4} />
                    <XAxis type="number" fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#475569', fontWeight: 600}} />
                    <YAxis dataKey="name" type="category" width={90} fontSize={9} axisLine={false} tickLine={false} tick={{fill: '#1e293b', fontWeight: 800}} />
                    <Tooltip />
                      <Bar dataKey="value" fill="url(#productGradient)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Order on Weekdays */}
          <Card className="bg-[#FDF6ED] border-border/40 shadow-2xl overflow-hidden rotate-x-2 transform-gpu">
            <CardHeader className="pb-2 border-b border-black/5">
              <CardTitle className="text-sm font-black text-center text-slate-800 uppercase tracking-wider">Weekly Performance</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.weekdayData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.4} />
                    <XAxis dataKey="name" fontSize={9} axisLine={false} tickLine={false} tick={{fill: '#475569', fontWeight: 600}} />
                    <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#475569', fontWeight: 600}} />
                    <Tooltip />
                    <Bar dataKey="orders" fill="#1E293B" stackId="a" radius={[2, 2, 0, 0]} barSize={15} />
                    <Bar dataKey="revenue" fill="#D4AF37" stackId="b" radius={[4, 4, 0, 0]} barSize={15} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Operational Overview Footer */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="border-border/40 bg-card shadow-lg">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Live Table Occupancy
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {tables.map(table => (
                  <div
                    key={table.id}
                    className={`aspect-square rounded-lg flex flex-col items-center justify-center border-2 transition-all duration-300 ${
                      table.status === 'available'
                        ? 'bg-success/5 border-success/30 text-success'
                        : 'bg-amber-500/10 border-amber-500/40 text-amber-700 shadow-inner'
                    }`}
                  >
                    <span className="text-[10px] font-black uppercase tracking-tighter">T{table.table_number}</span>
                    <span className="text-[8px] opacity-60 font-bold">{table.status === 'available' ? 'FREE' : 'BUSY'}</span>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4 h-8 text-[10px] font-bold uppercase tracking-widest border-primary/20 hover:bg-primary/5" asChild>
                <Link to="/pos/terminal">Launch POS Terminal <ArrowRight className="h-3 w-3 ml-2" /></Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-card shadow-lg">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <History className="h-5 w-5 text-amber-600" />
                Recent Sales Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 p-0">
              <div className="divide-y">
                {stats.recentTx.map((tx) => (
                  <div key={tx.id} className="px-4 py-2.5 flex items-center justify-between hover:bg-secondary/20 transition-colors">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-800">#{tx.transaction_number.split('-').pop()}</span>
                      <span className="text-[10px] text-muted-foreground">{format(new Date(tx.created_at), "HH:mm")} • Table {tx.table_number}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-black text-slate-900">${tx.total.toFixed(2)}</span>
                      <div className="flex items-center gap-1">
                        <CreditCard className="h-2.5 w-2.5 text-muted-foreground" />
                        <span className="text-[9px] uppercase font-bold text-muted-foreground">{tx.payment_method}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3">
                <Button variant="ghost" size="sm" className="w-full h-8 text-[10px] font-bold uppercase tracking-widest" asChild>
                  <Link to="/pos/history">View Sales History</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-card shadow-lg">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ChefHat className="h-5 w-5 text-orange-600" />
                Kitchen Throughput
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                <div className="p-4 bg-orange-500/5 rounded-xl border border-orange-500/20">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-black uppercase text-orange-700 tracking-wider">Avg. Preparation Time</span>
                    <span className="text-sm font-black text-orange-800">14.5 mins</span>
                  </div>
                  <div className="h-2 w-full bg-orange-200 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-600 w-[70%] shadow-[0_0_8px_rgba(234,88,12,0.5)]" />
                  </div>
                  <p className="text-[9px] text-orange-600/70 mt-2 font-bold uppercase tracking-tighter">Target: Under 12 mins • Peaking now</p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1 text-center p-2 rounded-lg bg-secondary/30">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase">Orders Today</p>
                    <p className="text-lg font-black">{stats.totalTransactions}</p>
                  </div>
                  <div className="flex-1 text-center p-2 rounded-lg bg-secondary/30">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase">Errors/Refunds</p>
                    <p className="text-lg font-black">0</p>
                  </div>
                </div>
              </div>
              <Button variant="link" className="w-full mt-4 h-8 text-[10px] font-bold uppercase tracking-widest text-orange-600 hover:text-orange-700" asChild>
                <Link to="/pos/kitchen">Open Kitchen Display <ArrowRight className="h-3 w-3 ml-2" /></Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default POSDashboard;
