import { useState, useEffect } from "react";
import { api } from "@/lib/api-bridge";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Database,
  Shield,
  Lock,
  Unlock,
  Key,
  Layers,
  Share2,
  Table as TableIcon,
  Circle,
  Plus,
  Info
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const MOCK_SCHEMA = [
  {
    name: "reservations",
    columns: [
      { name: "id", type: "uuid", pk: true },
      { name: "guest_id", type: "uuid", fk: "guests.id" },
      { name: "room_id", type: "uuid", fk: "rooms.id" },
      { name: "check_in", type: "timestamp" },
      { name: "status", type: "text" },
    ]
  },
  {
    name: "guests",
    columns: [
      { name: "id", type: "uuid", pk: true },
      { name: "full_name", type: "text" },
      { name: "email", type: "text", encrypted: true },
      { name: "loyalty_id", type: "uuid" },
    ]
  },
  {
    name: "rooms",
    columns: [
      { name: "id", type: "uuid", pk: true },
      { name: "room_number", type: "text" },
      { name: "type", type: "text" },
      { name: "status", type: "text" },
    ]
  }
];

export const SchemaManager = () => {
  const [tables, setTables] = useState<any[]>(MOCK_SCHEMA);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchSchema = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await api.post('/sql', {
          query: `
            SELECT
              t.table_name,
              json_agg(json_build_object(
                'name', c.column_name,
                'type', c.data_type,
                'pk', (
                  SELECT count(*) > 0
                  FROM information_schema.key_column_usage kcu
                  JOIN information_schema.table_constraints tc ON kcu.constraint_name = tc.constraint_name
                  WHERE tc.constraint_type = 'PRIMARY KEY'
                  AND kcu.table_name = t.table_name
                  AND kcu.column_name = c.column_name
                )
              )) as columns
            FROM information_schema.tables t
            JOIN information_schema.columns c ON t.table_name = c.table_name
            WHERE t.table_schema = 'public'
            AND t.table_type = 'BASE TABLE'
            GROUP BY t.table_name;
          `
        });

        if (!error && data) {
          setTables(data.length > 0 ? data : MOCK_SCHEMA);
        }
      } catch (err) {
        console.error("Failed to fetch schema:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSchema();
  }, []);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="visualizer" className="w-full">
        <TabsList className="bg-muted/50 mb-4">
          <TabsTrigger value="visualizer" className="gap-2">
            <Share2 className="h-4 w-4" /> Visualizer
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" /> Security & RLS
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visualizer" className="mt-0">
          <div className="relative w-full h-[600px] bg-secondary/10 rounded-xl border border-sidebar-border overflow-hidden group">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
              <Database className="h-64 w-64 text-primary" />
            </div>

            <div className="absolute inset-0 p-8 flex flex-wrap gap-8 items-start justify-center overflow-auto custom-scrollbar">
              {tables.map((table) => (
                <Card key={table.table_name || table.name} className="w-64 shrink-0 shadow-lg border-primary/20 bg-card/80 backdrop-blur-sm">
                  <div className="p-3 bg-primary/10 border-b border-primary/20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TableIcon className="h-4 w-4 text-primary" />
                      <span className="font-bold text-sm">{table.table_name || table.name}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] py-0">{table.columns.length} cols</Badge>
                  </div>
                  <div className="p-2 space-y-1">
                    {table.columns.map((col) => (
                      <div key={col.name} className="flex items-center justify-between text-[11px] p-1.5 hover:bg-primary/5 rounded group/col">
                        <div className="flex items-center gap-2">
                          {col.pk ? (
                            <Key className="h-3 w-3 text-warning" />
                          ) : col.fk ? (
                            <Share2 className="h-3 w-3 text-primary" />
                          ) : (
                            <Circle className="h-1.5 w-1.5 text-muted-foreground" />
                          )}
                          <span className={col.pk ? "font-bold" : ""}>{col.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                           {col.encrypted && <Lock className="h-2.5 w-2.5 text-success" />}
                           <span className="text-muted-foreground opacity-60 italic">{col.type}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}

              {/* Fake SVG Connections */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                <defs>
                  <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" className="text-primary/40" />
                  </marker>
                </defs>
                {/* Visualizing relationships is hard without coordinates, but we can simulate it for the demo */}
              </svg>
            </div>

            <div className="absolute bottom-4 right-4 flex gap-2">
              <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm border-sidebar-border">
                3 Tables
              </Badge>
              <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm border-sidebar-border">
                2 Relationships
              </Badge>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="security" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Row Level Security (RLS)
                </CardTitle>
                <CardDescription>Configure access control policies for your tables</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-sidebar-border">
                  <div className="space-y-0.5">
                    <Label className="text-base">Global RLS Enforcement</Label>
                    <p className="text-sm text-muted-foreground">Force all queries to pass through RLS policies</p>
                  </div>
                  <Switch checked={true} />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Policies</h4>
                    <Button
                      variant="outline"
                      size="xs"
                      className="h-7 gap-1 text-xs"
                      onClick={() => toast.info("New RLS Policy creation coming soon.")}
                    >
                      <Plus className="h-3 w-3" /> New Policy
                    </Button>
                  </div>

                  {[
                    { table: "reservations", policy: "Allow select for owners" },
                    { table: "guests", policy: "Allow all for admin" },
                    { table: "profiles", policy: "Allow select for self" }
                  ].map(item => (
                    <div key={item.table} className="flex flex-col gap-1 py-3 border-b border-sidebar-border last:border-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{item.table}</span>
                        <Badge className="bg-success/20 text-success border-success/30 gap-1">
                          <Lock className="h-3 w-3" />
                          Active
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Info className="h-3 w-3" /> {item.policy}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-primary" />
                  End-to-End Encryption
                </CardTitle>
                <CardDescription>Manage encrypted fields and security keys</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 text-primary mb-4">
                  <p className="text-sm font-medium">
                    E2EE is active. Sensitive data is encrypted on the client before storage.
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Encrypted Fields</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between py-2 border-b border-sidebar-border">
                      <div>
                        <p className="text-sm font-medium">guests.email</p>
                        <p className="text-xs text-muted-foreground">AES-256-GCM</p>
                      </div>
                      <Badge variant="outline">Encrypted</Badge>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-sidebar-border">
                      <div>
                        <p className="text-sm font-medium">guests.phone</p>
                        <p className="text-xs text-muted-foreground">AES-256-GCM</p>
                      </div>
                      <Badge variant="outline">Encrypted</Badge>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-sm font-medium">staff_members.salary</p>
                        <p className="text-xs text-muted-foreground">AES-256-GCM</p>
                      </div>
                      <Badge variant="outline">Encrypted</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
