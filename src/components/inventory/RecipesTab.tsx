import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, ChefHat, Loader2, Edit, Trash2, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import { useInventoryRecipes, useInventoryItems, useInventoryUoMs } from "@/hooks/useInventory";

export function RecipesTab() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const { data: recipes = [], isLoading, createRecipe } = useInventoryRecipes();
  const { data: items = [] } = useInventoryItems();
  const { data: uoms = [] } = useInventoryUoMs();

  const [form, setForm] = useState({
    name: "", description: "", portion_size: "1 portion", yield_percentage: 100,
    items: [] as { item_id: string, quantity: number, uom_id: string, waste_percentage: number }[]
  });

  const addItemToRecipe = () => {
    setForm({ ...form, items: [...form.items, { item_id: "", quantity: 0, uom_id: "", waste_percentage: 0 }] });
  };

  const updateItemInRecipe = (index: number, field: string, value: any) => {
    const newItems = [...form.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setForm({ ...form, items: newItems });
  };

  const handleCreate = async () => {
    try {
      if (!form.name || form.items.length === 0) {
        toast.error("Please fill in recipe name and add at least one ingredient");
        return;
      }
      await createRecipe.mutateAsync(form);
      toast.success("Recipe created successfully");
      setIsAddOpen(false);
      setForm({ name: "", description: "", portion_size: "1 portion", yield_percentage: 100, items: [] });
    } catch { toast.error("Failed to create recipe"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Standard Recipes & BOM</h3>
          <p className="text-sm text-muted-foreground">Define ingredients for menu items and automated consumption</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild><Button variant="blue" className="gap-2"><Plus className="h-4 w-4" />New Recipe</Button></DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create Standard Recipe</DialogTitle><DialogDescription>Define ingredient quantities for automated inventory deduction</DialogDescription></DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2 col-span-2"><Label>Recipe Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Classic Beef Burger" /></div>
              <div className="space-y-2 col-span-2"><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="space-y-2"><Label>Portion Size</Label><Input value={form.portion_size} onChange={(e) => setForm({ ...form, portion_size: e.target.value })} /></div>
              <div className="space-y-2"><Label>Yield Percentage (%)</Label><Input type="number" value={form.yield_percentage} onChange={(e) => setForm({ ...form, yield_percentage: Number(e.target.value) })} /></div>

              <div className="col-span-2 space-y-4 pt-4 border-t">
                <div className="flex justify-between items-center"><Label className="text-base font-semibold">Ingredients (BOM)</Label><Button type="button" variant="outline" size="sm" onClick={addItemToRecipe}><Plus className="h-4 w-4 mr-2" />Add Ingredient</Button></div>
                {form.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-3 items-end p-3 border rounded-lg bg-muted/30">
                    <div className="col-span-4 space-y-1">
                      <Label className="text-xs text-muted-foreground">Ingredient</Label>
                      <Select value={item.item_id} onValueChange={(v) => updateItemInRecipe(idx, "item_id", v)}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>{items.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs text-muted-foreground">Qty</Label>
                      <Input type="number" step="0.001" value={item.quantity} onChange={(e) => updateItemInRecipe(idx, "quantity", Number(e.target.value))} />
                    </div>
                    <div className="col-span-3 space-y-1">
                      <Label className="text-xs text-muted-foreground">Unit</Label>
                      <Select value={item.uom_id} onValueChange={(v) => updateItemInRecipe(idx, "uom_id", v)}>
                        <SelectTrigger><SelectValue placeholder="Unit" /></SelectTrigger>
                        <SelectContent>{uoms.map(u => <SelectItem key={u.id} value={u.id}>{u.abbreviation || u.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs text-muted-foreground">Waste %</Label>
                      <Input type="number" value={item.waste_percentage} onChange={(e) => updateItemInRecipe(idx, "waste_percentage", Number(e.target.value))} />
                    </div>
                    <div className="col-span-1 pb-1 flex justify-end">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => {
                        const newItems = form.items.filter((_, i) => i !== idx);
                        setForm({ ...form, items: newItems });
                      }}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={createRecipe.isPending} variant="blue">
                {createRecipe.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Create Recipe
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading ? (
          <div className="col-span-full flex items-center justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : recipes.length === 0 ? (
          <div className="col-span-full text-center py-10 border rounded-lg bg-muted/20 text-muted-foreground">No recipes defined</div>
        ) : (
          recipes.map((recipe) => (
            <Card key={recipe.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                      <ChefHat className="h-5 w-5 text-orange-500" />
                    </div>
                    <div>
                      <p className="font-bold text-lg">{recipe.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{recipe.description || "No description"}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="flex items-center gap-1"><UtensilsCrossed className="h-3 w-3" /> {recipe.portion_size}</Badge>
                </div>

                <div className="space-y-2 mb-6">
                  <p className="text-sm font-semibold mb-2">Ingredients List:</p>
                  <div className="bg-muted/30 rounded-lg p-3 space-y-1">
                    {recipe.items?.slice(0, 3).map((item: any) => (
                      <div key={item.id} className="flex justify-between text-xs">
                        <span>{item.item?.name}</span>
                        <span className="font-mono text-muted-foreground">{item.quantity} {item.uom?.abbreviation || item.item?.unit}</span>
                      </div>
                    ))}
                    {(recipe.items?.length || 0) > 3 && (
                      <p className="text-[10px] text-muted-foreground text-center mt-1">+ {(recipe.items?.length || 0) - 3} more ingredients</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm">Edit BOM</Button>
                  <Button variant="ghost" size="sm">Full Recipe</Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
