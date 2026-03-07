import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { InventoryRecipe } from "@/hooks/useInventory";

interface RecipesTabProps {
  recipes: InventoryRecipe[];
  onAddRecipe: () => void;
  onProduce: (recipe: InventoryRecipe) => void;
}

export const RecipesTab = ({
  recipes,
  onAddRecipe,
  onProduce
}: RecipesTabProps) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Recipe Management & BOM</h2>
        <Button variant="gold" className="gap-2" onClick={onAddRecipe}><Plus className="h-4 w-4" />Define Recipe</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recipes.length === 0 ? (
          <div className="col-span-full py-20 text-center text-muted-foreground">No recipes defined</div>
        ) : recipes.map(recipe => (
          <Card key={recipe.id} className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">{recipe.name}</CardTitle>
              <CardDescription>{recipe.category} • Yield: {recipe.yield_quantity} {recipe.yield_unit}</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="text-xs space-y-1 mb-4">
                  {recipe.ingredients?.slice(0, 3).map((ing: any) => (
                    <div key={ing.id} className="flex justify-between">
                      <span className="text-muted-foreground">{ing.item?.name}</span>
                      <span className="font-medium">{ing.quantity} {ing.unit || ing.item?.unit}</span>
                    </div>
                  ))}
                  {recipe.ingredients && recipe.ingredients.length > 3 && (
                    <p className="text-[10px] text-primary">+{recipe.ingredients.length - 3} more ingredients</p>
                  )}
               </div>
               <div className="flex justify-between items-center pt-2 border-t mt-4">
                 <div className="text-xs">
                    <span className="text-muted-foreground">Est. Cost: </span>
                    <span className="font-bold text-success">${recipe.total_cost?.toFixed(2)}</span>
                 </div>
                 <Button variant="outline" className="h-8 text-xs px-3" onClick={() => onProduce(recipe)}>Record Production</Button>
               </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
