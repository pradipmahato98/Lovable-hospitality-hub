import { expect } from "vitest";

// Mock window.crypto for the testing environment
const cryptoMock = {
  getRandomValues: <T extends Uint8Array | Uint32Array>(arr: T): T => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * (arr instanceof Uint32Array ? 0xffffffff : 0xff));
    }
    return arr;
  },
};

Object.defineProperty(globalThis, "window", {
  value: { crypto: cryptoMock },
  writable: true,
});

Object.defineProperty(globalThis, "crypto", {
  value: cryptoMock,
  writable: true,
});
