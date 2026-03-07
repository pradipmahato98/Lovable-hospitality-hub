import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

interface ReportsTabProps {
  reportData: any[];
  stats: any;
}

export const ReportsTab = ({
  reportData,
  stats
}: ReportsTabProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="shadow-sm border-t-4 border-t-amber-500">
        <CardHeader><CardTitle className="text-lg">Inventory Valuation Trend</CardTitle><CardDescription>30-day cumulative value</CardDescription></CardHeader>
        <CardContent className="h-[300px]">
          {reportData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={reportData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} interval={4} />
                <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                <Line type="monotone" dataKey="value" name="Value" stroke="#EAB308" strokeWidth={3} dot={{ r: 0 }} activeDot={{ r: 4 }} animationDuration={1000} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground italic">Insufficient data for trend analysis</div>
          )}
        </CardContent>
      </Card>
      <Card className="shadow-sm border-t-4 border-t-primary">
        <CardHeader><CardTitle className="text-lg">Value by Category</CardTitle><CardDescription>Total value distribution</CardDescription></CardHeader>
        <CardContent className="h-[300px]">
          {Object.keys(stats.categoryDistribution || {}).length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={Object.entries(stats.categoryDistribution || {}).map(([name, value]) => ({ name, value }))} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value" labelLine={false} animationDuration={1000}>
                  {Object.entries(stats.categoryDistribution || {}).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={[`#EAB308`, `#3B82F6`, `#10B981`, `#F59E0B`, `#6366F1`, `#EC4899`][index % 6]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(v: number) => [`$${v.toLocaleString()}`, "Value"]} contentStyle={{ borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground italic">No category data available</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
