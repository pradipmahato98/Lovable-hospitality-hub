import { useState, useCallback, useRef } from "react";

export function usePersistentPopup() {
  const [isBlocking, setIsBlocking] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerFeedback = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setIsBlocking(true);
    timeoutRef.current = setTimeout(() => {
      setIsBlocking(false);
    }, 400); // Matches animation duration
  }, []);

  const handlePointerDownOutside = useCallback((e: Event) => {
    e.preventDefault();
    triggerFeedback();
  }, [triggerFeedback]);

  const handleEscapeKeyDown = useCallback((e: KeyboardEvent) => {
    e.preventDefault();
    triggerFeedback();
  }, [triggerFeedback]);

  return {
    isBlocking,
    handlePointerDownOutside,
    handleEscapeKeyDown,
    triggerFeedback
  };
}
