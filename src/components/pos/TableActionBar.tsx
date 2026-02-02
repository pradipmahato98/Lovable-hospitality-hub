import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRightLeft,
  GitMerge,
  Split,
  Pause,
  Play,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TableActionBarProps {
  selectedTableIds: string[];
  hasAvailableTables: boolean;
  canSplit: boolean;
  isHeld: boolean;
  realtimeStatus: "connected" | "disconnected";
  onTransfer: () => void;
  onMerge: () => void;
  onSplit: () => void;
  onHold: () => void;
  onResume: () => void;
  onClearSelection: () => void;
}

export function TableActionBar({
  selectedTableIds,
  hasAvailableTables,
  canSplit,
  isHeld,
  realtimeStatus,
  onTransfer,
  onMerge,
  onSplit,
  onHold,
  onResume,
  onClearSelection,
}: TableActionBarProps) {
  const hasSelection = selectedTableIds.length > 0;
  const hasSingleSelection = selectedTableIds.length === 1;
  const hasMultiSelection = selectedTableIds.length > 1;

  return (
    <div className="flex flex-wrap gap-2 p-3 bg-secondary/30 rounded-lg items-center">
      {/* Selection count */}
      {hasSelection && (
        <Badge variant="outline" className="gap-1 mr-2">
          {selectedTableIds.length} selected
          <button
            onClick={onClearSelection}
            className="ml-1 hover:bg-secondary rounded p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}

      {/* Transfer - enabled when tables selected and available tables exist */}
      <Button
        variant="outline"
        size="sm"
        className={cn(
          "gap-2 transition-all",
          hasSelection && hasAvailableTables
            ? "border-primary/50 text-primary hover:bg-primary/10"
            : "opacity-50"
        )}
        onClick={onTransfer}
        disabled={!hasSelection || !hasAvailableTables}
      >
        <ArrowRightLeft className="h-4 w-4" />
        Transfer
      </Button>

      {/* Merge - enabled when multiple tables selected */}
      <Button
        variant="outline"
        size="sm"
        className={cn(
          "gap-2 transition-all",
          hasMultiSelection
            ? "border-primary/50 text-primary hover:bg-primary/10"
            : "opacity-50"
        )}
        onClick={onMerge}
        disabled={!hasMultiSelection}
      >
        <GitMerge className="h-4 w-4" />
        Merge
      </Button>

      {/* Split - enabled when single table selected with items */}
      <Button
        variant="outline"
        size="sm"
        className={cn(
          "gap-2 transition-all",
          hasSingleSelection && canSplit
            ? "border-primary/50 text-primary hover:bg-primary/10"
            : "opacity-50"
        )}
        onClick={onSplit}
        disabled={!hasSingleSelection || !canSplit}
      >
        <Split className="h-4 w-4" />
        Split
      </Button>

      {/* Hold/Resume - enabled when single table selected */}
      {isHeld ? (
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-2 transition-all",
            hasSingleSelection
              ? "border-success/50 text-success hover:bg-success/10"
              : "opacity-50"
          )}
          onClick={onResume}
          disabled={!hasSingleSelection}
        >
          <Play className="h-4 w-4" />
          Resume
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-2 transition-all",
            hasSingleSelection
              ? "border-amber-400/50 text-amber-400 hover:bg-amber-400/10"
              : "opacity-50"
          )}
          onClick={onHold}
          disabled={!hasSingleSelection}
        >
          <Pause className="h-4 w-4" />
          Hold
        </Button>
      )}

      {/* Realtime status */}
      <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
        {realtimeStatus === "connected" ? (
          <Wifi className="h-4 w-4 text-success" />
        ) : (
          <WifiOff className="h-4 w-4 text-destructive" />
        )}
        {realtimeStatus === "connected" ? "Synced" : "Offline"}
      </div>
    </div>
  );
}
