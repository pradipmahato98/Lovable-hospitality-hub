import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock globalThis.crypto for Vitest environment
if (typeof globalThis.crypto === "undefined") {
  Object.defineProperty(globalThis, "crypto", {
    value: {
      getRandomValues: <T extends Uint32Array | Uint8Array>(arr: T): T => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
      },
    },
  });
}
