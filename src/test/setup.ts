import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock global crypto for Node.js environment
Object.defineProperty(globalThis, "crypto", {
  value: {
    getRandomValues: <T extends Uint8Array | Uint32Array>(arr: T): T => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * (arr instanceof Uint32Array ? 0xffffffff : 0xff));
      }
      return arr;
    },
  },
});
