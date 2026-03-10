import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { X } from "lucide-react";
import { usePersistentPopup } from "@/hooks/usePersistentPopup";

import { cn } from "@/lib/utils";

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = PopoverPrimitive.Trigger;

import { X } from "lucide-react";
import { usePersistentPopup } from "@/hooks/usePersistentPopup";

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => {
  const { handleInteractionOutside, setClosing, animationClass } = usePersistentPopup();
  const { onEscapeKeyDown, onInteractOutside, ...otherProps } = props;

  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        {...otherProps}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          animationClass,
          className,
        )}
        onInteractOutside={(e) => {
          handleInteractionOutside(e);
          onInteractOutside?.(e);
        }}
        onEscapeKeyDown={(e) => {
          handleInteractionOutside(e);
          onEscapeKeyDown?.(e);
        }}
      >
        {props.children}
        <PopoverPrimitive.Close
          className="absolute right-2 top-2 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          onClick={setClosing}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </PopoverPrimitive.Close>
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  );
});
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverTrigger, PopoverContent };
