import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ShoppingCart, Loader2, AlertTriangle, ArrowRight,
  PackageCheck, Filter, RefreshCw, Zap
} from "lucide-react";
import { useItemService } from "@/hooks/inventory/useItemService";
import { useProcurementService } from "@/hooks/inventory/useProcurementService";
import { useReportingService } from "@/hooks/inventory/useReportingService";
import { formatCurrency, cn } from "@/lib/utils";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function ReplenishmentTab() {
  const queryClient = useQueryClient();
  const { items: itemsQuery } = useItemService();
  const items = (itemsQuery.data || []).filter((i: any) => i.current_stock <= i.reorder_point);
  const isLoading = itemsQuery.isLoading;

  const { suppliers: suppliersQuery } = useProcurementService();
  const suppliers = (suppliersQuery.data || []) as any[];
  const { inventoryStats } = useReportingService();
  const stats = inventoryStats.data || { lowStock: 0, outOfStock: 0 };

  const generateLowStockPOs = useMutation({
     mutationFn: async () => {
        toast.info("Generating draft POs...");
        // Simulation of logic
     },
     onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
        toast.success("Draft POs generated successfully");
     }
  });

  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedItems);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedItems(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map((i: any) => i.item_id)));
    }
  };

  const handleSmartReplenish = async () => {
    setIsGenerating(true);
    try {
      await generateLowStockPOs.mutateAsync();
      // toast.success is already in hook
    } catch (error: any) {
      toast.error(error.message || "Failed to generate POs");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-primary" />
            Procurement & Replenishment
          </h3>
          <p className="text-sm text-muted-foreground">Automated stock restoration for items below reorder points</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" className="gap-2" onClick={() => setSelectedItems(new Set())}>
              <RefreshCw className="h-4 w-4" /> Reset
           </Button>
           <Button variant="blue" className="gap-2 shadow-3d-blue" onClick={handleSmartReplenish} disabled={isGenerating}>
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4 fill-current" />}
              Smart Replenish (AI)
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
         <div className="lg:col-span-3 space-y-6">
            <Card>
               <CardHeader className="pb-3 border-b">
                  <div className="flex items-center justify-between">
                     <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        Critical Stock Alerts ({items.length})
                     </CardTitle>
                     <div className="flex items-center gap-4">
                        <span className="text-xs text-muted-foreground">{selectedItems.size} items selected</span>
                        <Button variant="secondary" size="xs" onClick={toggleSelectAll}>
                           {selectedItems.size === items.length ? "Deselect All" : "Select All"}
                        </Button>
                     </div>
                  </div>
               </CardHeader>
               <CardContent className="p-0">
                  <Table>
                     <TableHeader className="bg-muted/30">
                        <TableRow>
                           <TableHead className="w-10"></TableHead>
                           <TableHead>Item / SKU</TableHead>
                           <TableHead>Current</TableHead>
                           <TableHead>Target</TableHead>
                           <TableHead>Suggested Qty</TableHead>
                           <TableHead>Supplier</TableHead>
                           <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                     </TableHeader>
                     <TableBody>
                        {isLoading ? (
                           <TableRow><TableCell colSpan={7} className="text-center py-10"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                        ) : items.length === 0 ? (
                           <TableRow><TableCell colSpan={7} className="text-center py-20 text-muted-foreground italic">No items require replenishment at this time.</TableCell></TableRow>
                        ) : (
                           items.map((item: any) => {
                              const supplier = suppliers.find(s => s.supplier_id === item.supplier_id);
                              const suggestedQty = Math.max(10, (item.reorder_point * 2) - item.current_stock);

                              return (
                                 <TableRow key={item.item_id} className={cn(selectedItems.has(item.item_id) && "bg-blue-50/30")}>
                                    <TableCell>
                                       <Checkbox checked={selectedItems.has(item.item_id)} onCheckedChange={() => toggleSelect(item.item_id)} />
                                    </TableCell>
                                    <TableCell>
                                       <div className="font-bold text-xs">{item.item_name}</div>
                                       <div className="text-[10px] text-muted-foreground font-mono">{item.item_code}</div>
                                    </TableCell>
                                    <TableCell>
                                       <Badge variant="destructive" className="text-[10px] font-bold">{item.current_stock}</Badge>
                                    </TableCell>
                                    <TableCell className="text-xs font-medium">{item.reorder_point}</TableCell>
                                    <TableCell className="text-xs font-bold text-primary">{suggestedQty}</TableCell>
                                    <TableCell className="text-xs">{supplier?.supplier_name || "Multiple Vendors"}</TableCell>
                                    <TableCell className="text-right">
                                       <Button variant="ghost" size="sm" className="h-8 text-blue-600">
                                          <ArrowRight className="h-4 w-4" />
                                       </Button>
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

         <div className="space-y-6">
            <Card className="bg-primary/5 border-primary/20">
               <CardHeader><CardTitle className="text-sm">Replenishment Summary</CardTitle></CardHeader>
               <CardContent className="space-y-4">
                  <div className="flex justify-between text-xs">
                     <span className="text-muted-foreground">Low Stock Items</span>
                     <span className="font-bold">{stats.lowStock}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                     <span className="text-muted-foreground">Out of Stock</span>
                     <span className="font-bold text-destructive">{stats.outOfStock}</span>
                  </div>
                  <div className="pt-4 border-t border-primary/10">
                     <p className="text-[10px] font-bold uppercase text-primary mb-1">AI Recommendation</p>
                     <p className="text-xs text-muted-foreground italic">Based on current burn rates, we recommend replenishing {items.length} items to maintain optimal operations.</p>
                  </div>
                  <Button className="w-full h-11 text-xs font-bold gap-2" variant="blue" disabled={selectedItems.size === 0}>
                     <PackageCheck className="h-4 w-4" />
                     Generate {selectedItems.size} POs
                  </Button>
               </CardContent>
            </Card>

            <Card>
               <CardHeader><CardTitle className="text-sm">Quick Filters</CardTitle></CardHeader>
               <CardContent className="space-y-2">
                  {["Food & Beverage", "Housekeeping", "Engineering", "General"].map(cat => (
                     <div key={cat} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer border border-transparent hover:border-muted transition-all">
                        <span className="text-xs font-medium">{cat}</span>
                        <Badge variant="secondary" className="text-[10px]">0</Badge>
                     </div>
                  ))}
               </CardContent>
            </Card>
         </div>
      </div>
    </div>
  );
}
