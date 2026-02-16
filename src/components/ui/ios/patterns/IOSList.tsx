import React from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface IOSListProps {
  items: {
    id: string;
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    onClick?: () => void;
  }[];
  className?: string;
}

export const IOSList = ({ items, className }: IOSListProps) => {
  return (
    <div className={cn(
      "w-full overflow-hidden bg-background/50 backdrop-blur-md rounded-2xl border border-border/50 ios-enabled:rounded-[var(--ios-radius)]",
      className
    )}>
      <div className="flex flex-col">
        {items.map((item, index) => (
          <button
            key={item.id}
            onClick={item.onClick}
            className={cn(
              "flex items-center justify-between p-4 text-left transition-colors active:bg-foreground/5",
              index !== items.length - 1 && "border-b border-border/50"
            )}
          >
            <div className="flex items-center gap-4">
              {item.icon && (
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  {item.icon}
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-[15px] font-semibold">{item.title}</span>
                {item.subtitle && (
                  <span className="text-[13px] text-muted-foreground">{item.subtitle}</span>
                )}
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
      </div>
    </div>
  );
};
