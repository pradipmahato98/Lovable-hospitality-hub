import { useState, useCallback } from "react";
import { useUIPreferences } from "./useSettings";

/**
 * Hook to manage persistent behavior for Radix UI popups (Dialog, Sheet, Popover, Dropdown).
 * It prevents closure on outside clicks or Escape key presses and provides an `isBlocking`
 * state that can be used to trigger a visual "shake" animation.
 */
export function usePersistentPopup() {
  const { data: prefs } = useUIPreferences();
  const [isBlocking, setIsBlocking] = useState(false);

  const triggerBlock = useCallback(() => {
    setIsBlocking(true);
    // 400ms matches the 'animate-shake' duration in tailwind.config.ts
    setTimeout(() => setIsBlocking(false), 400);
  }, []);

  const handlePointerDownOutside = useCallback((event: CustomEvent, originalHandler?: (event: CustomEvent) => void) => {
    if (prefs?.persistent_popups) {
      event.preventDefault();
      triggerBlock();
    }
    originalHandler?.(event);
  }, [triggerBlock, prefs?.persistent_popups]);

  const handleEscapeKeyDown = useCallback((event: KeyboardEvent, originalHandler?: (event: KeyboardEvent) => void) => {
    if (prefs?.persistent_popups) {
      event.preventDefault();
      triggerBlock();
    }
    originalHandler?.(event);
  }, [triggerBlock, prefs?.persistent_popups]);

  return {
    isBlocking,
    handlePointerDownOutside,
    handleEscapeKeyDown,
  };
}
