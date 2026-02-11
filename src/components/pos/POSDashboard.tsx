import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  TrendingUp
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePOSTransactions } from "@/hooks/usePOS";
import { format } from "date-fns";

export function POSDashboard() {
  const navigate = useNavigate();
  const { data: transactions } = usePOSTransactions();

  const totalSales = transactions?.reduce((sum, t) => sum + t.total, 0) || 0;
  const todaySales = transactions?.filter(t =>
    new Date(t.created_at).toDateString() === new Date().toDateString()
  ).reduce((sum, t) => sum + t.total, 0) || 0;

  const stats = [
    { label: "Today's Sales", value: `$${todaySales.toFixed(2)}`, icon: DollarSign, color: "text-success" },
    { label: "Total Transactions", value: transactions?.length || 0, icon: TrendingUp, color: "text-primary" },
    { label: "Active Tables", value: "4/12", icon: Utensils, color: "text-amber-500" },
    { label: "Staff on Shift", value: "6", icon: Clock, color: "text-blue-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} variant="elevated">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                </div>
                <div className={`h-12 w-12 rounded-full bg-secondary/50 flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card variant="highlight" className="cursor-pointer group" onClick={() => navigate("/pos/terminal")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-6 w-6 text-primary" />
              Terminal
            </CardTitle>
            <CardDescription>Open POS terminal for new orders</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full gap-2">
              New Transaction
              <Plus className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card variant="elevated" className="cursor-pointer group" onClick={() => navigate("/pos/kitchen")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChefHat className="h-6 w-6 text-amber-500" />
              Kitchen Display
            </CardTitle>
            <CardDescription>Manage active orders and prep status</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full gap-2">
              View KDS
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card variant="elevated" className="cursor-pointer group" onClick={() => navigate("/pos/reports")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-blue-500" />
              Reports
            </CardTitle>
            <CardDescription>Sales analytics and performance data</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full gap-2">
              View Analytics
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card variant="elevated">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Recent Transactions
              </CardTitle>
              <CardDescription>Last 5 completed sales</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/pos/history")}>View All</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactions?.slice(0, 5).map((t) => (
              <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{t.transaction_number}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(t.created_at), "MMM d, HH:mm")}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm">${t.total.toFixed(2)}</p>
                  <Badge variant="outline" className="text-[10px] h-4">{t.payment_method}</Badge>
                </div>
              </div>
            ))}
            {(!transactions || transactions.length === 0) && (
              <p className="text-center text-muted-foreground py-8 text-sm">No transactions yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
