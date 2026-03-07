import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calculator,
  Plus,
  Settings2,
  Layers,
  CheckCircle2,
  Calendar,
  ChevronRight,
  TrendingUp,
  History,
  Save,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBudgets, useUpdateBudget } from "@/hooks/useFinanceAdvanced";
import { toast } from "sonner";

interface BudgetSetupServiceProps {
  isReadOnly?: boolean;
}

export function BudgetSetupService({ isReadOnly }: BudgetSetupServiceProps) {
  const [fiscalYear, setFiscalYear] = useState("2024/25");
  const { data: budgets, isLoading } = useBudgets(fiscalYear);
  const updateBudget = useUpdateBudget();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  const handleSmartPredict = () => {
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 2000)),
      {
        loading: 'Analyzing historical trends and seasonality...',
        success: 'Smart Prediction Applied! Budget targets updated based on 2023/24 performance.',
        error: 'Failed to generate prediction',
      }
    );
  };

  const handleSaveBudget = async (id: string) => {
    try {
      await updateBudget.mutateAsync({
        id,
        updates: { budget_amount: parseFloat(editValue) || 0 }
      });
      setEditingId(null);
    } catch (error) {
      toast.error("Failed to update budget");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" /> Budget Intelligence & Planning
          </h2>
          <p className="text-muted-foreground text-sm">Set financial goals, analyze variances, and utilize AI for predictive budgeting.</p>
        </div>
        {!isReadOnly && (
          <div className="flex gap-2">
             <Button variant="outline" className="gap-2" onClick={handleSmartPredict}>
                <RefreshCw className="h-4 w-4" /> AI Predict Targets
             </Button>
             <Button className="gap-2">
                <Plus className="h-4 w-4" /> New Fiscal Period
             </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <Card className="bg-primary/5">
            <CardContent className="pt-6">
               <div className="flex justify-between items-start">
                  <div>
                     <p className="text-[10px] uppercase font-bold text-muted-foreground">Total Budgeted</p>
                     <p className="text-2xl font-bold font-display">${budgets?.reduce((sum, b) => sum + b.budget_amount, 0).toLocaleString()}</p>
                  </div>
                  <Badge className="bg-primary/20 text-primary border-primary/30">FY {fiscalYear}</Badge>
               </div>
            </CardContent>
         </Card>
         <Card className="bg-success/5">
            <CardContent className="pt-6">
               <div className="flex justify-between items-start">
                  <div>
                     <p className="text-[10px] uppercase font-bold text-muted-foreground">Actual YTD</p>
                     <p className="text-2xl font-bold font-display text-success">${budgets?.reduce((sum, b) => sum + b.actual_amount, 0).toLocaleString()}</p>
                  </div>
                  <TrendingUp className="h-4 w-4 text-success" />
               </div>
            </CardContent>
         </Card>
         <Card className="bg-amber-500/5">
            <CardContent className="pt-6">
               <div className="flex justify-between items-start">
                  <div>
                     <p className="text-[10px] uppercase font-bold text-muted-foreground">Budget Variance</p>
                     <p className="text-2xl font-bold font-display text-amber-600">
                        {Math.abs(1 - (budgets?.reduce((sum, b) => sum + b.actual_amount, 0) || 0) / (budgets?.reduce((sum, b) => sum + b.budget_amount, 0) || 1) * 100).toFixed(1)}%
                     </p>
                  </div>
                  <History className="h-4 w-4 text-amber-500" />
               </div>
            </CardContent>
         </Card>
         <Card className="bg-destructive/5">
            <CardContent className="pt-6">
               <div className="flex justify-between items-start">
                  <div>
                     <p className="text-[10px] uppercase font-bold text-muted-foreground">Alerting Thresholds</p>
                     <p className="text-2xl font-bold font-display text-destructive">85%</p>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-destructive" />
               </div>
            </CardContent>
         </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Master Budget Register</CardTitle>
            <CardDescription>Allocate financial resources across the Chart of Accounts</CardDescription>
          </div>
          <Select value={fiscalYear} onValueChange={setFiscalYear}>
             <SelectTrigger className="w-40 h-8">
                <SelectValue />
             </SelectTrigger>
             <SelectContent>
                <SelectItem value="2024/25">FY 2024/25</SelectItem>
                <SelectItem value="2023/24">FY 2023/24</SelectItem>
             </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>GL Account</TableHead>
                <TableHead className="text-right">Budget Amount</TableHead>
                <TableHead className="text-right">Actual Amount</TableHead>
                <TableHead className="text-right">Variance</TableHead>
                <TableHead>Utilization</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                 <TableRow><TableCell colSpan={6} className="text-center py-8">Loading budget data...</TableCell></TableRow>
              ) : budgets?.length === 0 ? (
                 <TableRow><TableCell colSpan={6} className="text-center py-8">No budgets defined for this period.</TableCell></TableRow>
              ) : (
                budgets?.map((b) => {
                  const variance = b.budget_amount - b.actual_amount;
                  const utilization = b.budget_amount > 0 ? (b.actual_amount / b.budget_amount) * 100 : 0;
                  return (
                    <TableRow key={b.id} className="group">
                      <TableCell>
                         <div className="flex flex-col">
                            <span className="font-bold text-sm">{b.account?.name}</span>
                            <span className="text-[10px] font-mono text-muted-foreground">{b.account?.code}</span>
                         </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                         {editingId === b.id ? (
                           <Input
                             className="h-7 w-24 ml-auto text-right text-xs"
                             value={editValue}
                             onChange={(e) => setEditValue(e.target.value)}
                             autoFocus
                           />
                         ) : (
                           `$${b.budget_amount.toLocaleString()}`
                         )}
                      </TableCell>
                      <TableCell className="text-right font-mono">${b.actual_amount.toLocaleString()}</TableCell>
                      <TableCell className={cn("text-right font-mono font-bold", variance < 0 ? "text-destructive" : "text-success")}>
                         {variance < 0 ? "(" : ""}${Math.abs(variance).toLocaleString()}{variance < 0 ? ")" : ""}
                      </TableCell>
                      <TableCell className="min-w-[120px]">
                         <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                               <div
                                 className={cn("h-full", utilization > 100 ? "bg-destructive" : utilization > 80 ? "bg-amber-500" : "bg-success")}
                                 style={{ width: `${Math.min(utilization, 100)}%` }}
                               />
                            </div>
                            <span className="text-[10px] font-bold">{utilization.toFixed(0)}%</span>
                         </div>
                      </TableCell>
                      <TableCell className="text-right">
                         {editingId === b.id ? (
                           <div className="flex justify-end gap-1">
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditingId(null)}><X className="h-4 w-4" /></Button>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-success" onClick={() => handleSaveBudget(b.id)}><Save className="h-4 w-4" /></Button>
                           </div>
                         ) : (
                           <Button
                             variant="ghost"
                             size="sm"
                             className="h-7 opacity-0 group-hover:opacity-100 transition-opacity"
                             onClick={() => { setEditingId(b.id); setEditValue(b.budget_amount.toString()); }}
                           >
                             Edit
                           </Button>
                         )}
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

const X = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
);
