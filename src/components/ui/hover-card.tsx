import * as React from "react";
import * as HoverCardPrimitive from "@radix-ui/react-hover-card";
import { X } from "lucide-react";
import { usePersistentPopup } from "@/hooks/usePersistentPopup";

import { cn } from "@/lib/utils";

const HoverCard = HoverCardPrimitive.Root;

const HoverCardTrigger = HoverCardPrimitive.Trigger;

import { X } from "lucide-react";
import { usePersistentPopup } from "@/hooks/usePersistentPopup";

const HoverCardContent = React.forwardRef<
  React.ElementRef<typeof HoverCardPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => {
  const { handleInteractionOutside, setClosing, animationClass } = usePersistentPopup();

  return (
    <HoverCardPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-50 w-64 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        animationClass,
        className,
      )}
      onPointerDownOutside={handleInteractionOutside}
      onEscapeKeyDown={handleInteractionOutside}
      {...props}
    >
      <div className="flex justify-end mb-2">
        <button
          type="button"
          className="h-5 w-5 flex items-center justify-center rounded-full hover:bg-destructive/10 hover:text-destructive cursor-pointer transition-colors outline-none focus:bg-destructive/10"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setClosing();
            const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
            e.currentTarget.dispatchEvent(event);
          }}
        >
          <X className="h-3 w-3" />
        </button>
      </div>
      {props.children}
    </HoverCardPrimitive.Content>
  );
});
HoverCardContent.displayName = HoverCardPrimitive.Content.displayName;

export { HoverCard, HoverCardTrigger, HoverCardContent };
