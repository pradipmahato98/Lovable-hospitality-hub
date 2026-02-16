import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Download,
  Calendar,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function BudgetForecastReportingService({ isReadOnly }: { isReadOnly?: boolean }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-display flex items-center gap-2">
            <PieChart className="h-5 w-5 text-primary" /> Budget vs. Actual Analysis
          </h2>
          <p className="text-muted-foreground text-sm">Strategic financial insights and forecasting accuracy reports.</p>
        </div>
        <Button className="gap-2">
          <Download className="h-4 w-4" /> Export Analytics
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Variance Trends (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent className="h-[200px] flex items-end justify-between gap-2 pt-4">
             {[45, 65, 32, 85, 54, 72].map((height, i) => (
               <div key={i} className="flex-1 bg-primary/20 rounded-t-sm relative group cursor-pointer hover:bg-primary/30 transition-colors" style={{ height: `${height}%` }}>
                  <div className="absolute inset-x-0 bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-center">
                    {height}%
                  </div>
               </div>
             ))}
          </CardContent>
          <div className="px-6 pb-4 flex justify-between text-[10px] text-muted-foreground uppercase">
             <span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span><span>Jan</span><span>Feb</span>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Forecasting Accuracy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Historical Variance Avg.</span>
                <span className="text-sm font-bold">3.2%</span>
             </div>
             <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                <div className="bg-success h-full" style={{ width: '96.8%' }} />
             </div>
             <p className="text-[10px] text-muted-foreground">High accuracy achieved in the last 4 quarters.</p>

             <div className="pt-4 border-t space-y-2">
                <div className="flex items-center justify-between p-2 rounded bg-secondary/30">
                   <div className="flex items-center gap-2">
                      <TrendingUp className="h-3.5 w-3.5 text-success" />
                      <span className="text-xs">Optimistic Forecast (Q2)</span>
                   </div>
                   <ArrowUpRight className="h-3 w-3 text-muted-foreground" />
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-secondary/30">
                   <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs">Fiscal Year Close Projection</span>
                   </div>
                   <ChevronRight className="h-3 w-3 text-muted-foreground" />
                </div>
             </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="bg-success/5 border-success/10">
            <CardHeader className="pb-2">
               <CardTitle className="text-xs uppercase text-muted-foreground">Actual vs. Budget</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="text-2xl font-bold text-success">$1,245K / $1,280K</div>
               <p className="text-[10px] text-muted-foreground mt-1">YTD Operating Expenses</p>
            </CardContent>
         </Card>
         <Card className="bg-primary/5 border-primary/10">
            <CardHeader className="pb-2">
               <CardTitle className="text-xs uppercase text-muted-foreground">Forecasted Revenue</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="text-2xl font-bold text-primary">$3.5M</div>
               <p className="text-[10px] text-muted-foreground mt-1">Projected end-of-year revenue</p>
            </CardContent>
         </Card>
         <Card className="bg-amber-500/5 border-amber-500/10">
            <CardHeader className="pb-2">
               <CardTitle className="text-xs uppercase text-muted-foreground">Budget Revisions</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="text-2xl font-bold text-amber-500">4</div>
               <p className="text-[10px] text-muted-foreground mt-1">Pending approval this month</p>
            </CardContent>
         </Card>
      </div>
    </div>
  );
}
