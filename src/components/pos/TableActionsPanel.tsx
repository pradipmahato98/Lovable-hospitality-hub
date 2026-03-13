import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  GitMerge,
  Split,
  ArrowRightLeft,
  Pause,
  Play,
  X,
  Users,
} from "lucide-react";
import { POSTable } from "@/hooks/usePOS";

interface TableActionsPanelProps {
  tables: POSTable[];
  selectedTable: POSTable | null;
  onMergeTables: (sourceTableId: string, targetTableId: string) => void;
  onSplitTable: (tableId: string) => void;
  onTransferTable: (sourceTableId: string, targetTableId: string) => void;
  onHoldTable: (tableId: string) => void;
  onResumeTable: (tableId: string) => void;
}

export function TableActionsPanel({
  tables,
  selectedTable,
  onMergeTables,
  onSplitTable,
  onTransferTable,
  onHoldTable,
  onResumeTable,
}: TableActionsPanelProps) {
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [targetTable, setTargetTable] = useState("");

  const availableTables = tables.filter(
    (t) => t.id !== selectedTable?.id && t.status === "available"
  );
  const occupiedTables = tables.filter(
    (t) => t.id !== selectedTable?.id && (t.status === "occupied" || t.status === "billing")
  );

  const handleMerge = () => {
    if (selectedTable && targetTable) {
      onMergeTables(selectedTable.id, targetTable);
      setMergeDialogOpen(false);
      setTargetTable("");
    }
  };

  const handleTransfer = () => {
    if (selectedTable && targetTable) {
      onTransferTable(selectedTable.id, targetTable);
      setTransferDialogOpen(false);
      setTargetTable("");
    }
  };

  if (!selectedTable || selectedTable.status === "available") {
    return null;
  }

  return (
    <>
      <div className="flex flex-wrap gap-2 p-3 bg-secondary/30 rounded-lg">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setMergeDialogOpen(true)}
          disabled={availableTables.length === 0}
        >
          <GitMerge className="h-4 w-4" />
          Merge
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => onSplitTable(selectedTable.id)}
          disabled={!selectedTable.merged_with || selectedTable.merged_with.length === 0}
        >
          <Split className="h-4 w-4" />
          Split
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setTransferDialogOpen(true)}
          disabled={availableTables.length === 0}
        >
          <ArrowRightLeft className="h-4 w-4" />
          Transfer
        </Button>

        {selectedTable.status === "held" ? (
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-success"
            onClick={() => onResumeTable(selectedTable.id)}
          >
            <Play className="h-4 w-4" />
            Resume
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-amber-400"
            onClick={() => onHoldTable(selectedTable.id)}
          >
            <Pause className="h-4 w-4" />
            Hold
          </Button>
        )}

        {selectedTable.merged_with && selectedTable.merged_with.length > 0 && (
          <Badge variant="outline" className="gap-1 ml-auto">
            <Users className="h-3 w-3" />
            Merged: {selectedTable.merged_with.join(", ")}
          </Badge>
        )}
      </div>

      {/* Merge Dialog */}
      <Dialog open={mergeDialogOpen} onOpenChange={setMergeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitMerge className="h-5 w-5" />
              Merge Tables
            </DialogTitle>
            <DialogDescription>
              Merge Table {selectedTable.table_number} with another table
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select table to merge with</Label>
              <Select value={targetTable} onValueChange={setTargetTable}>
                <SelectTrigger>
                  <SelectValue placeholder="Select available table" />
                </SelectTrigger>
                <SelectContent>
                  {availableTables.map((table) => (
                    <SelectItem key={table.id} value={table.id}>
                      Table {table.table_number} (Capacity: {table.capacity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setMergeDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="blue" onClick={handleMerge} disabled={!targetTable}>
                Merge Tables
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5" />
              Transfer Table
            </DialogTitle>
            <DialogDescription>
              Transfer order from Table {selectedTable.table_number} to another table
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select destination table</Label>
              <Select value={targetTable} onValueChange={setTargetTable}>
                <SelectTrigger>
                  <SelectValue placeholder="Select available table" />
                </SelectTrigger>
                <SelectContent>
                  {availableTables.map((table) => (
                    <SelectItem key={table.id} value={table.id}>
                      Table {table.table_number} (Capacity: {table.capacity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setTransferDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="blue" onClick={handleTransfer} disabled={!targetTable}>
                Transfer Order
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
