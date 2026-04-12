import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock global crypto for Vitest environment
Object.defineProperty(globalThis, "crypto", {
  value: {
    getRandomValues: <T extends Uint32Array | Uint8Array>(arr: T): T => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * (arr instanceof Uint32Array ? 0xffffffff : 0xff));
      }
      return arr;
    },
    randomUUID: () => "12345678-1234-1234-1234-123456789012"
  },
  writable: true
});
