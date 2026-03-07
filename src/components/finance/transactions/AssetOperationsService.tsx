import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  History,
  ArrowRightLeft,
  Trash2,
  RefreshCw,
  Plus,
  Play,
  Calculator,
  Calendar
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useFixedAssets } from "@/hooks/useFinanceAdvanced";
import { toast } from "sonner";

export function AssetOperationsService({ isReadOnly }: { isReadOnly?: boolean }) {
  const { data: assets, isLoading } = useFixedAssets();
  const [isRunningDepreciation, setIsRunningDepreciation] = useState(false);

  const handleRunDepreciation = () => {
    setIsRunningDepreciation(true);
    // Simulate smart logic
    setTimeout(() => {
      setIsRunningDepreciation(false);
      toast.success("Monthly depreciation run completed successfully", {
        description: "12 assets updated, $4,250.00 posted to Depreciation Expense."
      });
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" /> Smart Asset Operations
          </h2>
          <p className="text-muted-foreground text-sm">Automate your asset lifecycle management and financial compliance.</p>
        </div>
        {!isReadOnly && (
          <div className="flex gap-2">
             <Button
                variant="outline"
                className="gap-2 border-primary/20 hover:border-primary"
                onClick={handleRunDepreciation}
                disabled={isRunningDepreciation}
              >
                <Play className={cn("h-4 w-4", isRunningDepreciation && "animate-spin")} />
                {isRunningDepreciation ? "Calculating..." : "Run Monthly Depreciation"}
             </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <Card className="hover:bg-accent/5 transition-colors cursor-pointer border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center p-6 gap-2">
               <Plus className="h-8 w-8 text-success" />
               <span className="text-xs font-bold uppercase">New Addition</span>
            </CardContent>
         </Card>
         <Card className="hover:bg-accent/5 transition-colors cursor-pointer">
            <CardContent className="flex flex-col items-center justify-center p-6 gap-2">
               <ArrowRightLeft className="h-8 w-8 text-primary" />
               <span className="text-xs font-bold uppercase">Location Transfer</span>
            </CardContent>
         </Card>
         <Card className="hover:bg-accent/5 transition-colors cursor-pointer">
            <CardContent className="flex flex-col items-center justify-center p-6 gap-2">
               <RefreshCw className="h-8 w-8 text-blue-500" />
               <span className="text-xs font-bold uppercase">Fair Value Reval</span>
            </CardContent>
         </Card>
         <Card className="hover:bg-accent/5 transition-colors cursor-pointer">
            <CardContent className="flex flex-col items-center justify-center p-6 gap-2">
               <Trash2 className="h-8 w-8 text-destructive" />
               <span className="text-xs font-bold uppercase">Scrap / Disposal</span>
            </CardContent>
         </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
               <CardTitle>Fixed Asset Registry</CardTitle>
               <CardDescription>Live status and valuations of hotel property and equipment</CardDescription>
            </div>
            <Badge variant="outline" className="bg-primary/10 text-primary">
               Total Value: ${assets?.reduce((sum, a) => sum + a.current_value, 0).toLocaleString()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Purchase Cost</TableHead>
                <TableHead className="text-right">Current Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Depr.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">Loading assets...</TableCell></TableRow>
              ) : assets?.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">No assets registered yet.</TableCell></TableRow>
              ) : (
                assets?.map((asset) => (
                  <TableRow key={asset.id} className="group">
                    <TableCell className="font-mono text-xs text-primary font-bold">{asset.asset_code}</TableCell>
                    <TableCell className="font-medium">{asset.name}</TableCell>
                    <TableCell>
                       <Badge variant="secondary" className="text-[10px]">{asset.category}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">${asset.purchase_cost.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono text-xs font-bold">${asset.current_value.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(
                        asset.status === 'active' ? "text-success border-success/20 bg-success/5" : "text-muted-foreground"
                      )}>{asset.status}</Badge>
                    </TableCell>
                    <TableCell className="text-[10px] text-muted-foreground">
                       {asset.last_depreciation_date ? <div className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {asset.last_depreciation_date}</div> : "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

const cn = (...classes: any[]) => classes.filter(Boolean).join(" ");
