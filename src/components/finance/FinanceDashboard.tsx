import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Scale,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieChartIcon,
  Activity,
  Calendar,
  Wallet
} from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from "recharts";
import { useAccounts, useJournalEntries, useTrialBalance } from "@/hooks/useFinance";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";

interface FinanceDashboardProps {
  accountId?: string | null;
}

export function FinanceDashboard({ accountId }: FinanceDashboardProps) {
  const { data: accounts = [], isLoading: accountsLoading } = useAccounts();
  const { data: journalEntries = [], isLoading: entriesLoading } = useJournalEntries();
  const { data: trialBalance = [], isLoading: trialBalanceLoading } = useTrialBalance();

  const isLoading = accountsLoading || entriesLoading || trialBalanceLoading;

  const selectedAccount = useMemo(() =>
    accountId ? accounts?.find(a => a.id === accountId) : null
  , [accountId, accounts]);

  // Calculate Metrics
  const metrics = useMemo(() => {
    if (accountId && selectedAccount) {
      const accountTrial = trialBalance?.find(t => t.account.id === accountId);
      const isDebitNormal = ["asset", "expense"].includes(selectedAccount.type);
      const balance = accountTrial
        ? (isDebitNormal ? accountTrial.totalDebit - accountTrial.totalCredit : accountTrial.totalCredit - accountTrial.totalDebit)
        : 0;

      const filteredEntries = journalEntries.filter(entry =>
        entry.lines?.some(line => line.account_id === accountId)
      ).slice(0, 5);

      return {
        revenue: selectedAccount.type === "revenue" ? balance : 0,
        expenses: selectedAccount.type === "expense" ? balance : 0,
        balance,
        netIncome: 0, // Not applicable for single account usually
        assets: selectedAccount.type === "asset" ? balance : 0,
        liabilities: selectedAccount.type === "liability" ? balance : 0,
        isBalanced: true,
        totalAccounts: 1,
        recentEntries: filteredEntries
      };
    }

    const totalDebits = trialBalance.reduce((sum, t) => sum + t.totalDebit, 0);
    const totalCredits = trialBalance.reduce((sum, t) => sum + t.totalCredit, 0);
    const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

    let revenue = 0;
    let expenses = 0;
    let assets = 0;
    let liabilities = 0;

    (trialBalance || []).forEach((item) => {
      if (!item || !item.account) return;
      if (item.account.type === "revenue") {
        revenue += ((item.totalCredit || 0) - (item.totalDebit || 0));
      } else if (item.account.type === "expense") {
        expenses += ((item.totalDebit || 0) - (item.totalCredit || 0));
      } else if (item.account.type === "asset") {
        assets += ((item.totalDebit || 0) - (item.totalCredit || 0));
      } else if (item.account.type === "liability") {
        liabilities += ((item.totalCredit || 0) - (item.totalDebit || 0));
      }
    });

    const netIncome = revenue - expenses;

    return {
      revenue,
      expenses,
      netIncome,
      assets,
      liabilities,
      isBalanced,
      totalAccounts: (accounts || []).length,
      recentEntries: (journalEntries || []).slice(0, 5)
    };
  }, [accounts, journalEntries, trialBalance, accountId, selectedAccount]);

  // Chart Data - Revenue vs Expenses for last 6 months
  const chartData = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(new Date(), 5 - i);
      return {
        month: format(date, "MMM"),
        start: startOfMonth(date),
        end: endOfMonth(date),
        revenue: 0,
        expenses: 0
      };
    });

    // Aggregate actual data from journalEntries
    (journalEntries || []).forEach(entry => {
      if (!entry || !entry.is_posted) return;

      const entryDate = new Date(entry.date);
      months.forEach(m => {
        if (isWithinInterval(entryDate, { start: m.start, end: m.end })) {
          (entry.lines || []).forEach(line => {
            const account = (accounts || []).find(a => a.id === line.account_id);
            if (account?.type === "revenue") {
              m.revenue += (line.credit - line.debit);
            } else if (account?.type === "expense") {
              m.expenses += (line.debit - line.credit);
            }
          });
        }
      });
    });

    return months;
  }, [journalEntries, accounts]);

  // Account distribution for pie chart (simulated with BarChart for now as it's cleaner)
  const accountDistribution = useMemo(() => {
    const dist = {
      asset: 0,
      liability: 0,
      equity: 0,
      revenue: 0,
      expense: 0
    };

    (trialBalance || []).forEach(item => {
      if (!item || !item.account) return;
      const type = item.account.type;
      if (!type || !dist.hasOwnProperty(type)) return;
      const amount = type === "asset" || type === "expense"
        ? Math.max(0, (item.totalDebit || 0) - (item.totalCredit || 0))
        : Math.max(0, (item.totalCredit || 0) - (item.totalDebit || 0));
      dist[type] += amount;
    });

    return Object.entries(dist).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value
    }));
  }, [trialBalance]);

  const COLORS = ["#EAB308", "#3B82F6", "#A855F7", "#22C55E", "#EF4444"];

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="h-32 bg-secondary/20" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 h-[400px] bg-secondary/20" />
          <Card className="h-[400px] bg-secondary/20" />
        </div>
        <Card className="h-64 bg-secondary/20" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {accountId && selectedAccount && (
        <div className="flex items-center gap-4 mb-2">
          <Badge className="bg-gold hover:bg-gold/80 text-navy px-3 py-1 text-sm font-semibold">
            Account: {selectedAccount.code} - {selectedAccount.name}
          </Badge>
          <Badge variant="outline" className="capitalize">
            Type: {selectedAccount.type}
          </Badge>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {accountId ? (
          <>
            <MetricCard
              title="Current Balance"
              value={`$${(metrics.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
              change="Total account balance"
              changeType="neutral"
              icon={DollarSign}
            />
            <MetricCard
              title="Account Type"
              value={selectedAccount?.type?.toUpperCase() || ""}
              change="Normal balance side"
              changeType="neutral"
              icon={Scale}
            />
            <MetricCard
              title="Activity"
              value={metrics.recentEntries.length.toString()}
              change="Recent transactions"
              changeType="neutral"
              icon={Activity}
            />
            <MetricCard
              title="Status"
              value={selectedAccount?.is_active ? "Active" : "Inactive"}
              change="System account status"
              changeType={selectedAccount?.is_active ? "positive" : "negative"}
              icon={Calendar}
            />
          </>
        ) : (
          <>
            <MetricCard
              title="Net Income"
              value={`$${metrics.netIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
              change={`${((metrics.netIncome / (metrics.revenue || 1)) * 100).toFixed(1)}% margin`}
              changeType={metrics.netIncome >= 0 ? "positive" : "negative"}
              icon={DollarSign}
            />
            <MetricCard
              title="Total Assets"
              value={`$${metrics.assets.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
              change="Current liquidity"
              changeType="neutral"
              icon={Wallet}
            />
            <MetricCard
              title="Total Liabilities"
              value={`$${metrics.liabilities.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
              change="Outstanding debt"
              changeType="neutral"
              icon={Scale}
            />
            <MetricCard
              title="Accounts"
              value={metrics.totalAccounts.toString()}
              change={`${accounts.filter(a => a.is_active).length} Active`}
              changeType="positive"
              icon={Activity}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-gold" />
              Revenue vs Expenses
            </CardTitle>
            <CardDescription>Performance overview for the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="month"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                    itemStyle={{ fontSize: "12px" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#22C55E"
                    fillOpacity={1}
                    fill="url(#colorRev)"
                    name="Revenue"
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    stroke="#EF4444"
                    fillOpacity={1}
                    fill="url(#colorExp)"
                    name="Expenses"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Account Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-gold" />
              Account Balance Distribution
            </CardTitle>
            <CardDescription>By account category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={accountDistribution} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    width={80}
                  />
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {accountDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Latest posted journal entries</CardDescription>
          </div>
          <Badge variant={metrics.isBalanced ? "success" : "destructive"} className="gap-1">
            {metrics.isBalanced ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {metrics.isBalanced ? "Balanced" : "Unbalanced"}
          </Badge>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entry #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metrics.recentEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No transactions found
                  </TableCell>
                </TableRow>
              ) : (
                metrics.recentEntries.map((entry) => {
                  const totalAmount = entry.lines?.reduce((sum, l) => sum + (l.debit || 0), 0) || 0;
                  return (
                    <TableRow key={entry.id}>
                      <TableCell className="font-mono text-primary">{entry.entry_number}</TableCell>
                      <TableCell>{entry.date}</TableCell>
                      <TableCell>{entry.description}</TableCell>
                      <TableCell className="text-right font-mono">${totalAmount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={entry.is_posted ? "success" : "outline"}>
                          {entry.is_posted ? "Posted" : "Draft"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
