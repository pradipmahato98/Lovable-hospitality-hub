import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock global crypto
Object.defineProperty(globalThis, "crypto", {
  value: {
    getRandomValues: <T extends Uint32Array | Uint8Array>(arr: T): T => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * (arr instanceof Uint8Array ? 256 : 4294967296));
      }
      return arr;
    },
    randomUUID: () => "00000000-0000-0000-0000-000000000000",
  },
});
