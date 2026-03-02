import { useState } from "react";
import { api } from "@/lib/api-bridge";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Play, RotateCcw, Save, Download } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const SQLEditor = () => {
  const [query, setQuery] = useState("SELECT * FROM reservations LIMIT 10;");
  const [results, setResults] = useState<any[]>([]);
  const [executing, setExecuting] = useState(false);

  const handleExecute = async () => {
    setExecuting(true);
    try {
      const { data, error } = await api.post('/sql', { query });

      if (error) throw error;

      if (data && data.length > 0) {
        setResults(data);
        toast.success(`Query executed successfully: ${data.length} rows returned`);
      } else {
        setResults([]);
        toast.info("Query returned no results");
      }
    } catch (error: any) {
      toast.error(`Query Error: ${error.message}`);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      <Card variant="elevated">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>SQL Console</CardTitle>
              <CardDescription>Execute raw SQL queries against your database</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setQuery("")}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Clear
              </Button>
              <Button variant="outline" size="sm">
                <Save className="h-4 w-4 mr-2" />
                Save Snippet
              </Button>
              <Button size="sm" onClick={handleExecute} disabled={executing}>
                <Play className={`h-4 w-4 mr-2 ${executing ? 'animate-pulse' : ''}`} />
                {executing ? 'Executing...' : 'Run Query'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative font-mono">
            <Textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="min-h-[200px] bg-secondary/50 text-foreground border-sidebar-border focus-visible:ring-primary"
              spellCheck={false}
            />
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card variant="elevated">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Query Results</CardTitle>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-sidebar-border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {Object.keys(results[0]).map((key) => (
                      <TableHead key={key} className="uppercase text-xs font-bold">{key}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((row, i) => (
                    <TableRow key={i}>
                      {Object.values(row).map((val: any, j) => (
                        <TableCell key={j}>{String(val)}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
