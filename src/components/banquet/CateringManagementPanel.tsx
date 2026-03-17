import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  UtensilsCrossed,
  Plus,
  Search,
  Leaf,
  AlertTriangle,
  Package,
  Users,
  Eye,
  MoreVertical,
  ArrowUpDown,
  Filter,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import {
  useCateringOrders,
  useCreateCateringOrder,
  useUpdateCateringOrder,
  CateringOrder
} from "@/hooks/useBanquetData";

interface BanquetEvent {
  id: string;
  event_name: string;
  event_type: string;
  client_name: string;
  event_date: string;
  venue: string;
  guest_count: number;
  status: "inquiry" | "confirmed" | "in_progress" | "completed" | "cancelled";
  menu_package: string | null;
  special_requests: string | null;
}

interface CateringOrder {
  id: string;
  eventId: string;
  menuPackage: string;
  courses: string[];
  dietaryRequirements: string[];
  servingStyle: string;
  beverages: string[];
  specialNotes: string;
  estimatedCost: number;
  status: "pending" | "confirmed" | "preparing" | "ready" | "served";
}

interface CateringManagementPanelProps {
  events: BanquetEvent[];
  onViewDetails?: (event: BanquetEvent) => void;
}

const menuPackages = [
  { id: "standard", name: "Standard Buffet", pricePerHead: 45 },
  { id: "premium", name: "Premium Buffet", pricePerHead: 75 },
  { id: "deluxe", name: "Deluxe Plated", pricePerHead: 95 },
  { id: "gourmet", name: "Gourmet Experience", pricePerHead: 125 },
  { id: "custom", name: "Custom Menu", pricePerHead: 0 },
];

const dietaryOptions = [
  "Vegetarian",
  "Vegan",
  "Gluten-Free",
  "Halal",
  "Kosher",
  "Nut-Free",
  "Dairy-Free",
  "Seafood-Free",
];

const servingStyles = ["Buffet", "Plated Service", "Family Style", "Cocktail", "Food Stations"];

const beverageOptions = [
  "Soft Drinks",
  "Juices",
  "Coffee & Tea",
  "Wine Selection",
  "Full Bar",
  "Mocktails",
  "Signature Cocktails",
];

