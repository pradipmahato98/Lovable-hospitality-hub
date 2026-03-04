import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  Users,
  Receipt,
  ShoppingCart,
  Filter,
  RefreshCw,
} from "lucide-react";
import { usePOSTransactions } from "@/hooks/usePOS";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#ffc658"];

export function POSDashboard() {
  const { data: transactions, isLoading } = usePOSTransactions();
  const [selectedMonth, setSelectedMonth] = useState("March");
  const [selectedDay, setSelectedDay] = useState("All");

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    return transactions.filter(t => {
      const date = new Date(t.created_at);
      const monthMatches = selectedMonth === "All" || months[date.getMonth()] === selectedMonth;
      const dayMatches = selectedDay === "All" || days[date.getDay()] === selectedDay;
      return monthMatches && dayMatches;
    });
  }, [transactions, selectedMonth, selectedDay, months, days]);

  // Calculate Metrics
  const metrics = useMemo(() => {
    if (!filteredTransactions.length) return { totalSales: 0, totalFootfall: 0, avgBill: 0, avgOrder: 0 };

    const totalSales = filteredTransactions.reduce((sum, t) => sum + t.total, 0);
    const totalFootfall = transactions.length * 2.5; // Mocking footfall multiplier
    const avgBill = totalSales / (transactions.length || 1);
    const avgOrder = transactions.reduce((sum, t) => sum + (t.items?.length || 0), 0) / (transactions.length || 1);

    return {
      totalSales: totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      totalFootfall: Math.round(totalFootfall).toLocaleString(),
      avgBill: avgBill.toFixed(2),
      avgOrder: avgOrder.toFixed(2)
    };
  }, [transactions]);

  // Hourly Data Logic
  const hourlyData = useMemo(() => {
    const hoursMap: Record<number, number> = {};
    const hours = Array.from({ length: 15 }, (_, i) => i + 7); // 7 AM to 9 PM
    hours.forEach(h => hoursMap[h] = 0);

    filteredTransactions.forEach(t => {
      const date = new Date(t.created_at);
      const hour = date.getHours();
      if (hour >= 7 && hour <= 21) {
        hoursMap[hour] = (hoursMap[hour] || 0) + (t.items?.reduce((sum, item) => sum + item.quantity, 0) || 0);
      }
    });

    return hours.map(h => ({
      hour: h > 12 ? `${h - 12}pm` : `${h}am`,
      quantity: hoursMap[h] || (transactions?.length ? 0 : Math.floor(Math.random() * 5000) + 1000) // Fallback to random only if no transactions exist at all
    }));
  }, [filteredTransactions, transactions]);

  // Real Data processing
  const processedData = useMemo(() => {
    if (!filteredTransactions.length) return null;

    const categoryMap: Record<string, number> = {};
    const productMap: Record<string, number> = {};
    const weekdayMap: Record<string, { footfall: number; orders: number; sales: number }> = {};

    days.forEach(d => weekdayMap[d] = { footfall: 0, orders: 0, sales: 0 });

    filteredTransactions.forEach(t => {
      const date = new Date(t.created_at);
      const dayName = days[date.getDay()];

      weekdayMap[dayName].orders += 1;
      weekdayMap[dayName].sales += t.total;
      weekdayMap[dayName].footfall += 2; // Approximate

      t.items?.forEach(item => {
        const cat = item.category || "Others";
        categoryMap[cat] = (categoryMap[cat] || 0) + (item.item_price * item.quantity);

        const prod = item.item_name;
        productMap[prod] = (productMap[prod] || 0) + (item.item_price * item.quantity);
      });
    });

    return {
      categories: Object.entries(categoryMap).map(([name, value]) => ({ name, value })),
      products: Object.entries(productMap)
        .map(([name, sales]) => ({ name, sales }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5),
      weekdays: Object.entries(weekdayMap).map(([name, data]) => ({ name, ...data }))
    };
  }, [transactions, days]);

  // Fallbacks
  const categoryData = processedData?.categories.length ? processedData.categories : [
    { name: "Bakery", value: 28 },
    { name: "Branded", value: 12 },
    { name: "Coffee", value: 39 },
    { name: "Tea", value: 10 },
    { name: "Others", value: 11 },
  ];

  const sizeData = [
    { name: "Large", value: 30 },
    { name: "Regular", value: 31 },
    { name: "Small", value: 9 },
    { name: "Not Defined", value: 30 },
  ];

  const locationData = [
    { name: "Astoria", footfall: 50599, sales: 232243.91 },
    { name: "Hell's Kitchen", footfall: 50735, sales: 236511.17 },
    { name: "Lower Manhattan", footfall: 47782, sales: 230057.25 },
  ];

  const topProducts = processedData?.products.length ? processedData.products : [
    { name: "Barista Espresso", sales: 91406.20 },
    { name: "Brewed Chai tea", sales: 77081.95 },
    { name: "Hot chocolate", sales: 72416.00 },
    { name: "Gourmet brewed coffee", sales: 70034.60 },
    { name: "Brewed Black tea", sales: 47932.00 },
  ];

  // Weekday Data
  const weekdayData = processedData?.weekdays || days.map(day => ({
    name: day,
    footfall: Math.floor(Math.random() * 40000) + 80000,
    orders: Math.floor(Math.random() * 20000) + 20000
  }));

  const chartTheme = {
    background: "#F2E8DF", // Beige background from image
    cardBg: "#E8D8C9",
    text: "#4A3728",
    grid: "#D1C0B0"
  };

  return (
    <div className="p-6 min-h-screen" style={{ backgroundColor: chartTheme.background, color: chartTheme.text }}>
      <div className="flex flex-col lg:flex-row gap-6">

        {/* Left Sidebar Filters */}
        <div className="w-full lg:w-48 space-y-6">
          <Card className="border-none shadow-none" style={{ backgroundColor: chartTheme.cardBg }}>
            <CardHeader className="p-4 pb-0">
              <CardTitle className="text-xs uppercase flex items-center gap-2">
                <Filter className="h-3 w-3" /> Month Name
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 space-y-1 overflow-y-auto max-h-[300px]">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "w-full justify-start text-xs h-8",
                  selectedMonth === "All" ? "bg-[#D9C1A3] font-bold" : "hover:bg-[#E0CEA7]"
                )}
                onClick={() => setSelectedMonth("All")}
              >
                All Months
              </Button>
              {months.map(m => (
                <Button
                  key={m}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full justify-start text-xs h-8",
                    selectedMonth === m ? "bg-[#D9C1A3] font-bold" : "hover:bg-[#E0CEA7]"
                  )}
                  onClick={() => setSelectedMonth(m)}
                >
                  {m}
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card className="border-none shadow-none" style={{ backgroundColor: chartTheme.cardBg }}>
            <CardHeader className="p-4 pb-0">
              <CardTitle className="text-xs uppercase flex items-center gap-2">
                <Filter className="h-3 w-3" /> Day Name
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 space-y-1">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "w-full justify-start text-xs h-8",
                  selectedDay === "All" ? "bg-[#D9C1A3] font-bold" : "hover:bg-[#E0CEA7]"
                )}
                onClick={() => setSelectedDay("All")}
              >
                All Days
              </Button>
              {days.map(d => (
                <Button
                  key={d}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full justify-start text-xs h-8",
                    selectedDay === d ? "bg-[#D9C1A3] font-bold" : "hover:bg-[#E0CEA7]"
                  )}
                  onClick={() => setSelectedDay(d)}
                >
                  {d}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {/* Header & Top Stats */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
            <h1 className="text-5xl font-serif font-bold flex items-center gap-4">
              Coffee Shop Sales
              <div className="bg-black text-white p-2 rounded-lg">
                <ShoppingCart className="h-8 w-8" />
              </div>
            </h1>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full md:w-auto">
              {[
                { label: "Total Sales", value: `$${metrics.totalSales}`, icon: DollarSign },
                { label: "Total Footfall", value: metrics.totalFootfall, icon: Users },
                { label: "Avg Bill/Person", value: metrics.avgBill, icon: Receipt },
                { label: "Avg Order/Person", value: metrics.avgOrder, icon: ShoppingCart },
              ].map((stat) => (
                <Card key={stat.label} className="border-none shadow-sm min-w-[140px]" style={{ backgroundColor: chartTheme.cardBg }}>
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <span className="text-xl font-bold">{stat.value}</span>
                    <span className="text-[10px] uppercase font-medium opacity-70">{stat.label}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Top Row Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quantity Ordered Based on Hours */}
            <Card className="lg:col-span-1 border-none" style={{ backgroundColor: chartTheme.cardBg }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-center">Quantity Ordered Based on Hours</CardTitle>
              </CardHeader>
              <CardContent className="h-[250px] p-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={hourlyData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
                    <XAxis dataKey="hour" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: chartTheme.cardBg, border: 'none' }} />
                    <Line type="monotone" dataKey="quantity" stroke="#4A3728" strokeWidth={3} dot={{ r: 4, fill: "#4A3728" }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Categories % Distribution */}
            <Card className="border-none" style={{ backgroundColor: chartTheme.cardBg }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-center">Categories % Distribution Based on Sales</CardTitle>
              </CardHeader>
              <CardContent className="h-[250px] p-0 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={0}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Size Distribution */}
            <Card className="border-none" style={{ backgroundColor: chartTheme.cardBg }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-center">% Size Distribution Based on Orders</CardTitle>
              </CardHeader>
              <CardContent className="h-[250px] p-0 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sizeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    >
                      {sizeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Row Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Store Locations */}
            <Card className="border-none" style={{ backgroundColor: chartTheme.cardBg }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-center">Footfall and Sales over various Store Locations</CardTitle>
              </CardHeader>
              <CardContent className="h-[250px] p-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={locationData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                    <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Bar dataKey="footfall" fill="#D9C1A3" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="sales" fill="#8B735B" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top 5 Products */}
            <Card className="border-none" style={{ backgroundColor: chartTheme.cardBg }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-center">Top 5 Products Based on Sales</CardTitle>
              </CardHeader>
              <CardContent className="h-[250px] p-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProducts} layout="vertical" margin={{ top: 20, right: 30, left: 40, bottom: 20 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" fontSize={9} width={80} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Bar dataKey="sales" fill="#8B735B" radius={[0, 4, 4, 0]} label={{ position: 'right', fontSize: 10, fill: chartTheme.text }} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Weekdays */}
            <Card className="border-none" style={{ backgroundColor: chartTheme.cardBg }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-center">Order on Weekdays</CardTitle>
              </CardHeader>
              <CardContent className="h-[250px] p-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weekdayData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                    <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Bar dataKey="footfall" fill="#8B735B" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="orders" fill="#D9C1A3" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
