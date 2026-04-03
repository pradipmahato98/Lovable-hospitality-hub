import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock window.crypto for Vitest/Node.js environment
if (typeof window !== "undefined" && !window.crypto) {
  Object.defineProperty(window, "crypto", {
    value: {
      getRandomValues: (arr: Uint8Array | Uint32Array) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * (arr instanceof Uint32Array ? 0xffffffff : 256));
        }
        return arr;
      },
    },
  });
} else if (typeof global !== "undefined" && !global.crypto) {
  // @ts-expect-error - Mocking crypto for test environment
  global.crypto = {
    getRandomValues: (arr: Uint8Array | Uint32Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * (arr instanceof Uint32Array ? 0xffffffff : 256));
      }
      return arr;
    },
  };
}
