import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Terminal, Send, Trash2, Play, Code, Database, Info, Wifi, WifiOff, Cpu } from "lucide-react";
import { useMCP } from "@/hooks/useMCP";

const AVAILABLE_TOOLS = [
  { name: "get_schema_info", description: "Get database schema information", icon: Info },
  { name: "list_reservations", description: "List recent reservations", icon: Terminal },
  { name: "get_room_availability", description: "Check available rooms", icon: Play },
  { name: "supabase_query", description: "Run read-only SQL query", icon: Database },
  { name: "ping", description: "Test connectivity", icon: Info },
];

export const MCPTerminal = () => {
  const { executeTool, isLoading, isConnected, connectionMode } = useMCP();
  const [logs, setLogs] = useState<{ type: 'input' | 'output' | 'error', content: string, timestamp: Date }[]>([]);
  const [query, setQuery] = useState("");
  const [selectedTool, setSelectedTool] = useState(AVAILABLE_TOOLS[0].name);

  const addLog = (type: 'input' | 'output' | 'error', content: string) => {
    setLogs(prev => [...prev, { type, content, timestamp: new Date() }]);
  };

  const handleExecute = async () => {
    if (selectedTool === "supabase_query" && !query) return;

    const args = selectedTool === "supabase_query" ? { query } : {};
    addLog('input', `Executing tool: ${selectedTool} ${query ? `with query: ${query}` : ''}`);

    try {
      const result = await executeTool(selectedTool, args);
      addLog('output', JSON.stringify(result, null, 2));
    } catch (error: any) {
      addLog('error', error.message);
    }
  };

  const clearLogs = () => setLogs([]);

  return (
    <Card variant="elevated" className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Terminal className="h-5 w-5 text-primary" />
            </div>
            <div>
        <div className="flex items-center gap-2">
          <CardTitle>MCP Tool Terminal</CardTitle>
          <Badge variant={connectionMode === 'remote' ? 'default' : 'outline'} className="text-[10px] h-4">
            {connectionMode === 'remote' ? 'Remote Mode' : 'Local Mode'}
          </Badge>
          {connectionMode === 'remote' && (
            isConnected ?
              <Badge variant="outline" className="text-[10px] h-4 bg-success/20 text-success border-success/30 gap-1">
                <Wifi className="h-2 w-2" /> Connected
              </Badge> :
              <Badge variant="outline" className="text-[10px] h-4 bg-destructive/20 text-destructive border-destructive/30 gap-1">
                <WifiOff className="h-2 w-2" /> Disconnected
              </Badge>
          )}
        </div>
              <CardDescription>Directly interact with Supabase MCP tools</CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={clearLogs} disabled={logs.length === 0}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Select Tool</Label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_TOOLS.map((tool) => (
                <Badge
                  key={tool.name}
                  variant={selectedTool === tool.name ? "default" : "outline"}
                  className="cursor-pointer px-3 py-1.5 gap-2"
                  onClick={() => setSelectedTool(tool.name)}
                >
                  <tool.icon className="h-3 w-3" />
                  {tool.name}
                </Badge>
              ))}
            </div>
          </div>

          {selectedTool === "supabase_query" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="sql-query">SQL Query</Label>
                <Badge variant="destructive" className="text-[10px] h-4">Admin Only</Badge>
              </div>
              <div className="flex gap-2">
                <Input
                  id="sql-query"
                  placeholder="SELECT * FROM rooms LIMIT 5..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="font-mono text-xs"
                />
                <Button onClick={handleExecute} disabled={isLoading || !query} size="icon">
                  <Play className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {selectedTool !== "supabase_query" && (
            <div className="flex items-end">
              <Button onClick={handleExecute} disabled={isLoading} className="w-full gap-2">
                <Play className="h-4 w-4" />
                Execute {selectedTool}
              </Button>
            </div>
          )}
        </div>

        <div className="relative">
          <ScrollArea className="h-[400px] w-full rounded-md border bg-zinc-950 p-4 font-mono text-xs text-zinc-300">
            {logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-zinc-600 gap-2">
                <Code className="h-8 w-8" />
                <p>Terminal ready. Execute a tool to see output.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {logs.map((log, i) => (
                  <div key={i} className={`border-l-2 pl-3 ${
                    log.type === 'input' ? 'border-primary/50' :
                    log.type === 'error' ? 'border-destructive' : 'border-success/50'
                  }`}>
                    <div className="flex items-center justify-between mb-1 opacity-50 text-[10px]">
                      <span>{log.type.toUpperCase()}</span>
                      <span>{log.timestamp.toLocaleTimeString()}</span>
                    </div>
                    <pre className="whitespace-pre-wrap break-all">
                      {log.content}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
};
