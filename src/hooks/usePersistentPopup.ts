import { useState, useCallback } from "react";

/**
 * Custom hook to handle persistent behavior for popups (Dialog, Sheet, etc.)
 * Prevents closure on outside click/Escape and triggers a shake animation.
 */
export function usePersistentPopup() {
  const [isBlocking, setIsBlocking] = useState(false);

  const handlePointerDownOutside = useCallback((e: Event) => {
    e.preventDefault();
    setIsBlocking(true);
    setTimeout(() => setIsBlocking(false), 400);
  }, []);

  const handleEscapeKeyDown = useCallback((e: KeyboardEvent) => {
    e.preventDefault();
    setIsBlocking(true);
    setTimeout(() => setIsBlocking(false), 400);
  }, []);

  return {
    isBlocking,
    onPointerDownOutside: handlePointerDownOutside,
    onEscapeKeyDown: handleEscapeKeyDown,
  };
}
