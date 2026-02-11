import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  TrendingUp
} from "lucide-react";
import { Link } from "react-router-dom";
import { usePOSTransactions, usePOSTables } from "@/hooks/usePOS";
import { useMemo } from "react";
import { format, startOfDay } from "date-fns";

const POSDashboard = () => {
  const today = format(startOfDay(new Date()), "yyyy-MM-dd");
  const { data: transactions = [], isLoading: loadingTx } = usePOSTransactions({
    startDate: today,
  });
  const { data: tables = [], isLoading: loadingTables } = usePOSTables();

  const stats = useMemo(() => {
    const revenue = transactions.reduce((sum, t) => sum + t.total, 0);
    const activeTables = tables.filter(t => t.status !== "available").length;
    const totalOrders = transactions.length;

    return {
      revenue,
      activeTables,
      totalOrders,
    };
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
    <MainLayout title="POS Dashboard" subtitle="Overview and management of point of sale operations">
      <div className="space-y-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card variant="elevated">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Today's Revenue</p>
                  <h3 className="text-2xl font-bold mt-1">
                    {loadingTx ? "..." : `$${stats.revenue.toFixed(2)}`}
                  </h3>
                </div>
                <div className="p-3 rounded-full bg-success/10">
                  <DollarSign className="h-6 w-6 text-success" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs text-success">
                <TrendingUp className="h-3 w-3 mr-1" />
                <span>Live updates</span>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Tables</p>
                  <h3 className="text-2xl font-bold mt-1">
                    {loadingTables ? "..." : stats.activeTables}
                  </h3>
                </div>
                <div className="p-3 rounded-full bg-primary/10">
                  <Utensils className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs text-muted-foreground">
                <Users className="h-3 w-3 mr-1" />
                <span>Total tables: {tables.length}</span>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Orders Today</p>
                  <h3 className="text-2xl font-bold mt-1">
                    {loadingTx ? "..." : stats.totalOrders}
                  </h3>
                </div>
                <div className="p-3 rounded-full bg-amber-500/10">
                  <Clock className="h-6 w-6 text-amber-500" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs text-muted-foreground">
                <ShoppingCart className="h-3 w-3 mr-1" />
                <span>Last order: {transactions.length > 0 ? format(new Date(transactions[0].created_at), "HH:mm") : "None"}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Grid */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Quick Actions</h2>
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

        {/* Recent Transactions Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Latest orders processed today</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingTx ? (
              <p className="text-center py-4 text-muted-foreground">Loading transactions...</p>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No transactions today</p>
                <Button variant="outline" className="mt-4" asChild>
                  <Link to="/pos/terminal">Open Terminal</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.slice(0, 5).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-background">
                        <DollarSign className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{tx.transaction_number}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(tx.created_at), "HH:mm")} • Table {tx.table_number}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">${tx.total.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground capitalize">{tx.payment_method}</p>
                    </div>
                  </div>
                ))}
                <Button variant="ghost" className="w-full text-muted-foreground" asChild>
                  <Link to="/pos/history">View all transactions</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default POSDashboard;
