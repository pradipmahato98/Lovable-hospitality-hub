import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Zap,
  Mail,
  TrendingUp,
  Bell,
  Plus,
  Trash2,
  Settings2,
  PlayCircle,
  PauseCircle,
  Clock,
  Shuffle
} from "lucide-react";
import { useAutomations, AutomationRule, useAllRoutingRules } from "@/hooks/useAutomations";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const Automation = () => {
  const { rules, isLoading, createRule, updateRule, deleteRule } = useAutomations();
  const { data: routingRules, isLoading: isLoadingRouting } = useAllRoutingRules();
  const [isAddRuleOpen, setIsAddRuleOpen] = useState(false);
  const [newRule, setNewRule] = useState<Partial<AutomationRule>>({
    name: "",
    description: "",
    event_type: "on_check_in",
    action_type: "send_email",
    is_active: true
  });

  const handleCreateRule = async () => {
    if (!newRule.name) return;
    await createRule.mutateAsync(newRule as any);
    setIsAddRuleOpen(false);
    setNewRule({
      name: "",
      description: "",
      event_type: "on_check_in",
      action_type: "send_email",
      is_active: true
    });
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'on_check_in': return <PlayCircle className="h-4 w-4 text-primary" />;
      case 'on_occupancy_change': return <TrendingUp className="h-4 w-4 text-success" />;
      case 'on_inventory_low': return <Bell className="h-4 w-4 text-warning" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'send_email': return <Mail className="h-4 w-4" />;
      case 'create_notification': return <Bell className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  return (
    <MainLayout title="Automations" subtitle="Manage automated workflows and business rules">
      <ErrorBoundary>
        <Tabs defaultValue="workflows" className="space-y-6">
          <TabsList>
            <TabsTrigger value="workflows" className="gap-2">
              <Zap className="h-4 w-4" />
              Workflows
            </TabsTrigger>
            <TabsTrigger value="routing" className="gap-2">
              <Shuffle className="h-4 w-4" />
              Folio Routing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="workflows" className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-medium">Active Workflows</h3>
                <p className="text-sm text-muted-foreground">Automatically trigger actions based on system events.</p>
              </div>
              <Dialog open={isAddRuleOpen} onOpenChange={setIsAddRuleOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 w-full sm:w-auto">
                    <Plus className="h-4 w-4" />
                    Add New Rule
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Create Automation Rule</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Rule Name</Label>
                      <Input
                        placeholder="e.g. Welcome Email"
                        value={newRule.name}
                        onChange={(e) => setNewRule({...newRule, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input
                        placeholder="What does this rule do?"
                        value={newRule.description || ''}
                        onChange={(e) => setNewRule({...newRule, description: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Trigger Event</Label>
                        <Select
                          value={newRule.event_type}
                          onValueChange={(v) => setNewRule({...newRule, event_type: v})}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="on_check_in">On Check-in</SelectItem>
                            <SelectItem value="on_reservation_created">On New Booking</SelectItem>
                            <SelectItem value="on_occupancy_change">On Occupancy Change</SelectItem>
                            <SelectItem value="on_inventory_low">On Low Stock</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Action</Label>
                        <Select
                          value={newRule.action_type}
                          onValueChange={(v) => setNewRule({...newRule, action_type: v})}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="send_email">Send Email</SelectItem>
                            <SelectItem value="create_notification">Push Notification</SelectItem>
                            <SelectItem value="create_housekeeping_task">Housekeeping Task</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddRuleOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreateRule} disabled={!newRule.name || createRule.isPending}>
                      {createRule.isPending ? "Creating..." : "Create Rule"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rules?.map((rule) => (
                <Card key={rule.id} className={!rule.is_active ? "opacity-60 grayscale-[0.5]" : "shadow-glow-sm"}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        {getActionIcon(rule.action_type)}
                      </div>
                      <Switch
                        checked={rule.is_active}
                        onCheckedChange={(checked) => updateRule.mutate({ id: rule.id, is_active: checked })}
                      />
                    </div>
                    <CardTitle className="mt-4 text-lg">{rule.name}</CardTitle>
                    <CardDescription className="line-clamp-2 min-h-[40px]">{rule.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 pt-2 border-t border-border/50 mt-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {getEventIcon(rule.event_type)}
                        <span>Trigger: <span className="text-foreground capitalize">{rule.event_type.replace(/on_/g, '').replace(/_/g, ' ')}</span></span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Settings2 className="h-4 w-4" />
                        <span>Action: <span className="text-foreground capitalize">{rule.action_type.replace(/_/g, ' ')}</span></span>
                      </div>
                    </div>
                    <div className="flex justify-end mt-6 gap-2">
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => deleteRule.mutate(rule.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {isLoading && [1, 2, 3].map(i => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-secondary/20 rounded-xl" />
                </Card>
              ))}
              {!isLoading && rules?.length === 0 && (
                <div className="col-span-full py-16 text-center border-2 border-dashed rounded-2xl border-muted bg-secondary/10">
                  <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-20" />
                  <p className="text-muted-foreground font-medium">No automation rules configured yet.</p>
                  <Button variant="link" className="text-primary mt-2" onClick={() => setIsAddRuleOpen(true)}>Create your first rule</Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="routing" className="space-y-6">
            <Card variant="elevated">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shuffle className="h-5 w-5 text-primary" />
                  <CardTitle>Global Folio Routing Rules</CardTitle>
                </div>
                <CardDescription>Overview of all active charge distribution rules across guest folios.</CardDescription>
              </CardHeader>
              <CardContent className="p-0 sm:p-6">
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-secondary/50 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border">
                        <tr>
                          <th className="px-4 py-3 font-medium">Source Folio</th>
                          <th className="px-4 py-3 font-medium">Category</th>
                          <th className="px-4 py-3 font-medium">Target Folio</th>
                          <th className="px-4 py-3 font-medium text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {routingRules?.map((rule: any) => (
                          <tr key={rule.id} className="hover:bg-secondary/30 transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-mono font-bold text-primary">{rule.folio?.folio_number}</p>
                              <p className="text-xs text-muted-foreground">{rule.folio?.guests?.first_name} {rule.folio?.guests?.last_name}</p>
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant="outline" className="capitalize text-[10px]">{rule.category}</Badge>
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-mono font-bold text-primary">{rule.target_folio?.folio_number}</p>
                              <p className="text-xs text-muted-foreground">{rule.target_folio?.guests?.first_name} {rule.target_folio?.guests?.last_name}</p>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Badge className={rule.is_active ? "bg-success/20 text-success border-success/30" : "bg-muted text-muted-foreground"}>
                                {rule.is_active ? 'Active' : 'Paused'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                        {!isLoadingRouting && routingRules?.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground italic">
                              No routing rules active at the moment.
                            </td>
                          </tr>
                        )}
                        {isLoadingRouting && (
                           <tr>
                            <td colSpan={4} className="px-4 py-12 text-center">
                              <Clock className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </ErrorBoundary>
    </MainLayout>
  );
};

export default Automation;