export function CateringManagementPanel({ events }: CateringManagementPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<BanquetEvent | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  
  // Database persistence for catering orders
  const { data: cateringOrders = [], isLoading } = useCateringOrders();
  const createOrderMutation = useCreateCateringOrder();
  const updateOrderMutation = useUpdateCateringOrder();

  const [newOrder, setNewOrder] = useState({
    menuPackage: "standard",
    courses: [] as string[],
    dietaryRequirements: [] as string[],
    servingStyle: "Buffet",
    beverages: [] as string[],
    specialNotes: "",
  });

  // Get catering order for an event
  const getOrderForEvent = (eventId: string) => {
    return cateringOrders.find((o) => o.event_id === eventId);
  };

  // Filter and sort active events
  const activeEvents = useMemo(() => {
    return events
      .filter((e) => {
        const matchesSearch = e.event_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            e.client_name.toLowerCase().includes(searchQuery.toLowerCase());
        const order = getOrderForEvent(e.id);
        const matchesStatus = statusFilter === "all" || (order?.status === statusFilter) || (statusFilter === "none" && !order);

        return e.status !== "cancelled" && matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (!sortConfig) return 0;
        let aValue: any = a[sortConfig.key as keyof BanquetEvent];
        let bValue: any = b[sortConfig.key as keyof BanquetEvent];

        if (sortConfig.key === "estimated_cost") {
          aValue = getOrderForEvent(a.id)?.estimated_cost || 0;
          bValue = getOrderForEvent(b.id)?.estimated_cost || 0;
        }

        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
  }, [events, searchQuery, statusFilter, cateringOrders, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  const handleOpenOrderDialog = (event: BanquetEvent) => {
    setSelectedEvent(event);
    const existingOrder = getOrderForEvent(event.id);
    if (existingOrder) {
      setNewOrder({
        menuPackage: existingOrder.menuPackage,
        courses: existingOrder.courses,
        dietaryRequirements: existingOrder.dietaryRequirements,
        servingStyle: existingOrder.servingStyle,
        beverages: existingOrder.beverages,
        specialNotes: existingOrder.specialNotes,
      });
    } else {
      setNewOrder({
        menuPackage: "standard",
        courses: [],
        dietaryRequirements: [],
        servingStyle: "Buffet",
        beverages: ["Soft Drinks", "Coffee & Tea"],
        specialNotes: event.special_requests || "",
      });
    }
    setOrderDialogOpen(true);
  };

  const handleSaveOrder = async () => {
    if (!selectedEvent) return;

    const pkg = menuPackages.find((p) => p.id === newOrder.menuPackage);
    const estimatedCost = (pkg?.pricePerHead || 0) * selectedEvent.guest_count;

    const existingOrder = getOrderForEvent(selectedEvent.id);

    const orderData = {
      event_id: selectedEvent.id,
      menu_package: newOrder.menuPackage,
      serving_style: newOrder.servingStyle,
      dietary_requirements: newOrder.dietaryRequirements,
      beverages: newOrder.beverages,
      special_notes: newOrder.specialNotes || null,
      estimated_cost: estimatedCost,
      status: existingOrder?.status || "pending" as const,
    };

    try {
      if (existingOrder) {
        await updateOrderMutation.mutateAsync({
          id: existingOrder.id,
          updates: orderData
        });
      } else {
        await createOrderMutation.mutateAsync(orderData);
      }
      setOrderDialogOpen(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error("Error saving catering order:", error);
    }
  };

  const handleToggleDietary = (diet: string) => {
    setNewOrder((prev) => ({
      ...prev,
      dietaryRequirements: prev.dietaryRequirements.includes(diet)
        ? prev.dietaryRequirements.filter((d) => d !== diet)
        : [...prev.dietaryRequirements, diet],
    }));
  };

  const handleToggleBeverage = (bev: string) => {
    setNewOrder((prev) => ({
      ...prev,
      beverages: prev.beverages.includes(bev)
        ? prev.beverages.filter((b) => b !== bev)
        : [...prev.beverages, bev],
    }));
  };

  const updateOrderStatus = (orderId: string, status: CateringOrder["status"]) => {
    updateOrderMutation.mutate({ id: orderId, updates: { status } });
  };

  const statusColors: Record<string, string> = {
    pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    confirmed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    preparing: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    ready: "bg-success/20 text-success border-success/30",
    served: "bg-muted text-muted-foreground border-muted",
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{cateringOrders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">
                  {cateringOrders.filter((o) => o.status === "pending").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <UtensilsCrossed className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Preparing</p>
                <p className="text-2xl font-bold">
                  {cateringOrders.filter((o) => o.status === "preparing").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <Leaf className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Dietary Requests</p>
                <p className="text-2xl font-bold">
                  {cateringOrders.reduce((s, o) => s + o.dietaryRequirements.length, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Filter by status" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="none">No Order Yet</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="preparing">Preparing</SelectItem>
            <SelectItem value="ready">Ready</SelectItem>
            <SelectItem value="served">Served</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Events with Catering */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UtensilsCrossed className="h-5 w-5" />
            Event Catering Orders
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {activeEvents.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No active events</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("event_name")}>
                    <div className="flex items-center gap-1">Event <ArrowUpDown className="h-3 w-3" /></div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("event_date")}>
                    <div className="flex items-center gap-1">Date <ArrowUpDown className="h-3 w-3" /></div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("guest_count")}>
                    <div className="flex items-center gap-1">Guests <ArrowUpDown className="h-3 w-3" /></div>
                  </TableHead>
                  <TableHead>Menu Package</TableHead>
                  <TableHead>Dietary</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("estimated_cost")}>
                    <div className="flex items-center gap-1">Est. Cost <ArrowUpDown className="h-3 w-3" /></div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeEvents.map((event) => {
                  const order = getOrderForEvent(event.id);
                  const pkg = order
                    ? menuPackages.find((p) => p.id === order.menuPackage)
                    : null;
                  return (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{event.event_name}</p>
                          <p className="text-xs text-muted-foreground">{event.client_name}</p>
                        </div>
                      </TableCell>
                      <TableCell>{event.event_date}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          {event.guest_count}
                        </div>
                      </TableCell>
                      <TableCell>
                        {order ? (
                          <Badge variant="outline">{pkg?.name || order.menuPackage}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">Not set</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {order && order.dietaryRequirements.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {order.dietaryRequirements.slice(0, 2).map((d) => (
                              <Badge key={d} variant="secondary" className="text-xs">
                                {d}
                              </Badge>
                            ))}
                            {order.dietaryRequirements.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{order.dietaryRequirements.length - 2}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">None</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono">
                        {order ? `$${order.estimated_cost.toLocaleString()}` : "-"}
                      </TableCell>
                      <TableCell>
                        {order ? (
                          <Select
                            value={order.status}
                            onValueChange={(v: CateringOrder["status"]) =>
                              updateOrderStatus(order.id, v)
                            }
                          >
                            <SelectTrigger className="w-28 h-8">
                              <Badge variant="outline" className={`${statusColors[order.status]} border-none h-5`}>
                                {order.status}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="confirmed">Confirmed</SelectItem>
                              <SelectItem value="preparing">Preparing</SelectItem>
                              <SelectItem value="ready">Ready</SelectItem>
                              <SelectItem value="served">Served</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant="outline" className="bg-muted">
                            No order
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={() => onViewDetails?.(event)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuLabel>Catering Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleOpenOrderDialog(event)}>
                                <FileText className="mr-2 h-4 w-4" /> {order ? "Edit Order" : "Create Order"}
                              </DropdownMenuItem>
                              {order && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuLabel className="text-[10px] font-normal text-muted-foreground uppercase tracking-wider">Update Status</DropdownMenuLabel>
                                  <DropdownMenuItem onClick={() => updateOrderStatus(order.id, "pending")}>Pending</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => updateOrderStatus(order.id, "confirmed")}>Confirmed</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => updateOrderStatus(order.id, "preparing")}>Preparing</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => updateOrderStatus(order.id, "ready")}>Ready</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => updateOrderStatus(order.id, "served")}>Served</DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Order Dialog */}
      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedEvent ? `Catering for ${selectedEvent.event_name}` : "Catering Order"}
            </DialogTitle>
            <DialogDescription>
              {selectedEvent && (
                <span>
                  {selectedEvent.guest_count} guests • {selectedEvent.event_date} • {selectedEvent.venue}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Menu Package */}
            <div className="space-y-2">
              <Label>Menu Package</Label>
              <Select
                value={newOrder.menuPackage}
                onValueChange={(v) => setNewOrder((p) => ({ ...p, menuPackage: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {menuPackages.map((pkg) => (
                    <SelectItem key={pkg.id} value={pkg.id}>
                      <div className="flex justify-between items-center gap-4">
                        <span>{pkg.name}</span>
                        {pkg.pricePerHead > 0 && (
                          <span className="text-muted-foreground">
                            ${pkg.pricePerHead}/head
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Serving Style */}
            <div className="space-y-2">
              <Label>Serving Style</Label>
              <Select
                value={newOrder.servingStyle}
                onValueChange={(v) => setNewOrder((p) => ({ ...p, servingStyle: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {servingStyles.map((style) => (
                    <SelectItem key={style} value={style}>
                      {style}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dietary Requirements */}
            <div className="space-y-2">
              <Label>Dietary Requirements</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {dietaryOptions.map((diet) => (
                  <div
                    key={diet}
                    className="flex items-center space-x-2 p-2 rounded-lg border cursor-pointer hover:bg-secondary/50"
                    onClick={() => handleToggleDietary(diet)}
                  >
                    <Checkbox checked={newOrder.dietaryRequirements.includes(diet)} />
                    <span className="text-sm">{diet}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Beverages */}
            <div className="space-y-2">
              <Label>Beverages</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {beverageOptions.map((bev) => (
                  <div
                    key={bev}
                    className="flex items-center space-x-2 p-2 rounded-lg border cursor-pointer hover:bg-secondary/50"
                    onClick={() => handleToggleBeverage(bev)}
                  >
                    <Checkbox checked={newOrder.beverages.includes(bev)} />
                    <span className="text-sm">{bev}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Special Notes */}
            <div className="space-y-2">
              <Label>Special Notes</Label>
              <Textarea
                placeholder="Any special requirements, allergies, or preferences..."
                value={newOrder.specialNotes}
                onChange={(e) => setNewOrder((p) => ({ ...p, specialNotes: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Estimated Cost */}
            {selectedEvent && (
              <div className="p-4 rounded-lg bg-secondary/50 border">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Estimated Cost</span>
                  <span className="text-2xl font-bold">
                    $
                    {(
                      (menuPackages.find((p) => p.id === newOrder.menuPackage)?.pricePerHead ||
                        0) * selectedEvent.guest_count
                    ).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Based on {selectedEvent.guest_count} guests × $
                  {menuPackages.find((p) => p.id === newOrder.menuPackage)?.pricePerHead || 0}/head
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOrderDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveOrder}
                disabled={createOrderMutation.isPending || updateOrderMutation.isPending}
              >
                {createOrderMutation.isPending || updateOrderMutation.isPending ? "Saving..." : "Save Order"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
