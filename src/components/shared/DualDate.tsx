import { adToBS, formatBSDate, isoToBS } from "@/lib/nepaliDate";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn, formatAD } from "@/lib/utils";

interface DualDateProps {
  /** ISO string (YYYY-MM-DD) or Date object */
  date: string | Date;
  /** Show format for AD date */
  adFormat?: string;
  /** Show format for BS date */
  bsFormat?: "short" | "long" | "nepali";
  /** Show only BS date */
  bsOnly?: boolean;
  /** Additional class */
  className?: string;
  /** Compact mode - show BS in tooltip only */
  compact?: boolean;
}

export function DualDate({
  date,
  adFormat = "dd/MM/yyyy",
  bsFormat = "long",
  bsOnly = false,
  className,
  compact = false,
}: DualDateProps) {
  const adDate = typeof date === "string" ? new Date(date) : date;
  const bsDate = adToBS(adDate);
  const adFormatted = formatAD(adDate);
  const bsFormatted = formatBSDate(bsDate, bsFormat);

  if (bsOnly) {
    return <span className={cn("text-foreground", className)}>{bsFormatted}</span>;
  }

  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn("text-foreground cursor-help border-b border-dotted border-muted-foreground/30", className)}>
            {adFormatted}
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          <span className="text-muted-foreground">BS:</span>{" "}
          <span className="font-medium">{bsFormatted}</span>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <span className={cn("inline-flex flex-col leading-tight", className)}>
      <span className="text-foreground">{adFormatted}</span>
      <span className="text-[10px] text-muted-foreground">{bsFormatted} BS</span>
    </span>
  );
}

interface DualDateBadgeProps {
  date: string | Date;
  className?: string;
}

/** Small inline badge showing both dates */
export function DualDateBadge({ date, className }: DualDateBadgeProps) {
  const adDate = typeof date === "string" ? new Date(date) : date;
  const bsDate = adToBS(adDate);
  const bsFormatted = formatBSDate(bsDate, "short");
  const adFormatted = format(adDate, "yyyy/MM/dd");

  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs", className)}>
      <span className="text-foreground">{adFormatted}</span>
      <span className="text-muted-foreground">|</span>
      <span className="text-primary font-medium">{bsFormatted}</span>
    </span>
  );
}
