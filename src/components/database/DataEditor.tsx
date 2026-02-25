import { useState, useEffect } from "react";
import { api } from "@/lib/api-bridge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Save,
  Trash2,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Search
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface DataEditorProps {
  tableName: string;
}

export const DataEditor = ({ tableName }: DataEditorProps) => {
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<any>({});
  const [page, setPage] = useState(0);
  const pageSize = 15;

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: rows, error } = await (await api.from(tableName))
        .select("*")
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) throw error;

      if (rows && rows.length > 0) {
        setColumns(Object.keys(rows[0]));
        setData(rows);
      } else {
        // If no data, we might need to fetch column info from schema
        const response = await fetch(`http://localhost:3001/api/database/schema/${tableName}/columns`, {
           headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.ok) {
          const colData = await response.json();
          setColumns(colData.map((c: any) => c.column_name));
        }
        setData([]);
      }
    } catch (error: any) {
      toast.error(`Failed to fetch data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tableName, page]);

  const handleStartEdit = (index: number, row: any) => {
    setEditingRow(index);
    setEditValues({ ...row });
  };

  const handleSaveEdit = async (index: number) => {
    try {
      const id = data[index].id;
      const { error } = await (await api.from(tableName))
        .update(editValues)
        .eq("id", id);

      if (error) throw error;

      const newData = [...data];
      newData[index] = { ...editValues };
      setData(newData);
      setEditingRow(null);
      toast.success("Row updated successfully");
    } catch (error: any) {
      toast.error(`Update failed: ${error.message}`);
    }
  };

  const handleDeleteRow = async (id: string) => {
    if (!confirm("Are you sure you want to delete this row?")) return;

    try {
      const { error } = await (await api.from(tableName))
        .delete()
        .eq("id", id);

      if (error) throw error;

      setData(data.filter(row => row.id !== id));
      toast.success("Row deleted");
    } catch (error: any) {
      toast.error(`Delete failed: ${error.message}`);
    }
  };

  const handleAddRow = () => {
    const newRow = columns.reduce((acc, col) => ({ ...acc, [col]: "" }), {});
    setData([{ ...newRow, _isNew: true }, ...data]);
    setEditingRow(0);
    setEditValues(newRow);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading {tableName}...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-secondary/30 p-4 rounded-lg border border-sidebar-border">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-lg px-3 py-1 font-mono">
            {tableName}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {data.length} rows visible
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={handleAddRow}>
            <Plus className="h-4 w-4" /> Add Row
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" /> Filter
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      <div className="rounded-md border border-sidebar-border overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                {columns.map((col) => (
                  <TableHead key={col} className="font-mono text-xs uppercase py-3">
                    {col}
                  </TableHead>
                ))}
                <TableHead className="text-right py-3">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, index) => (
                <TableRow key={index} className="hover:bg-secondary/20 transition-colors group">
                  {columns.map((col) => (
                    <TableCell key={col} className="p-2 min-w-[150px]">
                      {editingRow === index ? (
                        <Input
                          value={editValues[col] || ""}
                          onChange={(e) => setEditValues({ ...editValues, [col]: e.target.value })}
                          className="h-8 text-sm"
                        />
                      ) : (
                        <div
                          className="text-sm truncate max-w-[300px] cursor-pointer hover:bg-muted/50 p-1 rounded"
                          onClick={() => handleStartEdit(index, row)}
                        >
                          {row[col] === null ? (
                            <span className="text-muted-foreground italic">null</span>
                          ) : typeof row[col] === 'boolean' ? (
                            <Badge variant={row[col] ? "default" : "secondary"}>
                              {row[col].toString()}
                            </Badge>
                          ) : (
                            String(row[col])
                          )}
                        </div>
                      )}
                    </TableCell>
                  ))}
                  <TableCell className="text-right p-2">
                    {editingRow === index ? (
                      <div className="flex items-center justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-success" onClick={() => handleSaveEdit(index)}>
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setEditingRow(null)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={() => handleStartEdit(index, row)}>
                          <Plus className="h-4 w-4 rotate-45" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDeleteRow(row.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex items-center justify-between py-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(p => Math.max(0, p - 1))}
          disabled={page === 0}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" /> Previous
        </Button>
        <span className="text-sm text-muted-foreground">Page {page + 1}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(p => p + 1)}
          disabled={data.length < pageSize}
          className="gap-2"
        >
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
