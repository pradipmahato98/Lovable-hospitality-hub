/**
 * Vitest setup for mocking browser APIs in Node.js
 */

// Mock crypto.getRandomValues for cryptographically secure random values in tests
if (typeof globalThis.crypto === 'undefined' || !globalThis.crypto.getRandomValues) {
  const cryptoMock = {
    getRandomValues: <T extends Uint32Array | Uint8Array>(arr: T): T => {
      for (let i = 0; i < arr.length; i++) {
        // Mock with Math.random for test environments (not for production!)
        if (arr instanceof Uint8Array) {
          arr[i] = Math.floor(Math.random() * 256);
        } else if (arr instanceof Uint32Array) {
          arr[i] = Math.floor(Math.random() * 4294967296);
        }
      }
      return arr;
    },
    // Add other crypto methods if needed by utilities
    randomUUID: () => '00000000-0000-0000-0000-000000000000'
  };

  if (typeof globalThis.crypto === 'undefined') {
    (globalThis as unknown as { crypto: unknown }).crypto = cryptoMock;
  } else {
    Object.defineProperty(globalThis.crypto, 'getRandomValues', {
      value: cryptoMock.getRandomValues,
      configurable: true
    });
    Object.defineProperty(globalThis.crypto, 'randomUUID', {
      value: cryptoMock.randomUUID,
      configurable: true
    });
  }
}

import "@testing-library/jest-dom";
