import { useState, useCallback } from "react";

/**
 * Hook to manage persistent behavior for Radix UI popups (Dialog, Sheet, Popover, Dropdown).
 * It prevents closure on outside clicks or Escape key presses and provides an `isBlocking`
 * state that can be used to trigger a visual "shake" animation.
 */
export function usePersistentPopup() {
  const [isBlocking, setIsBlocking] = useState(false);

  const triggerBlock = useCallback(() => {
    setIsBlocking(true);
    // 400ms matches the 'animate-shake' duration in tailwind.config.ts
    setTimeout(() => setIsBlocking(false), 400);
  }, []);

  const handlePointerDownOutside = useCallback((event: CustomEvent) => {
    event.preventDefault();
    triggerBlock();
  }, [triggerBlock]);

  const handleEscapeKeyDown = useCallback((event: KeyboardEvent) => {
    event.preventDefault();
    triggerBlock();
  }, [triggerBlock]);

  return {
    isBlocking,
    handlePointerDownOutside,
    handleEscapeKeyDown,
  };
}
