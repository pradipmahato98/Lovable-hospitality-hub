import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TrendingUp,
  BarChart3,
  Plus,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BudgetExecutionServiceProps {
  isReadOnly?: boolean;
}

export function BudgetExecutionService({ isReadOnly }: BudgetExecutionServiceProps) {
  const departmentalBudgets = [
    { dept: 'Rooms Division', budget: 120000, actual: 115000, variance: 5000, status: 'Under' },
    { dept: 'Food & Beverage', budget: 85000, actual: 92000, variance: -7000, status: 'Over' },
    { dept: 'Marketing', budget: 15000, actual: 12500, variance: 2500, status: 'Under' },
    { dept: 'Maintenance', budget: 22000, actual: 24500, variance: -2500, status: 'Over' },
    { dept: 'Administration', budget: 18000, actual: 17800, variance: 200, status: 'Under' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" /> Budget Execution
          </h2>
          <p className="text-muted-foreground text-sm">Monitor real-time variance, record revisions, and track departmental spending.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" /> Run Forecast
           </Button>
           {!isReadOnly && (
             <Button className="gap-2">
               <Plus className="h-4 w-4" /> Revised Budget
             </Button>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-muted-foreground">Period Performance</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
             <div>
                <h3 className="text-2xl font-bold font-display text-success">-2.4%</h3>
                <p className="text-[10px] text-muted-foreground">Under budget overall</p>
             </div>
             <div className="p-2 bg-success/10 rounded-full">
                <ArrowDownRight className="h-5 w-5 text-success" />
             </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-muted-foreground">Critical Variance</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
             <div>
                <h3 className="text-2xl font-bold font-display text-destructive">+$7,000</h3>
                <p className="text-[10px] text-muted-foreground">F&B Cost Overrun</p>
             </div>
             <div className="p-2 bg-destructive/10 rounded-full">
                <AlertCircle className="h-5 w-5 text-destructive" />
             </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-muted-foreground">Utilization</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
             <div>
                <h3 className="text-2xl font-bold font-display">84.2%</h3>
                <p className="text-[10px] text-muted-foreground">Budget used to date</p>
             </div>
             <div className="p-2 bg-primary/10 rounded-full">
                <BarChart3 className="h-5 w-5 text-primary" />
             </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <div>
            <CardTitle>Departmental Variance Log</CardTitle>
            <CardDescription>Comparison of budgeted vs actual operational spend</CardDescription>
          </div>
          <Button variant="ghost" size="sm" className="h-8">
            Filter Month <ChevronDown className="h-3 w-3 ml-1" />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Department</TableHead>
                <TableHead className="text-right">Budgeted</TableHead>
                <TableHead className="text-right">Actual</TableHead>
                <TableHead className="text-right">Variance</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departmentalBudgets.map((item) => (
                <TableRow key={item.dept}>
                  <TableCell className="font-medium text-sm">{item.dept}</TableCell>
                  <TableCell className="text-right font-mono text-xs">${item.budget.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono text-xs">${item.actual.toLocaleString()}</TableCell>
                  <TableCell className={cn(
                    "text-right font-mono text-xs font-bold",
                    item.variance >= 0 ? "text-success" : "text-destructive"
                  )}>
                    {item.variance >= 0 ? '+' : ''}${item.variance.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className={cn(
                      "text-[10px] uppercase font-bold px-1.5 h-5",
                      item.status === 'Under' ? "text-success border-success/20 bg-success/5" : "text-destructive border-destructive/20 bg-destructive/5"
                    )}>
                      {item.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
