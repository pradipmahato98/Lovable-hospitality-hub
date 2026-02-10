import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { LostAndFound } from "@/hooks/useHousekeeping";

interface LostFoundTableProps {
  items: LostAndFound[];
  onClaim: (id: string) => void;
}

export const LostFoundTable = ({ items, onClaim }: LostFoundTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Description</TableHead>
          <TableHead>Location Found</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Storage</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
              No lost items recorded
            </TableCell>
          </TableRow>
        ) : (
          items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.item_description}</TableCell>
              <TableCell>{item.found_location}</TableCell>
              <TableCell>{format(new Date(item.found_date), "MMM d, yyyy")}</TableCell>
              <TableCell className="capitalize">{item.category || "-"}</TableCell>
              <TableCell>
                <Badge className={
                  item.status === "stored" ? "bg-blue-500/20 text-blue-400" :
                  item.status === "claimed" ? "bg-success/20 text-success" :
                  "bg-muted text-muted-foreground"
                }>
                  {item.status}
                </Badge>
              </TableCell>
              <TableCell>{item.storage_location || "-"}</TableCell>
              <TableCell>
                {item.status === "stored" && (
                  <Button variant="ghost" size="sm" onClick={() => onClaim(item.id)}>
                    Mark Claimed
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};
