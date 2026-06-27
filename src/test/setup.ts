import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock crypto
const cryptoMock = {
  getRandomValues: <T extends Uint32Array | Uint8Array>(arr: T): T => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  },
  randomUUID: () => "test-uuid-1234",
};

Object.defineProperty(globalThis, "crypto", {
  value: cryptoMock,
  configurable: true,
  writable: true,
});
