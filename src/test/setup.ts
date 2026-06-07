/**
 * Vitest Global Setup
 *
 * Provides browser API mocks for the Node.js test environment.
 */
import "@testing-library/jest-dom";

// Mock global crypto for Node.js environment
if (typeof globalThis.crypto === 'undefined') {
  (globalThis as unknown as { crypto: unknown }).crypto = {
    getRandomValues: <T extends Uint32Array | Uint8Array>(arr: T): T => {
      const isUint32 = arr instanceof Uint32Array;
      const range = isUint32 ? 4294967296 : 256;
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * range);
      }
      return arr;
    },
    randomUUID: () => "00000000-0000-0000-0000-000000000000"
  };
}
