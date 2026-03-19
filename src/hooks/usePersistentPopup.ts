import { useState, useCallback } from "react";
import { useUIPreferences } from "./useSettings";

/**
 * Hook to manage persistent behavior for Radix UI popups (Dialog, Sheet, Popover, Dropdown).
 * It prevents closure on outside clicks or Escape key presses and provides an `isBlocking`
 * state that can be used to trigger a visual "shake" animation.
 */
export function usePersistentPopup() {
  const [isBlocking, setIsBlocking] = useState(false);
  const { data: uiPrefs } = useUIPreferences();
  const isEnabled = uiPrefs?.persistent_popups ?? true;

  const triggerBlock = useCallback(() => {
    if (!isEnabled) return;
    setIsBlocking(true);
    // 400ms matches the 'animate-shake' duration in tailwind.config.ts
    setTimeout(() => setIsBlocking(false), 400);
  }, [isEnabled]);

  const handlePointerDownOutside = useCallback((event: CustomEvent) => {
    if (!isEnabled) return;
    event.preventDefault();
    triggerBlock();
  }, [isEnabled, triggerBlock]);

  const handleEscapeKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isEnabled) return;
    event.preventDefault();
    triggerBlock();
  }, [isEnabled, triggerBlock]);

  return {
    isBlocking: isEnabled && isBlocking,
    handlePointerDownOutside,
    handleEscapeKeyDown,
  };
}
