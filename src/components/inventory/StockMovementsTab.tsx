import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUpDown, TrendingUp, TrendingDown, Search, Download } from "lucide-react";
import { useStockMovements } from "@/hooks/useInventory";
import { formatAD } from "@/lib/utils";
import { exportToExcel, exportToPDF } from "@/lib/reportExport";

export function StockMovementsTab() {
  const { data: movements = [] } = useStockMovements();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const filtered = movements.filter((m) => {
    const matchesSearch = !search || (m.item as any)?.name?.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || m.movement_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleExport = (format: "pdf" | "excel") => {
    const data = {
      title: "Stock Movements Report",
      headers: ["Date", "Item", "Type", "Quantity", "Notes"],
      rows: filtered.map((m) => [
        formatAD(new Date(m.created_at), "time"),
        (m.item as any)?.name || "-",
        m.movement_type,
        m.quantity,
        m.notes || "-",
      ]),
    };
    format === "pdf" ? exportToPDF(data) : exportToExcel(data);
  };

  return (
    <Card variant="elevated">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div><CardTitle className="flex items-center gap-2"><ArrowUpDown className="h-5 w-5" />Stock Movements</CardTitle><CardDescription>{movements.length} records</CardDescription></div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleExport("excel")}><Download className="h-4 w-4 mr-1" />Excel</Button>
            <Button variant="outline" size="sm" onClick={() => handleExport("pdf")}><Download className="h-4 w-4 mr-1" />PDF</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search item..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-48" />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="in">Stock In</SelectItem>
              <SelectItem value="out">Stock Out</SelectItem>
              <SelectItem value="adjustment">Adjustment</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No movements found</TableCell></TableRow>
            ) : (
              filtered.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{formatAD(new Date(m.created_at), "time")}</TableCell>
                  <TableCell className="font-medium">{(m.item as any)?.name || "-"}</TableCell>
                  <TableCell>
                    <Badge className={m.movement_type === "in" ? "bg-success/20 text-success" : m.movement_type === "out" ? "bg-destructive/20 text-destructive" : "bg-muted text-muted-foreground"}>
                      {m.movement_type === "in" ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                      {m.movement_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{m.quantity}</TableCell>
                  <TableCell className="text-muted-foreground max-w-[200px] truncate">{m.notes || "-"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
