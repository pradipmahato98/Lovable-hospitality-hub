import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock window.crypto for Vitest environment
Object.defineProperty(window, "crypto", {
  value: {
    getRandomValues: (arr: Uint32Array | Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * (arr instanceof Uint32Array ? 0xffffffff : 256));
      }
      return arr;
    },
    randomUUID: () => {
      return "12345678-1234-1234-1234-1234567890ab";
    }
  }
});
