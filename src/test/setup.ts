import "@testing-library/jest-dom";
import { randomBytes } from "node:crypto";

// Mock for Web Crypto API in jsdom
if (typeof globalThis.crypto === "undefined") {
  Object.defineProperty(globalThis, "crypto", {
    value: {
      getRandomValues: <T extends Uint32Array | Uint8Array>(arr: T): T => {
        const bytes = randomBytes(arr.byteLength);
        const view = new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
        view.set(bytes);
        return arr;
      },
    },
    configurable: true,
    writable: true,
  });
}
