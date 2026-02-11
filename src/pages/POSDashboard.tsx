import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart,
  History,
  BarChart3,
  ChefHat,
  ArrowRight,
  DollarSign,
  Users,
  Utensils,
  Clock,
  TrendingUp,
  PieChart as PieChartIcon,
  Activity,
  Zap,
  Star
} from "lucide-react";
import { Link } from "react-router-dom";
import { usePOSTransactions, usePOSTables, POSOrderItem } from "@/hooks/usePOS";
import { useMemo } from "react";
import { format, startOfDay, subHours, isWithinInterval, parseISO } from "date-fns";
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
  Area
} from "recharts";

const COLORS = ["#D4AF37", "#1E293B", "#4ADE80", "#F87171", "#60A5FA", "#A78BFA"];

// Custom 3D Bar component
const ThreeDBar = (props: any) => {
  const { fill, x, y, width, height } = props;
  if (!height) return null;

  return (
    <g>
      {/* Front face */}
      <rect x={x} y={y} width={width} height={height} fill={fill} stroke="none" />
      {/* Top face (3D effect) */}
      <path
        d={`M ${x},${y} L ${x + 4},${y - 4} L ${x + width + 4},${y - 4} L ${x + width},${y} Z`}
        fill={fill}
        filter="brightness(1.2)"
        stroke="none"
      />
      {/* Side face (3D effect) */}
      <path
        d={`M ${x + width},${y} L ${x + width + 4},${y - 4} L ${x + width + 4},${y + height - 4} L ${x + width},${y + height} Z`}
        fill={fill}
        filter="brightness(0.8)"
        stroke="none"
      />
    </g>
  );
};

