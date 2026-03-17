import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
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
  Layout,
  Search,
  CheckCircle2,
  Circle,
  AlertCircle,
  Projector,
  Music,
  Flower2,
  Armchair,
  Lightbulb,
  Mic2,
  Eye,
  MoreVertical,
  ArrowUpDown,
  Filter,
  ClipboardList,
  Settings2,
} from "lucide-react";
import { toast } from "sonner";
import {
  useVenueSetups,
  useCreateVenueSetup,
  useUpdateVenueSetup,
  VenueSetup
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
}

interface SetupItem {
  id: string;
  name: string;
  category: string;
  completed: boolean;
  notes: string;
}

interface VenueSetup {
  id: string;
  eventId: string;
  layoutType: string;
  tableCount: number;
  chairCount: number;
  stageRequired: boolean;
  danceFloor: boolean;
  equipment: string[];
  decorations: string[];
  setupItems: SetupItem[];
  setupStatus: "not_started" | "in_progress" | "completed";
  setupNotes: string;
}

interface VenueSetupPanelProps {
  events: BanquetEvent[];
  onViewDetails?: (event: BanquetEvent) => void;
}

const layoutTypes = [
  { id: "theater", name: "Theater Style", icon: Armchair },
  { id: "banquet", name: "Banquet Rounds", icon: Circle },
  { id: "classroom", name: "Classroom", icon: Layout },
  { id: "cocktail", name: "Cocktail/Standing", icon: Music },
  { id: "ushaped", name: "U-Shaped", icon: Layout },
  { id: "boardroom", name: "Boardroom", icon: Layout },
];

const equipmentOptions = [
  { id: "projector", name: "Projector & Screen", icon: Projector },
  { id: "sound", name: "Sound System", icon: Music },
  { id: "microphones", name: "Wireless Microphones", icon: Mic2 },
  { id: "lighting", name: "Special Lighting", icon: Lightbulb },
  { id: "stage", name: "Stage Platform", icon: Layout },
  { id: "podium", name: "Podium/Lectern", icon: Layout },
];

const decorationOptions = [
  { id: "flowers", name: "Floral Arrangements", icon: Flower2 },
  { id: "linens", name: "Premium Linens", icon: Layout },
  { id: "centerpieces", name: "Centerpieces", icon: Flower2 },
  { id: "backdrop", name: "Photo Backdrop", icon: Layout },
  { id: "lighting", name: "Ambient Lighting", icon: Lightbulb },
  { id: "signage", name: "Custom Signage", icon: Layout },
];

const defaultSetupChecklist: Omit<SetupItem, "id">[] = [
  { name: "Clear and clean venue", category: "Preparation", completed: false, notes: "" },
  { name: "Set up tables", category: "Furniture", completed: false, notes: "" },
  { name: "Arrange chairs", category: "Furniture", completed: false, notes: "" },
  { name: "Install table linens", category: "Decor", completed: false, notes: "" },
  { name: "Set up centerpieces", category: "Decor", completed: false, notes: "" },
  { name: "Install AV equipment", category: "Technical", completed: false, notes: "" },
  { name: "Sound check", category: "Technical", completed: false, notes: "" },
  { name: "Lighting setup", category: "Technical", completed: false, notes: "" },
  { name: "Place signage", category: "Decor", completed: false, notes: "" },
  { name: "Final walkthrough", category: "Preparation", completed: false, notes: "" },
];

