
import * as React from "react";

/**
 * Custom hook to manage persistent pop-up behavior.
 * Prevents closing on outside interaction or Escape key,
 * and provides a shake/blink animation for feedback.
 */
export function usePersistentPopup() {
  const [isShaking, setIsShaking] = React.useState(false);
  const isClosingRef = React.useRef(false);

  const handleInteractionOutside = (e: React.BaseSyntheticEvent | MouseEvent | KeyboardEvent | { preventDefault: () => void }) => {
    if (isClosingRef.current) return;

    // Check if event has preventDefault (standard React/DOM events)
    if (e && 'preventDefault' in e) {
      e.preventDefault();
    }

    // Trigger animation
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 400);
  };

  const setClosing = () => {
    isClosingRef.current = true;
  };

  return {
    isShaking,
    handleInteractionOutside,
    setClosing,
    animationClass: isShaking ? "animate-shake animate-blink" : ""
  };
}
