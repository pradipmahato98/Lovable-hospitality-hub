import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock global crypto for Node environment
Object.defineProperty(globalThis, "crypto", {
  value: {
    getRandomValues: <T extends Uint32Array | Uint8Array>(arr: T): T => {
      for (let i = 0; i < arr.length; i++) {
        if (arr instanceof Uint8Array) {
          arr[i] = Math.floor(Math.random() * 256);
        } else if (arr instanceof Uint32Array) {
          arr[i] = Math.floor(Math.random() * 4294967296);
        }
      }
      return arr;
    },
    randomUUID: () => "00000000-0000-0000-0000-000000000000",
  },
  configurable: true,
});
