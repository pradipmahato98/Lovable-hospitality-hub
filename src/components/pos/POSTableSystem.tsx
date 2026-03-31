import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Users,
  Clock,
  Check,
  X,
  GitMerge,
  Split,
  ArrowRightLeft,
  Pause,
  Play,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  usePOSTables,
  useUpdatePOSTable,
  ensureActivePOSOrderForTable,
  OrderItem,
} from "@/hooks/usePOS";
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
import { Label } from "@/components/ui/label";

interface TableInfo {
  id: string;
  number: string;
  capacity: number;
  status: "available" | "occupied" | "reserved" | "billing" | "held";
  guests?: number;
  server?: string;
  startTime?: string;
  orders: OrderItem[];
}

const statusColors = {
  available: "bg-success/20 text-success border-success/30",
  occupied: "bg-primary/20 text-primary border-primary/30",
  reserved: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  billing: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  held: "bg-muted text-muted-foreground border-muted",
};

interface POSTableSystemProps {
  onTableSelect?: (table: TableInfo) => void;
}

export function POSTableSystem({ onTableSelect }: POSTableSystemProps) {
  const {
    data: posTables,
    isLoading,
    realtimeStatus,
  } = usePOSTables();
  const updateTable = useUpdatePOSTable();

  const tables: TableInfo[] = posTables.map((t) => ({
    id: t.id,
    number: t.table_number,
    capacity: t.capacity,
    status: t.status,
    guests: t.guests || undefined,
    server: t.server_name || undefined,
    startTime: t.start_time || undefined,
    orders: (t.current_order || []) as OrderItem[],
  }));

  const [selectedTable, setSelectedTable] = useState<TableInfo | null>(null);
  const [selectedTableIds, setSelectedTableIds] = useState<string[]>([]);
  const [guestCount, setGuestCount] = useState("2");
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [targetTableId, setTargetTableId] = useState("");

  const toggleTableSelection = (tableId: string) => {
    setSelectedTableIds((prev) =>
      prev.includes(tableId)
        ? prev.filter((id) => id !== tableId)
        : [...prev, tableId]
    );
  };

  const clearTableSelection = () => {
    setSelectedTableIds([]);
  };

  const handleSelectTable = (table: TableInfo) => {
    setSelectedTable(table);
    if (onTableSelect && table.status !== "available") {
      onTableSelect(table);
    }
  };

  const handleOpenTable = async () => {
    if (!selectedTable || !guestCount) return;
    const now = new Date().toISOString();

    try {
      await updateTable.mutateAsync({
        id: selectedTable.id,
        updates: {
          status: "occupied",
          guests: parseInt(guestCount),
          start_time: now,
          server_name: "Current User",
          current_order: [],
        },
      });

      await ensureActivePOSOrderForTable({
        tableId: selectedTable.id,
        tableNumber: selectedTable.number,
        guests: parseInt(guestCount),
        serverName: "Current User",
        startTime: now,
      });

      toast.success(`Table ${selectedTable.number} opened with ${guestCount} guests`);
      if (onTableSelect) {
        onTableSelect({
          ...selectedTable,
          status: "occupied",
          guests: parseInt(guestCount),
          startTime: now,
        });
      }
    } catch (error) {
      console.error("Error opening table:", error);
      toast.error("Failed to open table");
    }
  };

  const handleTransferTable = async (targetTableId: string) => {
    if (!selectedTable) return;
    const targetTable = tables.find((t) => t.id === targetTableId);
    if (!targetTable) return;

    try {
      await updateTable.mutateAsync({
        id: targetTableId,
        updates: {
          status: "occupied",
          guests: selectedTable.guests,
          server_name: selectedTable.server,
          start_time: selectedTable.startTime || new Date().toISOString(),
          current_order: selectedTable.orders,
        },
      });

      await updateTable.mutateAsync({
        id: selectedTable.id,
        updates: {
          status: "available",
          guests: null,
          server_name: null,
          start_time: null,
          current_order: [],
        },
      });

      toast.success(`Order transferred to Table ${targetTable.number}`);
      setSelectedTable(null);
      setSelectedTableIds([]);
    } catch (error) {
      console.error("Error transferring table:", error);
      toast.error("Failed to transfer order");
    }
  };

  const handleMergeTables = async (targetTableId: string) => {
    if (!selectedTable) return;
    const targetTable = tables.find((t) => t.id === targetTableId);
    if (!targetTable) return;

    try {
      const mergedWith = [...(selectedTable.orders.length > 0 ? [targetTable.number] : [])];
      await updateTable.mutateAsync({
        id: selectedTable.id,
        updates: {
          merged_with: mergedWith.length > 0 ? mergedWith : null,
          capacity: selectedTable.capacity + targetTable.capacity,
        },
      });

      await updateTable.mutateAsync({
        id: targetTableId,
        updates: {
          status: "reserved",
          merged_with: [selectedTable.number],
        },
      });

      toast.success(`Table ${targetTable.number} merged with Table ${selectedTable.number}`);
    } catch (error) {
      console.error("Error merging tables:", error);
      toast.error("Failed to merge tables");
    }
  };

  const handleHoldTable = async (tableId?: string) => {
    const id = tableId || selectedTable?.id;
    if (!id) return;
    try {
      await updateTable.mutateAsync({ id, updates: { status: "held" } });
      toast.success(`Table put on hold`);
    } catch (error) {
      toast.error("Failed to hold table");
    }
  };

  const handleResumeTable = async (tableId?: string) => {
    const id = tableId || selectedTable?.id;
    if (!id) return;
    try {
      await updateTable.mutateAsync({ id, updates: { status: "occupied" } });
      toast.success(`Table resumed`);
    } catch (error) {
      toast.error("Failed to resume table");
    }
  };

  const getTableTotal = (table: TableInfo) => {
    return table.orders.reduce((sum, o) => sum + o.price * o.quantity, 0);
  };

  const getElapsedTime = (startTime: string | undefined) => {
    if (!startTime) return "";
    const diff = Date.now() - new Date(startTime).getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const availableTables = tables.filter(
    (t) => t.id !== selectedTable?.id && t.status === "available"
  );

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center p-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Table Action Bar */}
      <div className="flex flex-wrap gap-2 p-3 bg-secondary/30 rounded-lg items-center">
        {selectedTableIds.length > 0 && (
          <Badge variant="outline" className="gap-1 mr-2 px-3 py-1 bg-primary/10 border-primary/30 text-primary font-bold">
            {selectedTableIds.length} selected
            <button onClick={clearTableSelection} className="ml-1 hover:bg-secondary rounded p-0.5">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}

        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={selectedTableIds.length !== 1 || availableTables.length === 0}
          onClick={() => {
            const table = tables.find(t => t.id === selectedTableIds[0]);
            if (table) {
              setSelectedTable(table);
              setTransferDialogOpen(true);
            }
          }}
        >
          <ArrowRightLeft className="h-4 w-4" />
          Transfer
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={selectedTableIds.length < 2}
          onClick={() => {
            const firstTable = tables.find(t => t.id === selectedTableIds[0]);
            if (firstTable) {
              setSelectedTable(firstTable);
              selectedTableIds.slice(1).forEach(id => handleMergeTables(id));
            }
          }}
        >
          <GitMerge className="h-4 w-4" />
          Merge
        </Button>

        <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full">
          {realtimeStatus === "connected" ? (
            <Wifi className="h-4 w-4 text-success" />
          ) : (
            <WifiOff className="h-4 w-4 text-destructive" />
          )}
          {realtimeStatus === "connected" ? "Real-time Synced" : "Connecting..."}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {tables.map((table) => {
          const isChecked = selectedTableIds.includes(table.id);
          const isOccupied = table.status !== "available";

          return (
            <Card
              key={table.id}
              className={`cursor-pointer transition-all hover:scale-[1.02] active:scale-95 relative overflow-hidden ${
                selectedTable?.id === table.id ? "ring-2 ring-primary shadow-lg" : ""
              } ${isChecked ? "ring-2 ring-primary bg-primary/5" : "bg-slate-900/40 border-slate-800"}`}
              onClick={() => handleSelectTable(table)}
            >
              {isOccupied && (
                <div className="absolute top-3 left-3 z-10" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={() => toggleTableSelection(table.id)}
                    className="h-5 w-5 border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                </div>
              )}

              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-2xl font-black ${isOccupied ? "ml-8" : ""}`}>T{table.number}</span>
                  <Badge variant="outline" className={`${statusColors[table.status]} font-bold`}>
                    {table.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{table.guests || 0}/{table.capacity}</span>
                </div>
                {table.startTime && (
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-2 font-mono">
                    <Clock className="h-3 w-3" />
                    <span>{getElapsedTime(table.startTime)}</span>
                  </div>
                )}
                {table.orders.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-800">
                    <span className="text-sm font-bold text-blue-500 font-mono">
                      NPR {getTableTotal(table).toFixed(2)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedTable?.status === "available" && (
        <Card className="mt-4 p-6 bg-blue-500/5 border-blue-500/20 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                 <Users className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Open Table {selectedTable.number}</h3>
                <p className="text-sm text-muted-foreground font-medium">Standard capacity: {selectedTable.capacity} guests</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 bg-slate-900/50 p-1.5 rounded-xl border border-slate-800">
                <span className="text-xs font-bold text-slate-400 ml-2">GUESTS:</span>
                <Input
                  type="number"
                  value={guestCount}
                  onChange={(e) => setGuestCount(e.target.value)}
                  className="w-16 bg-slate-950 border-none h-8 text-center font-bold"
                  min={1}
                />
              </div>
              <Button
                variant="blue"
                onClick={handleOpenTable}
                disabled={updateTable.isPending}
                className="rounded-xl h-11 px-6 shadow-lg shadow-blue-500/20"
              >
                {updateTable.isPending ? "Opening..." : "Open Table"}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Transfer Dialog */}
      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <ArrowRightLeft className="h-5 w-5 text-blue-500" />
              Transfer Order
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Transfer Table {selectedTable?.number}'s order to another available table.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label className="text-white font-bold">Select destination table</Label>
              <Select value={targetTableId} onValueChange={setTargetTableId}>
                <SelectTrigger className="bg-slate-950 border-slate-800 rounded-2xl h-12">
                  <SelectValue placeholder="Available tables..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  {availableTables.map((table) => (
                    <SelectItem key={table.id} value={table.id} className="focus:bg-blue-500/10 focus:text-blue-500">
                      Table {table.number} (Cap: {table.capacity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="ghost" onClick={() => setTransferDialogOpen(false)} className="rounded-2xl h-11">
                Cancel
              </Button>
              <Button
                variant="blue"
                className="rounded-2xl h-11 px-6"
                onClick={() => {
                  handleTransferTable(targetTableId);
                  setTransferDialogOpen(false);
                  setTargetTableId("");
                }}
                disabled={!targetTableId}
              >
                Execute Transfer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Merge Dialog */}
      <Dialog open={mergeDialogOpen} onOpenChange={setMergeDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <GitMerge className="h-5 w-5 text-emerald-500" />
              Merge Tables
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Consolidate Table {selectedTable?.number} with another table.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label className="text-white font-bold">Merge with</Label>
              <Select value={targetTableId} onValueChange={setTargetTableId}>
                <SelectTrigger className="bg-slate-950 border-slate-800 rounded-2xl h-12">
                  <SelectValue placeholder="Select table..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  {availableTables.map((table) => (
                    <SelectItem key={table.id} value={table.id} className="focus:bg-emerald-500/10 focus:text-emerald-500">
                      Table {table.number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="ghost" onClick={() => setMergeDialogOpen(false)} className="rounded-2xl h-11">
                Cancel
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl h-11 px-6 shadow-lg shadow-emerald-600/20"
                onClick={() => {
                  handleMergeTables(targetTableId);
                  setMergeDialogOpen(false);
                  setTargetTableId("");
                }}
                disabled={!targetTableId}
              >
                Confirm Merge
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
