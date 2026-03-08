import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calculator,
  Play,
  History,
  CheckCircle2,
  Receipt
} from "lucide-react";

export function TaxCalculationService({ isReadOnly }: { isReadOnly?: boolean }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-display flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" /> Tax Calculation & Booking
          </h2>
          <p className="text-muted-foreground text-sm">Automated tax computation and liability booking for the current period.</p>
        </div>
        <Button size="sm" className="gap-2" disabled={isReadOnly}>
          <Play className="h-4 w-4" /> Run Period Tax Calc
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Pending Liabilities</CardTitle>
            <CardDescription>Calculated taxes awaiting journal posting.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 border rounded-lg">
               <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Sales VAT (MTD)</span>
               </div>
               <span className="font-bold">$12,450.00</span>
            </div>
            <div className="flex justify-between items-center p-3 border rounded-lg">
               <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Withholding Tax</span>
               </div>
               <span className="font-bold">$1,200.00</span>
            </div>
            <Button className="w-full text-xs h-8" disabled={isReadOnly}>
               Post Tax Journals
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
               <History className="h-4 w-4 text-primary" /> Recent Runs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
             <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Oct 2023 Final</span>
                <Badge variant="outline" className="text-success border-success/20 gap-1">
                   <CheckCircle2 className="h-3 w-3" /> Posted
                </Badge>
             </div>
             <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Sept 2023 Final</span>
                <Badge variant="outline" className="text-success border-success/20 gap-1">
                   <CheckCircle2 className="h-3 w-3" /> Posted
                </Badge>
             </div>
             <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Aug 2023 Final</span>
                <Badge variant="outline" className="text-success border-success/20 gap-1">
                   <CheckCircle2 className="h-3 w-3" /> Posted
                </Badge>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
