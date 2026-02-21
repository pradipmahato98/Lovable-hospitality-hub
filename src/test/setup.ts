import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock window.crypto for tests
if (typeof window !== "undefined" && !window.crypto) {
  Object.defineProperty(window, 'crypto', {
    value: {
      getRandomValues: (buffer: Uint8Array) => {
      for (let i = 0; i < buffer.length; i++) {
        buffer[i] = Math.floor(Math.random() * 256);
      }
        return buffer;
      },
    },
    writable: true,
  });
}
