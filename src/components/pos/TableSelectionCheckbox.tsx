import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface TableSelectionCheckboxProps {
  tableId: string;
  tableNumber: string;
  isSelected: boolean;
  onToggle: (tableId: string) => void;
  disabled?: boolean;
}

export function TableSelectionCheckbox({
  tableId,
  tableNumber,
  isSelected,
  onToggle,
  disabled = false,
}: TableSelectionCheckboxProps) {
  return (
    <div
      className={cn(
        "absolute top-2 left-2 z-10 transition-opacity",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <Checkbox
        checked={isSelected}
        onCheckedChange={() => !disabled && onToggle(tableId)}
        disabled={disabled}
        className="h-5 w-5 border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        aria-label={`Select table ${tableNumber}`}
      />
    </div>
  );
}