export function VenueSetupPanel({ events }: VenueSetupPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [setupDialogOpen, setSetupDialogOpen] = useState(false);
  const [checklistDialogOpen, setChecklistDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<BanquetEvent | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  // Database persistence for venue setups
  const { data: venueSetups = [], isLoading } = useVenueSetups();
  const createSetupMutation = useCreateVenueSetup();
  const updateSetupMutation = useUpdateVenueSetup();

  const [newSetup, setNewSetup] = useState({
    layoutType: "banquet",
    tableCount: 10,
    chairCount: 80,
    stageRequired: false,
    danceFloor: false,
    equipment: [] as string[],
    decorations: [] as string[],
    setupNotes: "",
  });

  // Get setup for an event
  const getSetupForEvent = (eventId: string) => {
    return venueSetups.find((s) => s.event_id === eventId);
  };

  // Filter and sort active events
  const activeEvents = useMemo(() => {
    return events
      .filter((e) => {
        const matchesSearch = e.event_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            e.client_name.toLowerCase().includes(searchQuery.toLowerCase());
        const setup = getSetupForEvent(e.id);
        const matchesStatus = statusFilter === "all" || (setup?.setup_status === statusFilter) || (statusFilter === "none" && !setup);

        return (e.status === "confirmed" || e.status === "in_progress") && matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (!sortConfig) return 0;
        let aValue: any = a[sortConfig.key as keyof BanquetEvent];
        let bValue: any = b[sortConfig.key as keyof BanquetEvent];

        if (sortConfig.key === "progress") {
          aValue = getSetupProgress(getSetupForEvent(a.id));
          bValue = getSetupProgress(getSetupForEvent(b.id));
        }

        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
  }, [events, searchQuery, statusFilter, venueSetups, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  const handleOpenSetupDialog = (event: BanquetEvent) => {
    setSelectedEvent(event);
    const existingSetup = getSetupForEvent(event.id);
    if (existingSetup) {
      setNewSetup({
        layoutType: existingSetup.layoutType,
        tableCount: existingSetup.tableCount,
        chairCount: existingSetup.chairCount,
        stageRequired: existingSetup.stageRequired,
        danceFloor: existingSetup.danceFloor,
        equipment: existingSetup.equipment,
        decorations: existingSetup.decorations,
        setupNotes: existingSetup.setupNotes,
      });
    } else {
      setNewSetup({
        layoutType: "banquet",
        tableCount: Math.ceil(event.guest_count / 8),
        chairCount: event.guest_count,
        stageRequired: event.event_type === "wedding" || event.event_type === "corporate",
        danceFloor: event.event_type === "wedding" || event.event_type === "social",
        equipment: [],
        decorations: [],
        setupNotes: "",
      });
    }
    setSetupDialogOpen(true);
  };

  const handleOpenChecklist = (event: BanquetEvent) => {
    setSelectedEvent(event);
    setChecklistDialogOpen(true);
  };

  const handleSaveSetup = async () => {
    if (!selectedEvent) return;

    const existingSetup = getSetupForEvent(selectedEvent.id);
    
    // Convert SetupItem[] to Record<string, boolean> for the checklist field in DB
    const initialChecklist: Record<string, boolean> = {};
    defaultSetupChecklist.forEach(item => {
      initialChecklist[item.name] = false;
    });

    const setupData = {
      event_id: selectedEvent.id,
      layout_type: newSetup.layoutType,
      table_count: newSetup.tableCount,
      chair_count: newSetup.chairCount,
      stage_required: newSetup.stageRequired,
      dance_floor: newSetup.danceFloor,
      equipment: newSetup.equipment,
      decorations: newSetup.decorations,
      setup_status: existingSetup?.setup_status || "not_started" as const,
      setup_notes: newSetup.setupNotes || null,
      checklist: existingSetup?.checklist || initialChecklist,
    };

    try {
      if (existingSetup) {
        await updateSetupMutation.mutateAsync({
          id: existingSetup.id,
          updates: setupData
        });
      } else {
        await createSetupMutation.mutateAsync(setupData);
      }
      setSetupDialogOpen(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error("Error saving venue setup:", error);
    }
  };

  const handleToggleEquipment = (eq: string) => {
    setNewSetup((prev) => ({
      ...prev,
      equipment: prev.equipment.includes(eq)
        ? prev.equipment.filter((e) => e !== eq)
        : [...prev.equipment, eq],
    }));
  };

  const handleToggleDecoration = (dec: string) => {
    setNewSetup((prev) => ({
      ...prev,
      decorations: prev.decorations.includes(dec)
        ? prev.decorations.filter((d) => d !== dec)
        : [...prev.decorations, dec],
    }));
  };

  const handleToggleChecklistItem = (eventId: string, itemName: string) => {
    const setup = getSetupForEvent(eventId);
    if (!setup) return;

    const newChecklist = { ...setup.checklist, [itemName]: !setup.checklist[itemName] };

    // Calculate new status
    const items = Object.values(newChecklist);
    const completedCount = items.filter(v => v).length;
    let newStatus: VenueSetup["setup_status"] = "not_started";
    if (completedCount === items.length) newStatus = "completed";
    else if (completedCount > 0) newStatus = "in_progress";

    updateSetupMutation.mutate({
      id: setup.id,
      updates: {
        checklist: newChecklist,
        setup_status: newStatus
      }
    });
  };

  const getSetupProgress = (setup: VenueSetup | undefined) => {
    if (!setup || !setup.checklist) return 0;
    const items = Object.values(setup.checklist);
    if (items.length === 0) return 0;
    const completed = items.filter(v => v).length;
    return (completed / items.length) * 100;
  };

  const statusColors: Record<string, string> = {
    not_started: "bg-muted text-muted-foreground border-muted",
    in_progress: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    completed: "bg-success/20 text-success border-success/30",
  };

  // Summary stats
  const stats = useMemo(() => {
    const total = venueSetups.length;
    const completed = venueSetups.filter((s) => s.setup_status === "completed").length;
    const inProgress = venueSetups.filter((s) => s.setup_status === "in_progress").length;
    const notStarted = venueSetups.filter((s) => s.setup_status === "not_started").length;
    return { total, completed, inProgress, notStarted };
  }, [venueSetups]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Layout className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Setups</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Circle className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Not Started</p>
                <p className="text-2xl font-bold">{stats.notStarted}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <AlertCircle className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">{stats.inProgress}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
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
            <SelectItem value="all">All Setups</SelectItem>
            <SelectItem value="none">No Setup Yet</SelectItem>
            <SelectItem value="not_started">Not Started</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Events Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layout className="h-5 w-5" />
            Venue Setup Tracking
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {activeEvents.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No confirmed events requiring setup
            </div>
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
                  <TableHead>Venue</TableHead>
                  <TableHead>Layout</TableHead>
                  <TableHead>Equipment</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("progress")}>
                    <div className="flex items-center gap-1">Progress <ArrowUpDown className="h-3 w-3" /></div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeEvents.map((event) => {
                  const setup = getSetupForEvent(event.id);
                  const progress = getSetupProgress(setup);
                  const layout = setup
                    ? layoutTypes.find((l) => l.id === setup.layoutType)
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
                      <TableCell>{event.venue}</TableCell>
                      <TableCell>
                        {setup ? (
                          <Badge variant="outline">{layout?.name || setup.layoutType}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">Not set</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {setup && setup.equipment.length > 0 ? (
                          <div className="flex items-center gap-1">
                            {setup.equipment.slice(0, 2).map((eq) => {
                              const equip = equipmentOptions.find((e) => e.id === eq);
                              return equip ? (
                                <equip.icon key={eq} className="h-4 w-4 text-muted-foreground" />
                              ) : null;
                            })}
                            {setup.equipment.length > 2 && (
                              <span className="text-xs text-muted-foreground">
                                +{setup.equipment.length - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {setup ? (
                          <div className="w-24">
                            <Progress value={progress} className="h-2" />
                            <p className="text-xs text-muted-foreground mt-1">
                              {progress.toFixed(0)}%
                            </p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {setup ? (
                          <Badge variant="outline" className={statusColors[setup.setup_status]}>
                            {setup.setup_status.replace("_", " ")}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-muted">
                            No setup
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
                              <DropdownMenuLabel>Venue Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleOpenSetupDialog(event)}>
                                <Settings2 className="mr-2 h-4 w-4" /> {setup ? "Edit Setup" : "Create Setup"}
                              </DropdownMenuItem>
                              {setup && (
                                <>
                                  <DropdownMenuItem onClick={() => handleOpenChecklist(event)}>
                                    <ClipboardList className="mr-2 h-4 w-4" /> View Checklist
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuLabel className="text-[10px] font-normal text-muted-foreground uppercase tracking-wider">Update Status</DropdownMenuLabel>
                                  <DropdownMenuItem onClick={() => updateSetupMutation.mutate({ id: setup.id, updates: { setup_status: "not_started" } })}>
                                    Not Started
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => updateSetupMutation.mutate({ id: setup.id, updates: { setup_status: "in_progress" } })}>
                                    In Progress
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => updateSetupMutation.mutate({ id: setup.id, updates: { setup_status: "completed" } })}>
                                    Completed
                                  </DropdownMenuItem>
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

      {/* Setup Dialog */}
      <Dialog open={setupDialogOpen} onOpenChange={setSetupDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedEvent ? `Venue Setup for ${selectedEvent.event_name}` : "Venue Setup"}
            </DialogTitle>
            <DialogDescription>
              {selectedEvent && (
                <span>
                  {selectedEvent.venue} • {selectedEvent.guest_count} guests • {selectedEvent.event_date}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Layout Type */}
            <div className="space-y-2">
              <Label>Layout Type</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {layoutTypes.map((layout) => (
                  <div
                    key={layout.id}
                    className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                      newSetup.layoutType === layout.id
                        ? "bg-primary/10 border-primary"
                        : "hover:bg-secondary/50"
                    }`}
                    onClick={() => setNewSetup((p) => ({ ...p, layoutType: layout.id }))}
                  >
                    <layout.icon className="h-5 w-5" />
                    <span className="text-sm">{layout.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tables and Chairs */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Number of Tables</Label>
                <Input
                  type="number"
                  value={newSetup.tableCount}
                  onChange={(e) =>
                    setNewSetup((p) => ({ ...p, tableCount: parseInt(e.target.value) || 0 }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Number of Chairs</Label>
                <Input
                  type="number"
                  value={newSetup.chairCount}
                  onChange={(e) =>
                    setNewSetup((p) => ({ ...p, chairCount: parseInt(e.target.value) || 0 }))
                  }
                />
              </div>
            </div>

            {/* Special Requirements */}
            <div className="flex gap-4">
              <div
                className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer flex-1 ${
                  newSetup.stageRequired ? "bg-primary/10 border-primary" : ""
                }`}
                onClick={() => setNewSetup((p) => ({ ...p, stageRequired: !p.stageRequired }))}
              >
                <Checkbox checked={newSetup.stageRequired} />
                <span>Stage Required</span>
              </div>
              <div
                className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer flex-1 ${
                  newSetup.danceFloor ? "bg-primary/10 border-primary" : ""
                }`}
                onClick={() => setNewSetup((p) => ({ ...p, danceFloor: !p.danceFloor }))}
              >
                <Checkbox checked={newSetup.danceFloor} />
                <span>Dance Floor</span>
              </div>
            </div>

            {/* Equipment */}
            <div className="space-y-2">
              <Label>Equipment Needed</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {equipmentOptions.map((eq) => (
                  <div
                    key={eq.id}
                    className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer hover:bg-secondary/50 ${
                      newSetup.equipment.includes(eq.id) ? "bg-primary/10 border-primary" : ""
                    }`}
                    onClick={() => handleToggleEquipment(eq.id)}
                  >
                    <Checkbox checked={newSetup.equipment.includes(eq.id)} />
                    <eq.icon className="h-4 w-4" />
                    <span className="text-sm">{eq.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Decorations */}
            <div className="space-y-2">
              <Label>Decorations</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {decorationOptions.map((dec) => (
                  <div
                    key={dec.id}
                    className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer hover:bg-secondary/50 ${
                      newSetup.decorations.includes(dec.id) ? "bg-primary/10 border-primary" : ""
                    }`}
                    onClick={() => handleToggleDecoration(dec.id)}
                  >
                    <Checkbox checked={newSetup.decorations.includes(dec.id)} />
                    <dec.icon className="h-4 w-4" />
                    <span className="text-sm">{dec.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Setup Notes</Label>
              <Textarea
                placeholder="Any special instructions or requirements..."
                value={newSetup.setupNotes}
                onChange={(e) => setNewSetup((p) => ({ ...p, setupNotes: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSetupDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveSetup}>Save Setup</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Checklist Dialog */}
      <Dialog open={checklistDialogOpen} onOpenChange={setChecklistDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Setup Checklist</DialogTitle>
            <DialogDescription>
              {selectedEvent && selectedEvent.event_name}
            </DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4">
              {(() => {
                const setup = getSetupForEvent(selectedEvent.id);
                if (!setup) return <p className="text-muted-foreground">No setup configured</p>;

                // Use the checklist from DB or default if empty
                const checklist = setup.checklist || {};
                const items = Object.entries(checklist);
                
                if (items.length === 0) return <p className="text-muted-foreground">No items in checklist</p>;

                return (
                  <div className="space-y-1">
                    {items.map(([name, completed]) => (
                      <div
                        key={name}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          completed
                            ? "bg-success/10 border-success/30"
                            : "hover:bg-secondary/50"
                        }`}
                        onClick={() => handleToggleChecklistItem(selectedEvent.id, name)}
                      >
                        {completed ? (
                          <CheckCircle2 className="h-5 w-5 text-success" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        )}
                        <span className={completed ? "line-through text-muted-foreground" : ""}>
                          {name}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })()}

              <div className="pt-4 border-t">
                <Progress value={getSetupProgress(getSetupForEvent(selectedEvent.id))} />
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  {getSetupProgress(getSetupForEvent(selectedEvent.id)).toFixed(0)}% Complete
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
