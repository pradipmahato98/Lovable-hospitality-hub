import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { X } from "lucide-react";
import { usePersistentPopup } from "@/hooks/usePersistentPopup";

import { cn } from "@/lib/utils";

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = PopoverPrimitive.Trigger;

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, children, ...props }, ref) => {
  const { isBlocking, handlePointerDownOutside, handleEscapeKeyDown } = usePersistentPopup();

  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        onPointerDownOutside={handlePointerDownOutside}
        onEscapeKeyDown={handleEscapeKeyDown}
        className={cn(
          "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 overflow-visible",
          isBlocking && "animate-shake animate-blink",
          className,
        )}
        {...props}
      >
        <div className="relative flex flex-col h-full w-full">
          {children}
          <PopoverPrimitive.Close className="absolute right-[-10px] top-[-10px] rounded-full h-6 w-6 flex items-center justify-center bg-black/20 hover:bg-black/40 text-white transition-all focus:outline-none focus:ring-2 focus:ring-ring z-[60]">
            <X className="h-3 w-3" />
            <span className="sr-only">Close</span>
          </PopoverPrimitive.Close>
        </div>
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  );
});
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverTrigger, PopoverContent };
