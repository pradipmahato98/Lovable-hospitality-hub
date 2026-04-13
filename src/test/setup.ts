import { vi } from 'vitest';

// Mock the Crypto API for Node.js environment
if (!globalThis.crypto) {
  const cryptoMock = {
    getRandomValues: <T extends Uint8Array | Uint32Array>(arr: T): T => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * (arr instanceof Uint8Array ? 256 : 4294967296));
      }
      return arr;
    },
    randomUUID: () => '12345678-1234-1234-1234-123456789012'
  };

  Object.defineProperty(globalThis, 'crypto', {
    value: cryptoMock,
    writable: true,
    configurable: true
  });
}
