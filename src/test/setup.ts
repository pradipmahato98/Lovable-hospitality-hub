import { describe, it, expect, vi } from "vitest";

// Mock for crypto.getRandomValues if needed (though it should be available in Node 19+)
if (typeof globalThis.crypto === 'undefined') {
  Object.defineProperty(globalThis, 'crypto', {
    value: {
      getRandomValues: <T extends Uint32Array | Uint8Array>(arr: T): T => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * (arr instanceof Uint8Array ? 256 : 4294967296));
        }
        return arr;
      }
    }
  });
}

import "@testing-library/jest-dom";
