import "@testing-library/jest-dom";
import { expect, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// Mock globalThis.crypto for JSDOM environment
if (!globalThis.crypto) {
  Object.defineProperty(globalThis, "crypto", {
    value: {
      getRandomValues: <T extends Uint32Array | Uint8Array>(arr: T): T => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
      },
    },
    configurable: true,
  });
} else if (!globalThis.crypto.getRandomValues) {
  Object.defineProperty(globalThis.crypto, "getRandomValues", {
    value: <T extends Uint32Array | Uint8Array>(arr: T): T => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
    configurable: true,
  });
}

afterEach(() => {
  cleanup();
});
