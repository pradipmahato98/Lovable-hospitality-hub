import { vi } from "vitest";

// Mock globalThis.crypto for Vitest environment
Object.defineProperty(globalThis, "crypto", {
  value: {
    getRandomValues: <T extends Uint32Array | Uint8Array>(arr: T): T => {
      if (arr instanceof Uint32Array) {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 4294967296);
        }
      } else if (arr instanceof Uint8Array) {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256);
        }
      }
      return arr;
    },
  },
  configurable: true,
});
