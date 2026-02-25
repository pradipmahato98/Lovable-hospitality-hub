import { useState, useEffect } from "react";
import { api } from "@/lib/api-bridge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash2, Eye } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface TableExplorerProps {
  searchQuery: string;
}

const MOCK_TABLES = [
  { name: "reservations", rows: 1250, columns: 18, size: "2.4 MB", lastModified: "2 mins ago" },
  { name: "guests", rows: 850, columns: 12, size: "1.1 MB", lastModified: "10 mins ago" },
  { name: "rooms", rows: 200, columns: 8, size: "450 KB", lastModified: "1 hour ago" },
  { name: "profiles", rows: 15, columns: 10, size: "120 KB", lastModified: "5 hours ago" },
  { name: "user_roles", rows: 15, columns: 3, size: "45 KB", lastModified: "5 hours ago" },
  { name: "staff_members", rows: 45, columns: 15, size: "320 KB", lastModified: "1 day ago" },
];

export const TableExplorer = ({ searchQuery }: TableExplorerProps) => {
  const [tables, setTables] = useState(MOCK_TABLES);

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const response = await fetch("http://localhost:3001/api/database/tables", {
          headers: {
            'Authorization': \`Bearer \${localStorage.getItem('token')}\`
          }
        });
        if (response.ok) {
          const data = await response.json();
          const mappedTables = data.map((t: any) => ({
            name: t.table_name,
            rows: "...",
            columns: "...",
            size: "...",
            lastModified: "Real-time"
          }));
          setTables(mappedTables);
        }
      } catch (error) {
        console.error("Failed to fetch tables:", error);
      }
    };
    fetchTables();
  }, []);

  const filteredTables = tables.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle>Tables</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Table Name</TableHead>
              <TableHead>Rows</TableHead>
              <TableHead>Columns</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Last Modified</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTables.map((table) => (
              <TableRow key={table.name} className="hover:bg-secondary/30 transition-colors">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-success" />
                    {table.name}
                  </div>
                </TableCell>
                <TableCell>{table.rows.toLocaleString()}</TableCell>
                <TableCell>{table.columns}</TableCell>
                <TableCell>{table.size}</TableCell>
                <TableCell className="text-muted-foreground">{table.lastModified}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="gap-2">
                        <Eye className="h-4 w-4" /> View Data
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2">
                        <Edit className="h-4 w-4" /> Edit Schema
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 text-destructive">
                        <Trash2 className="h-4 w-4" /> Delete Table
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
