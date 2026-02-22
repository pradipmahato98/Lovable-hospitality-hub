import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock window.crypto for tests
if (typeof window !== "undefined" && !window.crypto) {
  Object.defineProperty(window, "crypto", {
    value: {
      getRandomValues: (arr: Uint32Array | Uint8Array) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
      },
    },
  });
}
