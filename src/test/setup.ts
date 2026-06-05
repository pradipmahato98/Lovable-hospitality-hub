/**
 * Vitest Setup File
 *
 * Provides browser-compatible mocks for Node.js test environment.
 */
import "@testing-library/jest-dom";

// Mock globalThis.crypto for cross-environment support in utilities
if (!globalThis.crypto) {
  (globalThis as unknown as { crypto: unknown }).crypto = {
    getRandomValues: <T extends Uint32Array | Uint8Array>(arr: T): T => {
      for (let i = 0; i < arr.length; i++) {
        // Use Math.random for test determinism or basic mock in Node
        arr[i] = Math.floor(Math.random() * (arr instanceof Uint8Array ? 256 : 4294967296));
      }
      return arr;
    },
    randomUUID: () => "00000000-0000-0000-0000-000000000000"
  };
}
