import { useState, useMemo, useCallback } from "react";
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
  UtensilsCrossed,
  Plus,
  Search,
  Leaf,
  AlertTriangle,
  Package,
  Users,
  Eye,
  X,
} from "lucide-react";
import { toast } from "sonner";

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
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [venueFilter, setVenueFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({ key: "event_date", direction: "asc" });

  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [noOrderDialogOpen, setNoOrderDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<BanquetEvent | null>(null);
  
  // Local state for catering orders (would be DB in production)
  const [cateringOrders, setCateringOrders] = useState<CateringOrder[]>([]);

  const [newOrder, setNewOrder] = useState({
    menuPackage: "standard",
    courses: [] as string[],
    dietaryRequirements: [] as string[],
    servingStyle: "Buffet",
    beverages: [] as string[],
    specialNotes: "",
  });

  // Unique types and venues for filters
  const eventTypes = useMemo(() => {
    return Array.from(new Set(events.map((e) => e.event_type))).filter(Boolean).sort();
  }, [events]);

  const venues = useMemo(() => {
    return Array.from(new Set(events.map((e) => e.venue))).filter(Boolean).sort();
  }, [events]);

  // Filter and sort active events
  const activeEvents = useMemo(() => {
    // Inner function for filtering/sorting to avoid dependency on outer functions
    const findOrder = (eventId: string) => cateringOrders.find((o) => o.eventId === eventId);

    let result = events.filter(
      (e) => e.status !== "completed" && e.status !== "cancelled"
    );

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.event_name.toLowerCase().includes(query) ||
          e.client_name.toLowerCase().includes(query)
      );
    }

    // Status filter (Catering Order Status)
    if (statusFilter !== "all") {
      result = result.filter((e) => {
        const order = findOrder(e.id);
        if (statusFilter === "none") return !order;
        return order?.status === statusFilter;
      });
    }

    // Type filter
    if (typeFilter !== "all") {
      result = result.filter((e) => e.event_type === typeFilter);
    }

    // Venue filter
    if (venueFilter !== "all") {
      result = result.filter((e) => e.venue === venueFilter);
    }

    // Sorting
    result.sort((a, b) => {
      let aValue: string | number | null | undefined;
      let bValue: string | number | null | undefined;

      if (sortConfig.key === "estimatedCost" || sortConfig.key === "cateringStatus") {
        const aOrder = findOrder(a.id);
        const bOrder = findOrder(b.id);

        if (sortConfig.key === "estimatedCost") {
          aValue = aOrder?.estimatedCost || 0;
          bValue = bOrder?.estimatedCost || 0;
        } else {
          aValue = aOrder?.status || "";
          bValue = bOrder?.status || "";
        }
      } else {
        const valA = a[sortConfig.key as keyof BanquetEvent];
        const valB = b[sortConfig.key as keyof BanquetEvent];
        aValue = typeof valA === 'string' || typeof valA === 'number' ? valA : null;
        bValue = typeof valB === 'string' || typeof valB === 'number' ? valB : null;
      }

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });

    return result;
  }, [events, searchQuery, statusFilter, typeFilter, venueFilter, sortConfig, cateringOrders]);

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Get catering order for an event
  const getOrderForEvent = useCallback((eventId: string) => {
    return cateringOrders.find((o) => o.eventId === eventId);
  }, [cateringOrders]);

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

  const handleOpenDetailsDialog = (event: BanquetEvent) => {
    setSelectedEvent(event);
    const order = getOrderForEvent(event.id);
    if (order) {
      setDetailsDialogOpen(true);
    } else {
      setNoOrderDialogOpen(true);
    }
  };

  const handleSaveOrder = () => {
    if (!selectedEvent) return;

    const pkg = menuPackages.find((p) => p.id === newOrder.menuPackage);
    const estimatedCost = (pkg?.pricePerHead || 0) * selectedEvent.guest_count;

    const order: CateringOrder = {
      id: getOrderForEvent(selectedEvent.id)?.id || crypto.randomUUID(),
      eventId: selectedEvent.id,
      menuPackage: newOrder.menuPackage,
      courses: newOrder.courses,
      dietaryRequirements: newOrder.dietaryRequirements,
      servingStyle: newOrder.servingStyle,
      beverages: newOrder.beverages,
      specialNotes: newOrder.specialNotes,
      estimatedCost,
      status: "pending",
    };

    setCateringOrders((prev) => {
      const existing = prev.findIndex((o) => o.eventId === selectedEvent.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = order;
        return updated;
      }
      return [...prev, order];
    });

    toast.success("Catering order saved");
    setOrderDialogOpen(false);
    setSelectedEvent(null);
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
    setCateringOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
    toast.success(`Order status updated to ${status}`);
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

      {/* Search & Filter */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-8"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {eventTypes.map(t => (
              <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Order Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="none">No Order</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="preparing">Preparing</SelectItem>
            <SelectItem value="ready">Ready</SelectItem>
            <SelectItem value="served">Served</SelectItem>
          </SelectContent>
        </Select>

        <Select value={venueFilter} onValueChange={setVenueFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Venues" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Venues</SelectItem>
            {venues.map(v => (
              <SelectItem key={v} value={v}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(searchQuery || statusFilter !== "all" || typeFilter !== "all" || venueFilter !== "all") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("all");
              setTypeFilter("all");
              setVenueFilter("all");
            }}
            className="h-9 px-2 lg:px-3 text-muted-foreground hover:text-foreground"
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Events with Catering */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort("event_name")}
                >
                  Event {sortConfig.key === "event_name" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort("event_date")}
                >
                  Date {sortConfig.key === "event_date" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort("guest_count")}
                >
                  Guests {sortConfig.key === "guest_count" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead>Menu Package</TableHead>
                <TableHead>Dietary</TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort("estimatedCost")}
                >
                  Est. Cost {sortConfig.key === "estimatedCost" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort("cateringStatus")}
                >
                  Status {sortConfig.key === "cateringStatus" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeEvents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                    No active events found
                  </TableCell>
                </TableRow>
              ) : (
                activeEvents.map((event) => {
                  const order = getOrderForEvent(event.id);
                  const pkg = order
                    ? menuPackages.find((p) => p.id === order.menuPackage)
                    : null;
                  return (
                    <TableRow key={event.id}>
                      <TableCell className="w-[50px]">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDetailsDialog(event)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
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
                        {order ? `$${order.estimatedCost.toLocaleString()}` : "-"}
                      </TableCell>
                      <TableCell>
                        {order ? (
                          <Select
                            value={order.status}
                            onValueChange={(v: CateringOrder["status"]) =>
                              updateOrderStatus(order.id, v)
                            }
                          >
                            <SelectTrigger className="w-28">
                              <Badge variant="outline" className={statusColors[order.status]}>
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
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenOrderDialog(event)}
                        >
                          {order ? "Edit" : "Add"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* No Order Dialog */}
      <Dialog open={noOrderDialogOpen} onOpenChange={setNoOrderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>No Catering Order</DialogTitle>
            <DialogDescription>
              No catering order has been configured for this event yet.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setNoOrderDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setNoOrderDialogOpen(false);
              if (selectedEvent) handleOpenOrderDialog(selectedEvent);
            }}>
              Configure Setup Now
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Catering Details: {selectedEvent?.event_name}
            </DialogTitle>
            <DialogDescription>
              View catering requirements and order status
            </DialogDescription>
          </DialogHeader>

          {selectedEvent && getOrderForEvent(selectedEvent.id) && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Menu Package</p>
                  <p>{menuPackages.find(p => p.id === getOrderForEvent(selectedEvent.id)?.menuPackage)?.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Serving Style</p>
                  <p>{getOrderForEvent(selectedEvent.id)?.servingStyle}</p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Dietary Requirements</p>
                <div className="flex flex-wrap gap-2">
                  {getOrderForEvent(selectedEvent.id)?.dietaryRequirements.length ? (
                    getOrderForEvent(selectedEvent.id)?.dietaryRequirements.map(d => (
                      <Badge key={d} variant="outline">{d}</Badge>
                    ))
                  ) : (
                    <p className="text-sm">None</p>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Beverages</p>
                <div className="flex flex-wrap gap-2">
                  {getOrderForEvent(selectedEvent.id)?.beverages.map(b => (
                    <Badge key={b} variant="secondary">{b}</Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Special Notes</p>
                <p className="text-sm p-3 rounded-lg bg-muted whitespace-pre-wrap">
                  {getOrderForEvent(selectedEvent.id)?.specialNotes || "No special notes"}
                </p>
              </div>

              <div className="flex justify-between items-center p-4 rounded-lg bg-secondary/50 border">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge className={statusColors[getOrderForEvent(selectedEvent.id)!.status]}>
                    {getOrderForEvent(selectedEvent.id)?.status}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-muted-foreground">Estimated Cost</p>
                  <p className="text-xl font-bold">${getOrderForEvent(selectedEvent.id)?.estimatedCost.toLocaleString()}</p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
              <Button onClick={handleSaveOrder}>Save Order</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
