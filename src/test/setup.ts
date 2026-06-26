import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock the global crypto object for environments that don't have it (like older Node.js versions in jsdom)
if (!globalThis.crypto) {
  Object.defineProperty(globalThis, 'crypto', {
    value: {
      getRandomValues: (arr: any) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
      },
    },
    configurable: true,
    writable: true
  });
}
