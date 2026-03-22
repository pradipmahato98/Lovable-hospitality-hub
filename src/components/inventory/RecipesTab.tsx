import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, ChefHat, Loader2, Edit, Trash2, UtensilsCrossed, Play, Calculator, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useRecipeService } from "@/hooks/inventory/useRecipeService";
import { useItemService } from "@/hooks/inventory/useItemService";
import { useInventoryTransactionService } from "@/hooks/inventory/useInventoryTransactionService";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";

export function RecipesTab() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isProduceOpen, setIsProduceOpen] = useState(false);
  const { recipes: recipesQuery, createRecipe, updateRecipe } = useRecipeService();
  const { items: itemsQuery, units: unitsQuery } = useItemService();
  const { createMovement } = useInventoryTransactionService();

  const recipes = recipesQuery.data || [];
  const items = itemsQuery.data || [];
  const uoms = unitsQuery.data || [];
  const isLoading = recipesQuery.isLoading;

  const [selectedRecipe, setSelectedRecipe] = useState<any | null>(null);
  const [produceQty, setProduceQty] = useState(1);

  const calculateRecipeCost = (recipe: any) => {
     const rawCost = recipe.ingredients?.reduce((sum: number, rItem: any) => {
        return sum + (rItem.quantity_required * (rItem.item?.cost_price || 0));
     }, 0) || 0;
     return rawCost;
  };

  const handleProduce = async () => {
    if (!selectedRecipe) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // For each ingredient, record an "out" movement
      for (const ingredient of selectedRecipe.ingredients) {
        await createMovement.mutateAsync({
           item_id: ingredient.item_id,
           quantity: ingredient.quantity_required * produceQty,
           movement_type: 'out',
           reference_id: selectedRecipe.recipe_id,
           reference_type: 'production',
           notes: `Production of ${selectedRecipe.recipe_name}`
        });
      }

      toast.success(`Production logged: ${produceQty} portions of ${selectedRecipe.recipe_name}`);
      setIsProduceOpen(false);
    } catch {
      toast.error("Production logging failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Standard Recipes & BOM</h3>
          <p className="text-sm text-muted-foreground">Define ingredients for menu items and automated consumption</p>
        </div>
        <Button variant="blue" className="gap-2" onClick={() => setIsAddOpen(true)}><Plus className="h-4 w-4" />New Recipe</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading ? (
          <div className="col-span-full flex items-center justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : recipes.length === 0 ? (
          <div className="col-span-full text-center py-10 border rounded-lg bg-muted/20 text-muted-foreground">No recipes defined</div>
        ) : (
          recipes.map((recipe: any) => {
            const recipeCost = calculateRecipeCost(recipe);
            return (
              <Card key={recipe.recipe_id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                        <ChefHat className="h-5 w-5 text-orange-500" />
                      </div>
                      <div>
                        <p className="font-bold text-lg">{recipe.recipe_name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{recipe.menu_item?.name || "No linked menu item"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <Badge variant="outline" className="flex items-center gap-1 mb-1"><UtensilsCrossed className="h-3 w-3" /> {recipe.portion_size}</Badge>
                       <div className="flex flex-col items-end">
                          <p className="text-[10px] font-bold text-primary">{formatCurrency(recipeCost)} / portion</p>
                       </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between items-center mb-1">
                       <p className="text-sm font-semibold">Ingredients (BOM):</p>
                       <Badge variant="secondary" className="text-[9px] h-4">Automated Deduction</Badge>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-3 space-y-1">
                      {recipe.ingredients?.map((ing: any) => {
                        const itemCost = ing.quantity_required * (ing.item?.cost_price || 0);
                        const weight = recipeCost > 0 ? (itemCost / recipeCost) * 100 : 0;
                        return (
                          <div key={ing.id} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="font-medium">{ing.item?.item_name}</span>
                              <span className="font-mono text-muted-foreground">{ing.quantity_required} {ing.item?.unit?.unit_symbol || 'units'}</span>
                            </div>
                            <div className="w-full h-0.5 bg-muted rounded-full overflow-hidden">
                               <div className="h-full bg-primary/40" style={{ width: `${weight}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-t pt-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                       <Calculator className="h-3 w-3" /> Costing: {formatCurrency(recipeCost)}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="secondary" size="sm" className="h-8 gap-1" onClick={() => { setSelectedRecipe(recipe); setIsProduceOpen(true); }}>
                        <Play className="h-3 w-3" /> Produce
                      </Button>
                      <Button variant="outline" size="sm" className="h-8">Edit</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Production Dialog */}
      <Dialog open={isProduceOpen} onOpenChange={setIsProduceOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Log Production: {selectedRecipe?.recipe_name}</DialogTitle><DialogDescription>Deduct ingredients from stock based on quantity produced</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Batch Size (Portions)</Label>
              <div className="flex items-center gap-4">
                 <Input type="number" value={produceQty} onChange={(e) => setProduceQty(Number(e.target.value))} className="w-32" />
                 <ArrowRight className="h-4 w-4 text-muted-foreground" />
                 <p className="text-sm font-bold text-primary">Total Est. Cost: {formatCurrency(calculateRecipeCost(selectedRecipe || {}) * produceQty)}</p>
              </div>
              <p className="text-xs text-muted-foreground italic">Target: {selectedRecipe?.portion_size} per portion</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg border">
               <p className="text-xs font-bold uppercase mb-2 text-muted-foreground">Inventory Consumption:</p>
               {selectedRecipe?.ingredients?.map((ing: any) => (
                 <div key={ing.id} className="flex justify-between text-xs py-1 border-b border-muted last:border-0">
                   <span>{ing.item?.item_name}</span>
                   <div className="flex items-center gap-2">
                      <span className="text-muted-foreground line-through">{ing.item?.current_stock}</span>
                      <span className="text-destructive font-mono font-bold">-{ing.quantity_required * produceQty}</span>
                      <span className="text-[10px] font-bold uppercase">{ing.item?.unit?.unit_symbol || 'units'}</span>
                   </div>
                 </div>
               ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProduceOpen(false)}>Cancel</Button>
            <Button onClick={handleProduce} variant="blue" className="gap-2">
               Finalize Production
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
