import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock Web Crypto for jsdom if not present
if (!globalThis.crypto) {
  Object.defineProperty(globalThis, "crypto", {
    value: {
      getRandomValues: <T extends Uint32Array | Uint8Array>(arr: T): T => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * (arr instanceof Uint32Array ? 0xffffffff : 0xff));
        }
        return arr;
      },
    },
    configurable: true,
    writable: true
  });
}
