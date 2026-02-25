import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table as TableIcon,
  Terminal,
  Settings2,
  Activity,
  Search,
  Plus
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { TableExplorer } from "./TableExplorer";
import { SQLEditor } from "./SQLEditor";
import { SchemaManager } from "./SchemaManager";

export const DatabaseControlCenter = () => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="space-y-6">
      <Tabs defaultValue="explorer" className="w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="explorer" className="gap-2">
              <TableIcon className="h-4 w-4" />
              Table Explorer
            </TabsTrigger>
            <TabsTrigger value="sql" className="gap-2">
              <Terminal className="h-4 w-4" />
              SQL Editor
            </TabsTrigger>
            <TabsTrigger value="schema" className="gap-2">
              <Settings2 className="h-4 w-4" />
              Schema Manager
            </TabsTrigger>
            <TabsTrigger value="health" className="gap-2">
              <Activity className="h-4 w-4" />
              Health
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tables..."
                className="pl-9 w-full sm:w-[200px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button className="gap-2 shrink-0">
              <Plus className="h-4 w-4" />
              <span className="hidden xs:inline">New Table</span>
            </Button>
          </div>
        </div>

        <TabsContent value="explorer">
          <TableExplorer searchQuery={searchQuery} />
        </TabsContent>

        <TabsContent value="sql">
          <SQLEditor />
        </TabsContent>

        <TabsContent value="schema">
          <SchemaManager />
        </TabsContent>

        <TabsContent value="health">
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>System Health</CardTitle>
              <CardDescription>Real-time performance metrics and database status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-secondary/50 border border-sidebar-border">
                  <p className="text-sm text-muted-foreground">Active Connections</p>
                  <p className="text-2xl font-bold text-primary">12</p>
                </div>
                <div className="p-4 rounded-lg bg-secondary/50 border border-sidebar-border">
                  <p className="text-sm text-muted-foreground">Database Size</p>
                  <p className="text-2xl font-bold text-primary">145 MB</p>
                </div>
                <div className="p-4 rounded-lg bg-secondary/50 border border-sidebar-border">
                  <p className="text-sm text-muted-foreground">Avg Response Time</p>
                  <p className="text-2xl font-bold text-success">24ms</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
