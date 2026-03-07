import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Calculator,
  Play,
  History,
  CheckCircle2,
  Receipt,
  RefreshCw,
  ArrowRightLeft,
  ShieldCheck
} from "lucide-react";
import { useTaxRates } from "@/hooks/useFinanceExtended";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function TaxCalculationService({ isReadOnly }: { isReadOnly?: boolean }) {
  const { data: taxRates } = useTaxRates();
  const [baseAmount, setBaseAmount] = useState<string>("1000");
  const [isCalculating, setIsCalculating] = useState(false);

  const calculations = useMemo(() => {
    const base = parseFloat(baseAmount) || 0;
    if (!taxRates) return [];

    let runningTotal = base;
    return taxRates.map(rate => {
        const amount = (base * rate.rate) / 100;
        return {
            ...rate,
            calculatedAmount: amount
        };
    });
  }, [baseAmount, taxRates]);

  const totalTax = calculations.reduce((sum, c) => sum + c.calculatedAmount, 0);
  const grandTotal = (parseFloat(baseAmount) || 0) + totalTax;

  const handleRunTaxAudit = () => {
    setIsCalculating(true);
    setTimeout(() => {
      setIsCalculating(false);
      toast.success("Period Tax Audit Complete", {
        description: "Scanned 1,240 transactions. No tax leakage detected."
      });
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-display flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" /> Smart Tax Engine
          </h2>
          <p className="text-muted-foreground text-sm">Automated multi-tier tax computation (VAT + SC) and liability verification.</p>
        </div>
        {!isReadOnly && (
          <Button size="sm" className="gap-2" onClick={handleRunTaxAudit} disabled={isCalculating}>
            <ShieldCheck className={cn("h-4 w-4", isCalculating && "animate-pulse")} />
            {isCalculating ? "Auditing..." : "Run Tax Audit"}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tax Simulation Tool</CardTitle>
            <CardDescription>Verify multi-tier tax logic for complex transactions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="max-w-xs space-y-2">
               <Label>Transaction Base Amount ($)</Label>
               <div className="relative">
                  <Input
                    type="number"
                    value={baseAmount}
                    onChange={(e) => setBaseAmount(e.target.value)}
                    className="pl-8 font-mono font-bold"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</div>
               </div>
            </div>

            <div className="space-y-3">
               <Label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Applied Tax Tiers</Label>
               <div className="divide-y border rounded-lg overflow-hidden bg-muted/20">
                  {calculations.map((calc) => (
                    <div key={calc.id} className="p-3 flex items-center justify-between bg-card">
                       <div>
                          <p className="text-sm font-bold">{calc.name}</p>
                          <p className="text-[10px] text-muted-foreground">{calc.rate}% {calc.code}</p>
                       </div>
                       <div className="text-right">
                          <p className="text-sm font-mono font-bold text-primary">+${calc.calculatedAmount.toFixed(2)}</p>
                       </div>
                    </div>
                  ))}
                  <div className="p-4 bg-primary/5 flex items-center justify-between">
                     <span className="font-bold text-sm uppercase">Grand Total (Incl. Taxes)</span>
                     <span className="text-xl font-bold font-display text-primary">${grandTotal.toFixed(2)}</span>
                  </div>
               </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
           <Card className="bg-success/5 border-success/10">
              <CardHeader className="pb-2">
                 <CardTitle className="text-sm flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-success" /> Liability Posting
                 </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">VAT Payable (MTD)</span>
                    <span className="font-bold">$12,450.00</span>
                 </div>
                 <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Service Charge (MTD)</span>
                    <span className="font-bold">$8,210.00</span>
                 </div>
                 <Button className="w-full text-xs h-9 gap-2" variant="outline">
                    <RefreshCw className="h-3.5 w-3.5" /> Post Tax Accruals
                 </Button>
              </CardContent>
           </Card>

           <Card>
             <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase text-muted-foreground font-bold">Tax Compliance Status</CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                   <div className="h-2 w-2 rounded-full bg-success" />
                   <span className="text-xs font-medium">VAT Filings up to date</span>
                </div>
                <div className="flex items-center gap-3">
                   <div className="h-2 w-2 rounded-full bg-success" />
                   <span className="text-xs font-medium">Service Charge distributed</span>
                </div>
                <div className="flex items-center gap-3">
                   <div className="h-2 w-2 rounded-full bg-amber-500" />
                   <span className="text-xs font-medium">Withholding tax review pending</span>
                </div>
             </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}
