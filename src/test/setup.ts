import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock global crypto for testing random value generation
if (!globalThis.crypto) {
  (globalThis as unknown as { crypto: unknown }).crypto = {
    getRandomValues: <T extends Uint32Array | Uint8Array>(arr: T): T => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * (arr instanceof Uint32Array ? 4294967296 : 256));
      }
      return arr;
    },
    randomUUID: () => '00000000-0000-0000-0000-000000000000'
  };
} else if (!globalThis.crypto.getRandomValues) {
  Object.defineProperty(globalThis.crypto, 'getRandomValues', {
    value: <T extends Uint32Array | Uint8Array>(arr: T): T => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * (arr instanceof Uint32Array ? 4294967296 : 256));
      }
      return arr;
    },
    configurable: true,
    writable: true
  });
}
