/**
 * Vitest setup file
 * Mocks the global crypto object for testing in environments where it's not available (like JSDOM)
 */

import { vi } from "vitest";

// Mocking crypto.getRandomValues
const cryptoMock = {
  getRandomValues: <T extends Uint32Array | Uint8Array>(arr: T): T => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * (arr instanceof Uint32Array ? 0xffffffff : 0xff));
    }
    return arr;
  },
  randomUUID: () => "12345678-1234-1234-1234-123456789012"
};

Object.defineProperty(globalThis, 'crypto', {
  value: cryptoMock,
  configurable: true,
  writable: true
});
