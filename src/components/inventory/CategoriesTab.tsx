import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, Plus, Trash2 } from "lucide-react";
import { InventoryCategory } from "@/hooks/useInventory";

interface CategoriesTabProps {
  categories: InventoryCategory[];
  onAddCategory: () => void;
  onEditCategory: (category: InventoryCategory) => void;
  onDeleteCategory: (id: string) => void;
}

export const CategoriesTab = ({
  categories,
  onAddCategory,
  onEditCategory,
  onDeleteCategory
}: CategoriesTabProps) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Item Categories</h2>
        <Button variant="gold" onClick={onAddCategory} className="gap-2"><Plus className="h-4 w-4" />Add Category</Button>
      </div>
      <Card className="shadow-sm">
        <Table>
          <TableHeader>
            <TableRow><TableHead>Name</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow><TableCell colSpan={3} className="text-center py-10 text-muted-foreground">No categories defined</TableCell></TableRow>
            ) : categories.map(c => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{c.description || "-"}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => onEditCategory(c)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => onDeleteCategory(c.id)}><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};
