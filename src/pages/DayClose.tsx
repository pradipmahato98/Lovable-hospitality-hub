import { useState } from "react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  DollarSign,
  BarChart3,
  TrendingUp,
  Lock,
  Unlock,
  Receipt,
  Utensils,
  Bed,
  Sparkles,
  ChevronRight,
  Printer
} from "lucide-react";
import { toast } from "sonner";
import { useNightAudit } from "@/hooks/useNightAudit";
import { format, parseISO } from "date-fns";

const departmentRevenue = [
  { id: 1, name: "Rooms & Lodging", code: "ROOM", amount: 4250.00, transactions: 45, icon: Bed, color: "text-blue-500" },
  { id: 2, name: "Restaurant (POS)", code: "REST", amount: 1280.50, transactions: 82, icon: Utensils, color: "text-orange-500" },
  { id: 3, name: "Spa & Wellness", code: "SPA", amount: 650.00, transactions: 12, icon: Sparkles, color: "text-purple-500" },
  { id: 4, name: "Minibar & Other", code: "MISC", amount: 245.25, transactions: 28, icon: Receipt, color: "text-green-500" },
];

export default function DayClose() {
  const { businessDate } = useNightAudit();
  const [isClosed, setIsClosed] = useState(false);

  const handleCloseDay = () => {
    setIsClosed(true);
    toast.success("Day has been successfully balanced and closed for accounting.");
  };

  const totalRevenue = departmentRevenue.reduce((sum, dept) => sum + dept.amount, 0);

  return (
    <MainLayout title="Day Close" subtitle="Financial balancing and department reconciliation">
      <div className="space-y-6">

        {/* Status Card */}
        <Card className={cn("border-l-4 transition-all", isClosed ? "border-l-success" : "border-l-amber-500")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2">
                {isClosed ? <Lock className="h-5 w-5 text-success" /> : <Unlock className="h-5 w-5 text-amber-500" />}
                Accounting Status: {isClosed ? "Closed" : "Open"}
              </CardTitle>
              <CardDescription>
                Business Date: {businessDate ? format(parseISO(businessDate), "PP") : "---"}
              </CardDescription>
            </div>
            {isClosed ? (
              <Button variant="outline" onClick={() => window.print()} className="gap-2">
                <Printer className="h-4 w-4" /> Print Daily Summary
              </Button>
            ) : (
              <Button onClick={handleCloseDay} className="gap-2 bg-amber-600 hover:bg-amber-700">
                <Lock className="h-4 w-4" /> Finalize & Balance Day
              </Button>
            )}
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Revenue Summary */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Department Revenue Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Department</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead className="text-right">Transactions</TableHead>
                    <TableHead className="text-right">Total Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departmentRevenue.map((dept) => (
                    <TableRow key={dept.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={cn("p-2 rounded-lg bg-secondary/50", dept.color)}>
                            <dept.icon className="h-4 w-4" />
                          </div>
                          <span className="font-medium">{dept.name}</span>
                        </div>
                      </TableCell>
                      <TableCell><code className="text-xs">{dept.code}</code></TableCell>
                      <TableCell className="text-right">{dept.transactions}</TableCell>
                      <TableCell className="text-right font-mono font-bold">${dept.amount.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-secondary/30 font-bold">
                    <TableCell colSpan={3} className="text-right uppercase text-xs tracking-wider opacity-60">Total Daily Revenue</TableCell>
                    <TableCell className="text-right text-lg text-primary font-display">${totalRevenue.toLocaleString()}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Quick Metrics */}
          <div className="space-y-6">
            <Card variant="elevated">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">ADR (Avg Daily Rate)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">$142.50</p>
                <div className="flex items-center text-xs text-success mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  <span>+5.2% from yesterday</span>
                </div>
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">RevPAR</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">$124.80</p>
                <div className="flex items-center text-xs text-success mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  <span>+2.1% from target</span>
                </div>
              </CardContent>
            </Card>

            <Card variant="glass" className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary">Pre-Audit Checklist</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {[
                    "All POS terminals closed",
                    "Cash drawers reconciled",
                    "External credit cards settled",
                    "Room charges posted"
                  ].map((task, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <div className="h-4 w-4 rounded-full border border-primary/30 flex items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      </div>
                      {task}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Activity Logs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Day Close Activity History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { date: "Dec 19, 2024", user: "Admin User", revenue: "$5,820.00", status: "Closed" },
                { date: "Dec 18, 2024", user: "Manager One", revenue: "$6,140.50", status: "Closed" },
                { date: "Dec 17, 2024", user: "Admin User", revenue: "$5,400.00", status: "Closed" },
              ].map((log, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-lg border bg-secondary/20 hover:bg-secondary/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-background flex items-center justify-center border">
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{log.date}</p>
                      <p className="text-xs text-muted-foreground">Performed by {log.user}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{log.revenue}</p>
                    <Badge variant="outline" className="bg-success/10 text-success border-success/20">SUCCESS</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </MainLayout>
  );
}