const POSDashboard = () => {
  const today = format(startOfDay(new Date()), "yyyy-MM-dd");
  const { data: transactions = [], isLoading: loadingTx } = usePOSTransactions({
    startDate: today,
  });
  const { data: tables = [], isLoading: loadingTables } = usePOSTables();

  const stats = useMemo(() => {
    try {
      const txs = Array.isArray(transactions) ? transactions : [];
      const tbls = Array.isArray(tables) ? tables : [];

      const revenue = txs.reduce((sum, t) => sum + (t?.total || 0), 0);
      const activeTables = tbls.filter(t => t?.status && t.status !== "available").length;
      const totalOrders = txs.length;
      const avgOrderValue = totalOrders > 0 ? revenue / totalOrders : 0;

      // Hourly data for the bar chart
      const hourlyData = Array.from({ length: 12 }, (_, i) => {
        const hour = subHours(new Date(), 11 - i);
        const hourStr = format(hour, "HH:00");
        const hourRevenue = txs
          .filter(t => {
            if (!t?.created_at) return false;
            try {
              const txTime = new Date(t.created_at);
              return txTime.getHours() === hour.getHours();
            } catch {
              return false;
            }
          })
          .reduce((sum, t) => sum + (t.total || 0), 0);

        return { time: hourStr, revenue: hourRevenue };
      });

      // Category data for pie chart
      const categoryCounts: Record<string, number> = {};
      txs.forEach(t => {
        if (t?.items && Array.isArray(t.items)) {
          t.items.forEach((item: any) => {
            const cat = item.category || "General";
            categoryCounts[cat] = (categoryCounts[cat] || 0) + ((item.item_price || 0) * (item.quantity || 0));
          });
        }
      });

      const categoryData = Object.entries(categoryCounts).map(([name, value]) => ({
        name,
        value
      })).sort((a, b) => b.value - a.value).slice(0, 5);

      return {
        revenue,
        activeTables,
        totalOrders,
        avgOrderValue,
        hourlyData,
        categoryData
      };
    } catch (e) {
      console.error("Error in POSDashboard useMemo:", e);
      return {
        revenue: 0,
        activeTables: 0,
        totalOrders: 0,
        avgOrderValue: 0,
        hourlyData: [],
        categoryData: []
      };
    }
  }, [transactions, tables]);

  const quickLinks = [
    {
      title: "POS Terminal",
      description: "Process new orders and payments",
      icon: ShoppingCart,
      href: "/pos/terminal",
      color: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      title: "Kitchen Display",
      description: "Manage and track active kitchen orders",
      icon: ChefHat,
      href: "/pos/kitchen",
      color: "bg-orange-500/10",
      iconColor: "text-orange-500",
    },
    {
      title: "Transaction History",
      description: "View and search past transactions",
      icon: History,
      href: "/pos/history",
      color: "bg-blue-500/10",
      iconColor: "text-blue-500",
    },
    {
      title: "POS Reports",
      description: "Analyze sales and performance data",
      icon: BarChart3,
      href: "/pos/reports",
      color: "bg-green-500/10",
      iconColor: "text-green-500",
    },
  ];

  return (
    <MainLayout title="POS Dashboard" subtitle="Advanced analytics and operational overview">
      <div className="space-y-8">
        {/* Detailed Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card variant="elevated" className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-primary uppercase tracking-wider">Today's Revenue</p>
                  <h3 className="text-3xl font-bold mt-1 tabular-nums">
                    {loadingTx ? "..." : `$${stats.revenue.toLocaleString()}`}
                  </h3>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shadow-inner">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center text-xs text-success bg-success/10 px-2 py-0.5 rounded-full font-medium">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  <span>+12.5%</span>
                </div>
                <span className="text-[10px] text-muted-foreground font-mono uppercase">Live Feed</span>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated" className="bg-gradient-to-br from-success/5 to-transparent border-success/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-success uppercase tracking-wider">Total Orders</p>
                  <h3 className="text-3xl font-bold mt-1 tabular-nums">
                    {loadingTx ? "..." : stats.totalOrders}
                  </h3>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-success/10 flex items-center justify-center shadow-inner">
                  <ShoppingCart className="h-6 w-6 text-success" />
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center text-xs text-success bg-success/10 px-2 py-0.5 rounded-full font-medium">
                  <Activity className="h-3 w-3 mr-1" />
                  <span>{stats.totalOrders > 0 ? "Active" : "Idle"}</span>
                </div>
                <span className="text-[10px] text-muted-foreground font-mono uppercase">Updated Now</span>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated" className="bg-gradient-to-br from-amber-500/5 to-transparent border-amber-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-amber-500 uppercase tracking-wider">Active Tables</p>
                  <h3 className="text-3xl font-bold mt-1 tabular-nums">
                    {loadingTables ? "..." : stats.activeTables}
                  </h3>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center shadow-inner">
                  <Utensils className="h-6 w-6 text-amber-500" />
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="text-xs font-medium text-muted-foreground">
                  <span className="text-amber-600 font-bold">{stats.activeTables}</span> / {tables.length} Occupied
                </div>
                <div className="h-1.5 w-24 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 transition-all duration-1000"
                    style={{ width: `${(stats.activeTables / (tables.length || 1)) * 100}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated" className="bg-gradient-to-br from-blue-500/5 to-transparent border-blue-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider">Avg. Check</p>
                  <h3 className="text-3xl font-bold mt-1 tabular-nums">
                    {loadingTx ? "..." : `$${stats.avgOrderValue.toFixed(2)}`}
                  </h3>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center shadow-inner">
                  <Zap className="h-6 w-6 text-blue-500" />
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center text-xs text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full font-medium">
                  <Star className="h-3 w-3 mr-1" />
                  <span>Elite performance</span>
                </div>
                <span className="text-[10px] text-muted-foreground font-mono uppercase">Calculated</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Visual Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Bar Chart (3D Effect) */}
          <Card className="lg:col-span-2 shadow-2xl overflow-hidden border-border/40 bg-card/50 backdrop-blur-xl relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-primary/50 to-transparent" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-xl font-display font-bold">Sales Performance</CardTitle>
                <CardDescription>Hourly revenue distribution (Last 12 hours)</CardDescription>
              </div>
              <div className="p-2 bg-primary/5 rounded-lg border border-primary/10">
                <Activity className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1}/>
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.6}/>
                      </linearGradient>
                      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                        <feOffset dx="4" dy="4" result="offsetblur" />
                        <feComponentTransfer>
                          <feFuncA type="linear" slope="0.4" />
                        </feComponentTransfer>
                        <feMerge>
                          <feMergeNode />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground))" opacity={0.1} />
                    <XAxis
                      dataKey="time"
                      axisLine={false}
                      tickLine={false}
                      fontSize={10}
                      fontWeight={600}
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      fontSize={10}
                      fontWeight={600}
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                    />
                    <Tooltip
                      cursor={{ fill: "hsl(var(--primary))", opacity: 0.05 }}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "12px",
                        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                        fontSize: "12px"
                      }}
                    />
                    <Bar
                      dataKey="revenue"
                      fill="url(#barGradient)"
                      shape={<ThreeDBar />}
                      barSize={32}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Category Pie Chart */}
          <Card className="shadow-2xl border-border/40 bg-card/50 backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-l from-amber-500 via-amber-500/50 to-transparent" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-xl font-display font-bold">Category Split</CardTitle>
                <CardDescription>Revenue by menu category</CardDescription>
              </div>
              <div className="p-2 bg-amber-500/5 rounded-lg border border-amber-500/10">
                <PieChartIcon className="h-5 w-5 text-amber-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[260px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.categoryData.length > 0 ? stats.categoryData : [{ name: "No Sales", value: 1 }]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {(stats.categoryData.length > 0 ? stats.categoryData : [{ name: "No Sales", value: 1 }]).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} style={{ filter: "drop-shadow(2px 4px 6px rgba(0,0,0,0.2))" }} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "12px",
                        fontSize: "12px"
                      }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: "10px", fontWeight: 600 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {stats.categoryData.length > 0 && (
                <div className="mt-4 space-y-2">
                  {stats.categoryData.slice(0, 3).map((cat, i) => (
                    <div key={cat.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="font-medium">{cat.name}</span>
                      </div>
                      <span className="font-bold tabular-nums">${cat.value.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Operations Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Transactions Preview */}
          <Card className="lg:col-span-1 shadow-xl border-border/40 bg-card/50 backdrop-blur-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-display font-bold">Activity Feed</CardTitle>
                <Badge variant="outline" className="text-[10px] font-mono">Live</Badge>
              </div>
              <CardDescription>Latest orders processed today</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTx ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />)}
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground bg-secondary/20 rounded-2xl border border-dashed border-border/50">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p className="text-sm">No transactions yet today</p>
                  <Button variant="outline" size="sm" className="mt-4" asChild>
                    <Link to="/pos/terminal">Open Terminal</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.slice(0, 6).map((tx) => (
                    <div key={tx.id} className="group flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-transparent hover:border-primary/20 hover:bg-primary/5 transition-all duration-200">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-background flex items-center justify-center border border-border/50 shadow-sm group-hover:scale-110 transition-transform">
                          <DollarSign className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-bold truncate max-w-[100px]">{tx.transaction_number}</p>
                          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
                            {format(new Date(tx.created_at), "HH:mm")} • T{tx.table_number}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black tabular-nums text-primary">${tx.total.toFixed(2)}</p>
                        <Badge variant="secondary" className="text-[8px] h-4 px-1 lowercase font-bold">{tx.payment_method}</Badge>
                      </div>
                    </div>
                  ))}
                  <Button variant="ghost" size="sm" className="w-full text-xs font-bold text-muted-foreground mt-2 hover:text-primary transition-colors" asChild>
                    <Link to="/pos/history">View Audit Trail <ArrowRight className="ml-2 h-3 w-3" /></Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Table Map Visualizer */}
          <Card className="lg:col-span-2 shadow-xl border-border/40 bg-card/50 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-lg font-display font-bold">Floor Plan Overview</CardTitle>
                <CardDescription>Real-time occupancy status</CardDescription>
              </div>
              <div className="flex items-center gap-4 text-xs font-bold">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-success shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                  <span>Free</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
                  <span>In Use</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 mt-2">
                {loadingTables ? (
                  Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-square bg-muted animate-pulse rounded-xl" />)
                ) : tables.map((table) => {
                  const isOccupied = table.status !== "available";
                  return (
                    <div
                      key={table.id}
                      className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-300 border shadow-lg ${
                        isOccupied
                        ? "bg-amber-500/10 border-amber-500/30 text-amber-600 shadow-amber-500/5 scale-95"
                        : "bg-success/5 border-success/20 text-success shadow-success/5 hover:scale-105 hover:bg-success/10"
                      }`}
                    >
                      <span className="text-[10px] font-black uppercase">T{table.table_number}</span>
                      <Users className="h-4 w-4 opacity-70" />
                      <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${isOccupied ? "bg-amber-500" : "bg-success"}`} />
                    </div>
                  );
                })}
              </div>
              <div className="mt-8 p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Ready for Service?</p>
                    <p className="text-xs text-muted-foreground">Optimize your turn-over rate</p>
                  </div>
                </div>
                <Button variant="gold" size="sm" className="font-bold shadow-glow" asChild>
                  <Link to="/pos/terminal">Manage Tables</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Grid */}
        <div className="space-y-4">
          <h2 className="text-2xl font-display font-black tracking-tight flex items-center gap-3">
            <span className="h-8 w-1.5 bg-primary rounded-full" />
            Control Center
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickLinks.map((link) => (
              <Link key={link.href} to={link.href}>
                <Card className="h-full hover:border-primary/50 transition-all duration-200 group cursor-pointer overflow-hidden border-border/40 bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-xl ${link.color} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-200`}>
                      <link.icon className={`w-6 h-6 ${link.iconColor}`} />
                    </div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">{link.title}</CardTitle>
                    <CardDescription>{link.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      Open module <ArrowRight className="ml-2 h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </MainLayout>
  );
};

export default POSDashboard;
